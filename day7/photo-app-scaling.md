# Photo-Sharing Application System Architecture & Scaling Plan

## 1. System Requirements & Traffic Assumptions

### Traffic & Storage Estimates
* **Daily Active Users (DAU):** 5,000,000 users.
* **Upload Volume:** Assuming 20% of active users upload 1 photo daily:
  $$\text{Daily Uploads} = 5,000,000 \times 0.20 = 1,000,000 \text{ photos/day}$$
* **Average Image Size:** 3 MB per uncompressed high-resolution photo.
* **Daily Ingress Storage:** 
  $$1,000,000 \times 3 \text{ MB} = 3,000,000 \text{ MB} \approx 3 \text{ TB/day}$$
* **Read vs. Write Ratio:** Heavily read-heavy at approximately **20:1** (users view ~20 photos for every photo uploaded).
---

## 2. Database Schema & Storage Strategy

### Relational Schema (Metadata)
User profile details, image metadata, and follow connections are stored in a relational database cluster (e.g., PostgreSQL/MySQL) using primary keys, foreign keys, and indexes for fast queries.

* **`users` table:** `user_id` (PK), `username`, `email`, `created_at`
* **`photos` table:** `photo_id` (PK), `user_id` (FK), `s3_url`, `caption`, `created_at`
* **`follows` table:** `follower_id` (FK), `followee_id` (FK), `created_at`

### Image Object Storage Strategy
* **Binary File Storage:** Raw photo binaries are **never** stored in the SQL database. They are uploaded directly to cloud object storage (e.g., AWS S3 / Google Cloud Storage) using pre-signed URLs to offload heavy payload streams from application servers.
* **Database Metadata Link:** The database stores only metadata and the public S3 URL endpoint (e.g., `https://cdn.photoapp.com/uploads/photo_12345.jpg`).
---

## 3. Caching, Content Delivery Networks (CDN) & Feed Optimization

### Content Delivery Network (CDN)
* Image assets are cached globally at edge locations using a CDN (e.g., Cloudflare, CloudFront). 
* When a user requests a photo, the image is served from the geographically nearest CDN edge node instead of hitting the origin object storage, reducing latency and reducing bandwidth costs.

### In-Memory Caching Strategy
* **Redis / Memcached:** Frequently accessed data—such as user profiles, photo metadata, and recent user feeds—is cached in an in-memory Redis cluster to avoid expensive database read queries.
* **Cache Invalidation:** Cache entries use a Cache-Aside strategy with Time-To-Live (TTL) expiration and event-driven invalidation when photos or profiles are updated.

### Feed Generation Strategy
* **Hybrid Push/Pull Architecture:**
  * **Fan-out on Write (Push):** For regular users, when a photo is uploaded, a background worker pushes the photo ID directly into the Redis feed lists of all their followers.
  * **Fan-out on Read (Pull):** For high-follower accounts ("celebrity problem"), followers dynamically fetch and assemble the feed from database/cache upon loading to prevent massive write traffic spikes.
---

## 4. Database Scaling & Horizontal Architecture Strategy

### Database Read Scaling (Read Replicas)
Because read queries far outweigh writes (20:1 ratio), database load is managed by deploying a **Primary-Replica (Master-Slave)** architecture.
* **Primary Database:** Handles all write operations (`INSERT`, `UPDATE`, `DELETE`).
* **Read Replicas:** Multiple read-only database instances handle load-balanced `SELECT` queries.

### Database Write Scaling (Sharding)
As user volume scales beyond a single primary instance's storage and write limits, horizontal partitioning (**sharding**) is applied.
* **Sharding Key:** `user_id` is chosen as the shard key, ensuring that all photos, profiles, and relationships for a given user map to the same database shard.
* **Benefits:** Distributes write throughput and storage evenly across multiple independent database nodes.

### Microservices & Load Balancing
* **Application Load Balancers (ALB):** Incoming HTTPS traffic is distributed across stateless application servers using round-robin and least-connections algorithms.
* **Stateless Application Servers:** App servers store no session state locally (sessions are managed via JWT / Redis), allowing instant auto-scaling during traffic spikes.
