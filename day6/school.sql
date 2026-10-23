-- 0. CLEANUP (Allows running the script multiple times without errors)
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- 1. CREATE TABLES

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (student_id, course_id) -- Prevents enrolling the same student on the same course twice
);


-- 2. INSERT SAMPLE DATA

-- Insert 4 Students (includes 1 student with no enrolments)
INSERT INTO students (first_name, last_name, email) VALUES
('John', 'Kamau', 'john.kamau@example.com'),
('Grace', 'Wanjiku', 'grace.wanjiku@example.com'),
('David', 'Ochieng', 'david.ochieng@example.com'),
('Amina', 'Hassan', 'amina.hassan@example.com');

-- Insert 3 Courses
INSERT INTO courses (course_name, code) VALUES
('Web Foundations', 'WEB101'),
('Database Systems', 'DB201'),
('Software Engineering', 'SE301');

-- Insert 5 Enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'A'), -- John -> Web Foundations
(1, 2, 'B'), -- John -> Database Systems
(2, 1, 'A'), -- Grace -> Web Foundations
(2, 3, 'A'), -- Grace -> Software Engineering
(3, 2, 'B'); -- David -> Database Systems


-- 3. FIVE REQUIRED QUERIES

-- Query 1: All courses for one student (by name)
SELECT c.course_name, c.code, e.grade
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE s.first_name = 'John' AND s.last_name = 'Kamau';

-- Query 2: All students on one course
SELECT s.first_name, s.last_name, s.email, e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE c.course_name = 'Web Foundations';

-- Query 3: The number of students per course
SELECT c.course_name, COUNT(e.student_id) AS total_students
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name;

-- Query 4: Students who have no enrolments
SELECT s.first_name, s.last_name, s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 3 AND course_id = 2;
