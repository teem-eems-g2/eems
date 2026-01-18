-- EEMS Database Schema
-- PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'instructor', 'grader', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('mcq', 'truefalse', 'numeric', 'short')),
  question_text TEXT NOT NULL,
  options JSONB, -- For MCQ options
  correct_answer TEXT,
  marks INTEGER NOT NULL,
  question_order INTEGER
);

-- Student answers table
CREATE TABLE IF NOT EXISTS student_answers (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT,
  marks_awarded INTEGER,
  graded_by INTEGER REFERENCES users(id),
  graded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  exam_id INTEGER REFERENCES exams(id),
  total_score INTEGER,
  percentage DECIMAL(5,2),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for testing
INSERT INTO users (email, password_hash, role) VALUES
('instructor@test.com', '$2b$10$hashedpassword', 'instructor'),
('student@test.com', '$2b$10$hashedpassword', 'student'),
('grader@test.com', '$2b$10$hashedpassword', 'grader'),
('admin@test.com', '$2b$10$hashedpassword', 'admin');