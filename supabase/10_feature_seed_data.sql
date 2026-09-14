-- ====================================================================
-- FEATURE: SEED DATA (10_feature_seed_data.sql)
-- GVM EDULMS — Comprehensive Baseline & Demo Data for All System Features
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. BASELINE PROFILES
INSERT INTO public."Profile" (id, full_name, email, avatar_url, role, teacher_status, bio)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Sumit Saurav (Admin)', 'admin@gvmedu.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'admin', 'approved', 'Principal System Administrator & Registrar.'),
  ('00000000-0000-0000-0000-000000000002', 'Prof. Ramesh Sharma', 'teacher@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'teacher', 'approved', 'Senior Educator with 15+ years experience in PCM & Computer Science.'),
  ('00000000-0000-0000-0000-000000000003', 'Dr. Emily Watson', 'emily.physics@example.com', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'teacher', 'approved', 'PhD in Physics. Passionate about conceptual demonstrations.'),
  ('00000000-0000-0000-0000-789003609732', 'Harsh Kumar', 'harsh@gvmedu.com', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', 'student', 'approved', '11th Grade Science Scholar.'),
  ('00000000-0000-0000-0000-789011391300', 'Demo Student', 'demo@gvmedu.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'student', 'approved', 'General Curriculum Student.')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 2. COURSE CATEGORIES
INSERT INTO public.course_categories (name, slug, is_default, display_order)
VALUES 
    ('Programming', 'programming', true, 1),
    ('Physics', 'physics', true, 2),
    ('Chemistry', 'chemistry', true, 3),
    ('Mathematics', 'mathematics', true, 4),
    ('Biology', 'biology', true, 5),
    ('General', 'general', true, 6)
ON CONFLICT (name) DO NOTHING;

-- 3. BASELINE COURSES
INSERT INTO public.courses (id, teacher_id, title, description, thumbnail_url, category, status, price)
VALUES
  ('00000000-0000-0000-0000-789005241496', '00000000-0000-0000-0000-000000000002', '11th PCM', 'Complete Class 11 curriculum for Physics, Chemistry, and Mathematics with deep concept breakdowns.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80', 'Physics', 'published', 0.00),
  ('00000000-0000-0000-0000-789033964620', '00000000-0000-0000-0000-000000000003', 'Physics', 'Electromagnetism, Optics, and Modern Physics for competitive exams and board preparations.', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80', 'Physics', 'published', 0.00)
ON CONFLICT (id) DO NOTHING;

-- 4. CHAPTERS & LECTURES FOR 11th PCM
INSERT INTO public.chapters (id, course_id, title, description, chapter_order)
VALUES
  ('aaaa1111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-789005241496', 'Unit 1 — Kinematics & Mechanics', 'Motion in a straight line, vectors, and Newton laws of motion.', 1),
  ('aaaa1111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-789005241496', 'Unit 2 — Structure of Atom & Chemical Bonding', 'Bohr model, quantum numbers, and molecular orbital theory.', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lectures (id, chapter_id, title, description, video_path, duration, lecture_order, is_published, is_free_preview)
VALUES
  ('bbbb1111-0000-0000-0000-000000000001', 'aaaa1111-0000-0000-0000-000000000001', 'Lecture 01: Vectors & Motion in Two Dimensions', 'Foundational vectors, dot/cross products, and projectile motion trajectory equations.', '/videos/sample-short-1.mp4', 720, 1, true, true),
  ('bbbb1111-0000-0000-0000-000000000002', 'aaaa1111-0000-0000-0000-000000000001', 'Lecture 02: Work, Energy & Conservation Laws', 'Kinetic energy, potential energy theorem, conservative forces, and momentum.', '/videos/sample-short-2.mp4', 940, 2, true, false)
ON CONFLICT (id) DO NOTHING;

-- 5. COURSE ENROLLMENTS
INSERT INTO public.enrollments (id, student_id, course_id)
VALUES
  ('eeee1111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-789003609732', '00000000-0000-0000-0000-789005241496'),
  ('eeee1111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-789011391300', '00000000-0000-0000-0000-789005241496')
ON CONFLICT (id) DO NOTHING;

-- 6. FEE MANAGEMENT SEED DATA
INSERT INTO public.fee_categories (id, name, code, description, is_refundable) VALUES
  ('11f72090-16ca-472c-bf2e-9176b1467660', 'Tuition Fee', 'TUI', 'Core instructional and classroom tuition', false),
  ('e5e22d4b-47c1-4a3e-904e-444148d672b6', 'Admission Fee', 'ADM', 'One-time enrollment and registration fee', false),
  ('3f4d98a5-deec-49d1-b745-ff8fb4a67944', 'Laboratory Fee', 'LAB', 'Practical lab equipment and consumables fee', false),
  ('7dd217f2-d284-462e-8d44-26e80048fee6', 'Library Fee', 'LIB', 'Library resource access and digital subscriptions', false),
  ('a61395ed-b335-4d79-8dd6-29894f04f770', 'Examination Fee', 'EXAM', 'Semester and annual examination fees', false),
  ('69b5bfbd-2b33-449d-b213-462b1781bdc3', 'Development Fee', 'DEV', 'Campus infrastructure and development fund', false),
  ('ec42a573-f37e-4f4e-a68f-6fa084d40249', 'General Fee', 'GEN', 'General miscellaneous institutional fees', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fee_structures (id, name, course_id, batch_year, frequency, total_amount, due_date, grace_period_days, late_fine_per_day, max_late_fine, is_active)
VALUES 
  ('295cddcd-d4bd-40da-8553-db4fffdbb86a', '11th PCM - Batch 2026-2027 (Per Semester)', '00000000-0000-0000-0000-789005241496', '2026-2027', 'semester', 50000.00, '2026-10-31', 7, 50.00, 1500.00, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fee_structure_items (id, structure_id, category_id, amount, is_optional)
VALUES
  ('80df1b7d-39ef-4801-bb5b-ed1157d6e29e', '295cddcd-d4bd-40da-8553-db4fffdbb86a', '11f72090-16ca-472c-bf2e-9176b1467660', 50000.00, false)
ON CONFLICT (id) DO NOTHING;

-- 7. EDUCATIONAL SHORTS SEED DATA
INSERT INTO public.shorts (id, title, description, video_url, thumbnail_url, duration, teacher_id, course_id, course_title, views_count, likes_count, tags, is_published)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '⚡ Java Heap vs Stack Memory in 45 Seconds!', 'Understand how references live on the Stack while dynamic objects reside in Heap memory.', '/videos/sample-short-1.mp4', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80', 45, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-789005241496', '11th PCM', 14200, 852, ARRAY['Programming', 'Java', 'Memory'], true),
  ('a2222222-2222-2222-2222-222222222222', '🧲 Right-Hand Thumb Rule Visualized', 'Point thumb along current vector, curl fingers — see magnetic field lines in 3D!', '/videos/sample-short-2.mp4', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80', 52, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-789033964620', 'Physics', 9840, 614, ARRAY['Physics', 'Electromagnetism', 'Class12'], true)
ON CONFLICT (id) DO NOTHING;
