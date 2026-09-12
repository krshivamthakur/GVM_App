-- ====================================================================
-- EDUCATION LMS — SUPABASE SEED DATA SCRIPT
-- Run this in your Supabase SQL Editor to populate starter data
-- ====================================================================

-- 1. Insert Initial Profiles (Matching Supabase Auth UUIDs or Demo UUIDs)
INSERT INTO public.profiles (id, full_name, email, avatar_url, role, teacher_status, bio)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Alex Johnson', 'student@example.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'student', 'approved', 'Computer Science enthusiast & aspiring Fullstack Engineer.'),
  ('00000000-0000-0000-0000-000000000002', 'Prof. Ramesh Sharma', 'teacher@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'teacher', 'approved', 'Senior Software Architect and Computer Science Educator with 15+ years experience.'),
  ('00000000-0000-0000-0000-000000000003', 'Dr. Emily Watson', 'emily.physics@example.com', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'teacher', 'approved', 'PhD in Theoretical Physics. Passionate about simplifying complex science concepts.')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Starter Courses
INSERT INTO public.courses (id, teacher_id, title, description, thumbnail_url, category, status, price)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Java Programming Complete Masterclass', 'Master Java from core object-oriented principles, multithreading, and collections to advanced software architecture and JVM internals.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80', 'Programming', 'published', 0.00),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 'Physics Class 12 & JEE: Electromagnetism & Optics', 'Comprehensive physics lectures covering Electrostatics, Current Electricity, Magnetism, Electromagnetic Induction, and Wave Optics.', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80', 'Physics', 'published', 0.00),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', 'Organic Chemistry: Reactions & Mechanisms for NEET', 'In-depth breakdown of Reaction Mechanisms, Hydrocarbons, Biomolecules, and Named Reactions designed for competitive excellence.', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80', 'Chemistry', 'published', 0.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Chapters for Java Masterclass
INSERT INTO public.chapters (id, course_id, title, description, chapter_order)
VALUES
  ('aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Chapter 1 — Introduction to Java & Environment Setup', 'Understanding the JVM, JRE, JDK, bytecode compilation, and setting up your IDE.', 1),
  ('aaaa1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Chapter 2 — Variables, Data Types & Control Structures', 'Primitive and reference types, operators, conditionals, and loops.', 2),
  ('aaaa1111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Chapter 3 — Object Oriented Programming (OOP)', 'Classes, Objects, Constructors, Memory Heap vs Stack, Encapsulation.', 3)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Lectures
INSERT INTO public.lectures (id, chapter_id, title, description, video_path, duration, lecture_order, is_published, is_free_preview)
VALUES
  ('bbbb1111-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000001', 'Lecture 01: Introduction to Java Ecosystem & Architecture', 'In this lecture, we explore how Java achieves platform independence via the JVM, the role of bytecode, and writing our first Hello World program.', '/videos/sample-short-1.mp4', 720, 1, true, true),
  ('bbbb1111-0000-0000-0000-000000000002', 'aaaa1111-0000-0000-0000-000000000001', 'Lecture 02: Setting Up JDK, IntelliJ & VS Code', 'Step-by-step setup of the Java Development Kit (JDK 21), configuring environment variables (JAVA_HOME), and preparing modern developer tools.', '/videos/sample-short-2.mp4', 940, 2, true, true),
  ('bbbb1111-0000-0000-0000-000000000003', 'aaaa1111-0000-0000-0000-000000000002', 'Lecture 03: Primitive Data Types, Memory Allocation & Type Casting', 'Deep dive into primitive variables and arithmetic operations in Java.', '/videos/sample-short-1.mp4', 1120, 1, true, false)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Notes
INSERT INTO public.notes (id, lecture_id, title, file_path, file_type)
VALUES
  ('cccc1111-0000-0000-0000-000000000001', 'bbbb1111-0000-0000-0000-000000000001', 'Java Architecture & Bytecode Cheatsheet (PDF)', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'application/pdf'),
  ('cccc1111-0000-0000-0000-000000000002', 'bbbb1111-0000-0000-0000-000000000002', 'IDE Configuration & Shortcut Reference Guide (PDF)', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'application/pdf')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Starter Enrollment
INSERT INTO public.enrollments (id, student_id, course_id)
VALUES
  ('eeee1111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Starter Lecture Progress
INSERT INTO public.lecture_progress (id, student_id, lecture_id, watched_seconds, completed)
VALUES
  ('ffff1111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'bbbb1111-0000-0000-0000-000000000001', 720, true)
ON CONFLICT (id) DO NOTHING;
