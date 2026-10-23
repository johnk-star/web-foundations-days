# Photo-Sharing Application System Architecture & Scaling Plan

## 1. System Requirements & Traffic Estimations

### Baseline Assumptions
* **Registered Users:** 10,000,000 users.
* **Daily Active Users (DAU):** 10% of registered users = **1,000,000 DAU**.
* **Feed Viewing Activity:** Each DAU views 50 feed pages/day.
* **Upload Activity:** Each DAU uploads 1 photo/day = **1,000,000 uploads/day**.
* **Average Photo Size:** 2 MB.
* **Thumbnail Size:** 50 KB (0.05 MB) per photo.

---

### System Type Decision: Read-Heavy vs. Write-Heavy
* **Decision:** This system is **heavily Read-Heavy** with a Read-to-Write ratio of **50:1** (50,000,000 feed page reads vs. 1,000,000 uploads daily).
* **Design Implication:** Because read operations dominate throughput, the system architecture must prioritize aggressive multi-layer caching (CDN at edge, Redis in-memory) and database read replicas to offload read traffic, keeping database latency low while writing through a primary database instance.

---

### Mathematical Throughput & Storage Calculations

#### A. Upload Throughput
* **Average Uploads Per Second (Upload RPS):**
  $$\text{Average Upload RPS} = \frac{1,000,000 \text{ uploads}}{86,400 \text{ seconds}} \approx 11.57 \text{ uploads/sec}$$
* **Peak Uploads Per Second (5x Spike):**
  $$\text{Peak Upload RPS} = 11.57 \times 5 \approx 57.87 \text{ uploads/sec}$$

#### B. Feed View Throughput
* **Daily Feed Page Views:** 
  $$1,000,000 \text{ DAU} \times 50 \text{ views/day} = 50,000,000 \text{ feed views/day}$$
* **Average Feed Views Per Second (Read RPS):**
  $$\text{Average Read RPS} = \frac{50,000,000}{86,400} \approx 578.70 \text{ reads/sec}$$
* **Peak Feed Views Per Second (5x Spike):**
  $$\text{Peak Read RPS} = 578.70 \times 5 \approx 2,893.50 \text{ reads/sec}$$

#### C. Storage Calculations (Per Day & Per Year)
* **Raw Image Storage Per Day:**
  $$1,000,000 \text{ photos} \times 2 \text{ MB} = 2,000,000 \text{ MB} = 2,000 \text{ GB/day} \ (2 \text{ TB/day})$$
* **Thumbnail Storage Per Day:**
  $$1,000,000 \text{ photos} \times 0.05 \text{ MB} = 50,000 \text{ MB} = 50 \text{ GB/day}$$
* **Total Storage Per Day:**
  $$2,000 \text{ GB} + 50 \text{ GB} = 2,050 \text{ GB/day} \ (2.05 \text{ TB/day})$$
* **Annual Storage Requirement:**
  $$2,050 \text{ GB/day} \times 365 \text{ days} = 748,250 \text{ GB/year} \approx 748.25 \text{ TB/year}$$

---

## 2. Storage Strategy: Why Photos Live Outside the Database

Photos must **never** be stored directly inside relational database tables as binary blobs because large files rapidly bloat database index sizes, consume valuable RAM, cause expensive disk I/O, and drastically slow down database backups and query execution. Instead, binary photo files and generated thumbnails are stored directly in cloud **Object Storage** (e.g., AWS S3), while the relational database stores only light metadata and the public object storage URL links (e.g., `https://cdn.snapshare.com/photos/photo_123.jpg`).

---

## 3. System Architecture Diagram & Component Explanations
+-----------------------------------------------------------------------------------+
|                                 CLIENT APPLICATIONS                               |
|                             (Web App / iOS / Android)                             |
+-----------------------------------------------------------------------------------+
|                                                       |
| (1) Metadata / Feed Requests                          | (2) Direct S3 Upload
v                                                       v
+-------------------+                                   +-------------------+
|   CDN / Edge      |                                   |  AWS S3 Storage   |
| (CloudFront/CF)   |                                   | (Raw Image Bucket)|
+-------------------+                                   +-------------------+
|                                                       |
| (Load Balanced HTTPS)                                 | (S3 Event Trigger)
v                                                       v
+-------------------+                                   +-------------------+
|   Load Balancer   |                                   |   Message Queue   |
|     (ALB/Nginx)   |                                   |  (RabbitMQ/SQS)   |
+-------------------+                                   +-------------------+
|             |                                                |
v             v                                                v
+-----------------------+                               +-------------------+
|  Stateless App Server |                               | Thumbnail Workers |
|       Cluster         |                               |   (Async Worker)  |
+-----------------------+                               +-------------------+
|             |                                                |
v             v                                                | (Stores Thumbnails)
+----------+  +----------+                                        v
| Redis    |  | Postgre  | <--------------------------------------+
| Cache    |  | SQL      |     (Updates photo record with thumbnail URLs)
| Cluster  |  | (Primary |
+----------+  | & Read   |
| Replicas)|
+----------+
### Component Explanations
1. **CDN (Content Delivery Network):** Caches image files and static assets at edge locations close to users to reduce origin server bandwidth and download latency.
2. **Load Balancer:** Distributes incoming HTTP web traffic across application servers to prevent server overload and ensure high availability.
3. **App Servers:** Runs the core API business logic state-lessly to handle client authorization, feed aggregation, and metadata management.
4. **Redis Cache:** Stores user profiles and pre-calculated feed data in memory to eliminate expensive database queries for feed page reads.
5. **Database (Primary & Read Replicas):** Manages structured metadata in a primary server for writes and scales read throughput using read-only database replicas.
6. **Object Storage (AWS S3):** Provides scalable, low-cost storage designed specifically for storing large uncompressed raw image files and processed thumbnails.
7. **Message Queue (AWS SQS / RabbitMQ):** Holds image processing tasks asynchronously to decouple long-running thumbnail generation jobs from HTTP request-response cycles.
8. **Thumbnail Worker:** Consumes messages from the queue to process raw images into 50 KB thumbnails in the background without blocking the uploading user.

---

## 4. Step-by-Step Photo Upload Flow

1. **Request Authorization:** The client requests upload access from the App Server, which verifies credentials and returns an S3 pre-signed upload URL.
2. **Direct Binary Upload:** The client uploads the raw 2 MB photo directly to Object Storage (S3) using the pre-signed URL, avoiding server bandwidth saturation.
3. **Event Queueing:** Upon receipt, Object Storage emits an `ObjectCreated` event that pushes a message containing file metadata into the Message Queue.
4. **Asynchronous Processing:** A Thumbnail Worker picks up the job from the queue, downloads the raw photo, scales it down to a 50 KB thumbnail, and saves it back to Object Storage.
5. **Metadata Update:** The worker writes a new record into the relational PostgreSQL database containing user ID, raw photo S3 URL, thumbnail S3 URL, and upload timestamp.
6. **Cache Invalidation:** The server appends the new photo ID to the uploader's Redis cache feed and pushes notifications to active followers.

---

## 5. System Design Trade-Off Analysis

### Trade-Off 1: Synchronous Upload Processing vs. Asynchronous Message Queue
* **Option A (Synchronous Processing):** Application servers process and resize thumbnails directly during the client's HTTP POST upload request.
  * *Con:* Forces users to wait several seconds for image processing, causing high server connection holds and high HTTP request timeout rates.
* **Option B (Asynchronous Queue Processing - Chosen):** The client gets an immediate success response upon S3 receipt while background worker nodes process thumbnails off the queue.
  * *Trade-Off:* Adds system architectural complexity with message queues and dead-letter monitoring, but ensures instant user feedback and scalable background processing.

### Trade-Off 2: On-the-Fly Database Joins vs. Pre-computed Redis Feed Caching
* **Option A (Normalized Query Joins):** Construct user feeds on-the-fly using SQL `JOIN` queries between `photos` and `follows` tables whenever a feed page is requested.
  * *Con:* Causes extreme database CPU strain and unacceptable query latency at 2,893.5 peak read queries per second.
* **Option B (Denormalized Redis Caching - Chosen):** Pre-compute and store user feed photo IDs as Redis sorted sets when photos are published.
  * *Trade-Off:* Consumes significantly higher RAM and risks minor eventual consistency delays, but delivers sub-10ms response times required for 50,000,000 daily feed views.
