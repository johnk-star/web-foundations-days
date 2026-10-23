# School Database Design & Architecture

## 1. Table Explanations & Relationships

* **`students`**: Stores basic personal details for each student registered in the school system. Each record represents a unique individual identified by `student_id`.
* **`courses`**: Stores course offering details including the title and course code. Each course is uniquely identified by `course_id`.
* **`enrolments`**: Functions as a junction (join) table connecting `students` and `courses`, while storing attributes specific to a student's participation in a course (e.g., `grade`).

### Entity Relationships
* **One-to-Many Relationships**: A single student can have multiple enrolment records, but each enrolment record belongs to exactly one student. Similarly, a single course can appear in multiple enrolment records, but each enrolment record belongs to exactly one course.
* **Many-to-Many Relationship**: Students and courses have a **many-to-many** relationship because a student can enroll in multiple courses, and a course can contain multiple students.
* **Why a Join Table is Needed**: Relational databases cannot directly express a many-to-many relationship in standard normalized form without creating data redundancy or array storage issues inside a single row. The `enrolments` join table decomposes the many-to-many relationship into two one-to-many relationships (`students` 1:N `enrolments` and `courses` 1:N `enrolments`), maintaining data integrity and allowing contextual attributes like `grade` to be stored directly alongside the link.

---

## 2. Recommended Database Index

* **Index**: `CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);`
* **Reason**: Queries filtering or joining on foreign keys—such as fetching all courses taken by a specific student—frequently scan the `enrolments` table by `student_id`. Without an index, SQLite performs a full table scan over every enrolment record. Adding an index on `student_id` changes lookup time from $O(N)$ linear complexity to $O(\log N)$ logarithmic B-Tree lookup complexity, significantly speeding up query execution as the database grows.

---

## 3. Storage Paradigm Choice: SQL vs. NoSQL

For a school academic database, **SQL (Relational Database)** is the optimal choice. Academic management systems require strict data consistency, structural validation, and complex relational querying—such as generating student transcripts, validating prerequisite completion, and computing grade point averages across multiple courses. SQL relational databases natively enforce foreign key constraints, unique email rules, and ACID transaction guarantees, ensuring that updates to grades or enrolments never result in orphaned records or invalid states. While NoSQL offers flexible document schemas and horizontal scaling, its lack of native schema constraints and join handling makes it less suitable for highly structured relational data model requirements.
