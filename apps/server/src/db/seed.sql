-- Seed data for Algorym dashboard
-- Run: psql -U postgres -d algorym -f apps/server/src/db/seed.sql

-- ============================================================
-- 1. USERS
-- ============================================================

-- Main user (the logged-in user — uses existing UUID)
-- No INSERT needed, user already exists with id: c3504229-2af1-46f5-970b-5e3ccfa26260

-- Guest candidates (Pakistani names)
INSERT INTO users (id, name, email, password_hash, email_verified, created_at) VALUES
('b1000001-0000-0000-0000-000000000001', 'Fatima Khan',     'fatima.khan@example.com',     'x', false, NOW() - INTERVAL '4 months'),
('b1000001-0000-0000-0000-000000000002', 'Ahmed Raza',      'ahmed.raza@example.com',      'x', false, NOW() - INTERVAL '4 months'),
('b1000001-0000-0000-0000-000000000003', 'Ayesha Siddiqui', 'ayesha.siddiqui@example.com', 'x', false, NOW() - INTERVAL '3 months'),
('b1000001-0000-0000-0000-000000000004', 'Omar Farooq',     'omar.farooq@example.com',     'x', false, NOW() - INTERVAL '3 months'),
('b1000001-0000-0000-0000-000000000005', 'Zainab Malik',    'zainab.malik@example.com',    'x', false, NOW() - INTERVAL '3 months'),
('b1000001-0000-0000-0000-000000000006', 'Hassan Ali',      'hassan.ali@example.com',      'x', false, NOW() - INTERVAL '2 months'),
('b1000001-0000-0000-0000-000000000007', 'Sana Tariq',      'sana.tariq@example.com',      'x', false, NOW() - INTERVAL '2 months'),
('b1000001-0000-0000-0000-000000000008', 'Bilal Shah',      'bilal.shah@example.com',      'x', false, NOW() - INTERVAL '2 months'),
('b1000001-0000-0000-0000-000000000009', 'Nadia Pervez',    'nadia.pervez@example.com',    'x', false, NOW() - INTERVAL '1 month'),
('b1000001-0000-0000-0000-000000000010', 'Usman Ghani',     'usman.ghani@example.com',     'x', false, NOW() - INTERVAL '1 month'),
('b1000001-0000-0000-0000-000000000011', 'Hira Noon',       'hira.noon@example.com',       'x', false, NOW() - INTERVAL '1 month'),
('b1000001-0000-0000-0000-000000000012', 'Kamran Akmal',    'kamran.akmal@example.com',    'x', false, NOW() - INTERVAL '15 days'),
('b1000001-0000-0000-0000-000000000013', 'Mehwish Hayat',   'mehwish.hayat@example.com',   'x', false, NOW() - INTERVAL '10 days'),
('b1000001-0000-0000-0000-000000000014', 'Saad Mehmood',    'saad.mehmood@example.com',    'x', false, NOW() - INTERVAL '5 days'),
('b1000001-0000-0000-0000-000000000015', 'Rabia Aslam',     'rabia.aslam@example.com',     'x', false, NOW() - INTERVAL '3 days');

-- ============================================================
-- 2. QUESTIONS
-- ============================================================

INSERT INTO questions (id, owner_id, title, description, languages, difficulty, starter_code, created_at) VALUES
('c1000001-0000-0000-0000-000000000001', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'Two Sum',             'Given an array of integers, find two numbers that add up to a target.', ARRAY['javascript', 'python', 'typescript'], 'easy',   NULL, NOW() - INTERVAL '4 months'),
('c1000001-0000-0000-0000-000000000002', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'Reverse Linked List', 'Reverse a singly linked list iteratively and recursively.',            ARRAY['javascript', 'python', 'java'],          'medium', NULL, NOW() - INTERVAL '4 months'),
('c1000001-0000-0000-0000-000000000003', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'LRU Cache',           'Design and implement an LRU cache.',                                     ARRAY['typescript', 'python', 'java'],           'hard',   NULL, NOW() - INTERVAL '3 months'),
('c1000001-0000-0000-0000-000000000004', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'Binary Tree Path Sum', 'Check if a binary tree has a root-to-leaf path with a given sum.',       ARRAY['javascript', 'python', 'c++'],            'medium', NULL, NOW() - INTERVAL '3 months'),
('c1000001-0000-0000-0000-000000000005', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'Valid Parentheses',   'Given a string, check if the input string has valid brackets.',         ARRAY['javascript', 'python', 'typescript'],     'easy',   NULL, NOW() - INTERVAL '2 months'),
('c1000001-0000-0000-0000-000000000006', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'Merge Intervals',     'Given a collection of intervals, merge all overlapping intervals.',      ARRAY['python', 'java', 'typescript'],           'medium', NULL, NOW() - INTERVAL '1 month');

-- ============================================================
-- 3. SESSIONS (spread across July, August, September 2026)
-- ============================================================

-- Helper: we use gen_random_uuid() for access tokens and specific UUIDs for session IDs

-- ── JULY 2026 (8 sessions) ──────────────────────────────────

INSERT INTO sessions (id, created_by, question_id, mode, status, access_token, role_context, duration_minutes, started_at, ended_at, created_at) VALUES
('d1000001-0000-0000-0000-000000000001', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000001', 'interview',  'completed', 'july-session-01',  'Senior Frontend Developer',    60, '2026-07-03 10:00:00+05', '2026-07-03 10:52:00+05', '2026-07-02 09:00:00+05'),
('d1000001-0000-0000-0000-000000000002', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000002', 'interview',  'completed', 'july-session-02',  'Backend Engineer',             45, '2026-07-08 14:00:00+05', '2026-07-08 14:40:00+05', '2026-07-07 11:00:00+05'),
('d1000001-0000-0000-0000-000000000003', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000003', 'practice',   'completed', 'july-session-03',  'Fullstack Role',               90, '2026-07-12 11:00:00+05', '2026-07-12 12:25:00+05', '2026-07-11 08:00:00+05'),
('d1000001-0000-0000-0000-000000000004', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000001', 'interview',  'completed', 'july-session-04',  'Junior React Developer',       30, '2026-07-17 09:30:00+05', '2026-07-17 09:55:00+05', '2026-07-16 10:00:00+05'),
('d1000001-0000-0000-0000-000000000005', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000004', 'interview',  'completed', 'july-session-05',  'DevOps Engineer',              60, '2026-07-22 15:00:00+05', '2026-07-22 15:50:00+05', '2026-07-21 09:00:00+05'),
('d1000001-0000-0000-0000-000000000006', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000005', 'practice',   'completed', 'july-session-06',  'Product Manager',              45, '2026-07-25 10:00:00+05', '2026-07-25 10:35:00+05', '2026-07-24 08:00:00+05'),
('d1000001-0000-0000-0000-000000000007', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000002', 'interview',  'completed', 'july-session-07',  'QA Engineer',                  30, '2026-07-28 11:00:00+05', '2026-07-28 11:28:00+05', '2026-07-27 10:00:00+05'),
('d1000001-0000-0000-0000-000000000008', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000001', 'interview',  'cancelled', 'july-session-08',  'UI/UX Designer',               60, NULL, NULL, '2026-07-30 09:00:00+05');

-- ── AUGUST 2026 (10 sessions) ────────────────────────────────

INSERT INTO sessions (id, created_by, question_id, mode, status, access_token, role_context, duration_minutes, started_at, ended_at, created_at) VALUES
('d1000001-0000-0000-0000-000000000009',  'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000003', 'interview',  'completed', 'aug-session-01',  'Senior Frontend Developer',    75, '2026-08-02 10:00:00+05', '2026-08-02 11:10:00+05', '2026-08-01 09:00:00+05'),
('d1000001-0000-0000-0000-000000000010', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000001', 'practice',   'completed', 'aug-session-02',  'Backend Developer',            45, '2026-08-05 14:00:00+05', '2026-08-05 14:42:00+05', '2026-08-04 11:00:00+05'),
('d1000001-0000-0000-0000-000000000011', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000005', 'interview',  'completed', 'aug-session-03',  'Fullstack Role',               60, '2026-08-09 11:00:00+05', '2026-08-09 11:55:00+05', '2026-08-08 08:00:00+05'),
('d1000001-0000-0000-0000-000000000012', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000004', 'interview',  'completed', 'aug-session-04',  'Junior React Developer',       30, '2026-08-13 09:30:00+05', '2026-08-13 10:00:00+05', '2026-08-12 10:00:00+05'),
('d1000001-0000-0000-0000-000000000013', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000002', 'interview',  'completed', 'aug-session-05',  'DevOps Engineer',              60, '2026-08-17 15:00:00+05', '2026-08-17 15:48:00+05', '2026-08-16 09:00:00+05'),
('d1000001-0000-0000-0000-000000000014', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000003', 'practice',   'completed', 'aug-session-06',  'Product Manager',              90, '2026-08-20 10:00:00+05', '2026-08-20 11:20:00+05', '2026-08-19 08:00:00+05'),
('d1000001-0000-0000-0000-000000000015', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000001', 'interview',  'completed', 'aug-session-07',  'QA Engineer',                  45, '2026-08-23 11:00:00+05', '2026-08-23 11:40:00+05', '2026-08-22 10:00:00+05'),
('d1000001-0000-0000-0000-000000000016', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000005', 'interview',  'completed', 'aug-session-08',  'Senior Backend Engineer',       60, '2026-08-26 14:00:00+05', '2026-08-26 14:52:00+05', '2026-08-25 09:00:00+05'),
('d1000001-0000-0000-0000-000000000017', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000004', 'practice',   'live',      'aug-session-09',  'UI/UX Designer',               45, '2026-08-29 10:00:00+05', NULL, '2026-08-28 08:00:00+05'),
('d1000001-0000-0000-0000-000000000018', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000002', 'interview',  'cancelled', 'aug-session-10',  'Mobile Developer',             60, NULL, NULL, '2026-08-30 09:00:00+05');

-- ── SEPTEMBER 2026 (7 sessions — current month) ──────────────

INSERT INTO sessions (id, created_by, question_id, mode, status, access_token, role_context, duration_minutes, started_at, ended_at, created_at) VALUES
('d1000001-0000-0000-0000-000000000019', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000003', 'interview',  'completed', 'sep-session-01',  'Senior Frontend Developer',    60, '2026-09-01 10:00:00+05', '2026-09-01 10:48:00+05', '2026-08-30 09:00:00+05'),
('d1000001-0000-0000-0000-000000000020', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000001', 'interview',  'completed', 'sep-session-02',  'Backend Engineer',             45, '2026-09-03 14:00:00+05', '2026-09-03 14:38:00+05', '2026-09-02 11:00:00+05'),
('d1000001-0000-0000-0000-000000000021', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000005', 'practice',   'completed', 'sep-session-03',  'Fullstack Role',               75, '2026-09-05 11:00:00+05', '2026-09-05 12:05:00+05', '2026-09-04 08:00:00+05'),
('d1000001-0000-0000-0000-000000000022', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000004', 'interview',  'completed', 'sep-session-04',  'Junior React Developer',       30, '2026-09-07 09:30:00+05', '2026-09-07 09:58:00+05', '2026-09-06 10:00:00+05'),
('d1000001-0000-0000-0000-000000000023', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000002', 'interview',  'completed', 'sep-session-05',  'DevOps Engineer',              60, '2026-09-09 15:00:00+05', '2026-09-09 15:50:00+05', '2026-09-08 09:00:00+05'),
('d1000001-0000-0000-0000-000000000024', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000001', 'interview',  'live',      'sep-session-06',  'Product Manager',              45, '2026-09-11 10:00:00+05', NULL, '2026-09-10 08:00:00+05'),
('d1000001-0000-0000-0000-000000000025', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'c1000001-0000-0000-0000-000000000003', 'practice',   'scheduled', 'sep-session-07',  'Senior Backend Engineer',      60, NULL, NULL, '2026-09-11 09:00:00+05');

-- ============================================================
-- 4. SESSION PARTICIPANTS (host + guest for each session)
-- ============================================================

-- ── JULY ──
INSERT INTO session_participants (id, session_id, user_id, email, display_name, role, consent_to_contact, consent_timestamp, joined_at) VALUES
-- Session 1: Fatima Khan
('e1000001-0000-0000-0000-000000000001', 'd1000001-0000-0000-0000-000000000001', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-07-02 09:00:00+05', '2026-07-02 09:00:00+05'),
('e1000001-0000-0000-0000-000000000002', 'd1000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000001', 'fatima.khan@example.com',     'Fatima Khan',  'guest', true, '2026-07-02 09:05:00+05', '2026-07-03 09:55:00+05'),
-- Session 2: Ahmed Raza
('e1000001-0000-0000-0000-000000000003', 'd1000001-0000-0000-0000-000000000002', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-07-07 11:00:00+05', '2026-07-07 11:00:00+05'),
('e1000001-0000-0000-0000-000000000004', 'd1000001-0000-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000002', 'ahmed.raza@example.com',      'Ahmed Raza',   'guest', true, '2026-07-07 11:05:00+05', '2026-07-08 13:55:00+05'),
-- Session 3: Ayesha Siddiqui
('e1000001-0000-0000-0000-000000000005', 'd1000001-0000-0000-0000-000000000003', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-07-11 08:00:00+05', '2026-07-11 08:00:00+05'),
('e1000001-0000-0000-0000-000000000006', 'd1000001-0000-0000-0000-000000000003', 'b1000001-0000-0000-0000-000000000003', 'ayesha.siddiqui@example.com', 'Ayesha Siddiqui', 'guest', true, '2026-07-11 08:10:00+05', '2026-07-12 10:55:00+05'),
-- Session 4: Omar Farooq
('e1000001-0000-0000-0000-000000000007', 'd1000001-0000-0000-0000-000000000004', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-07-16 10:00:00+05', '2026-07-16 10:00:00+05'),
('e1000001-0000-0000-0000-000000000008', 'd1000001-0000-0000-0000-000000000004', 'b1000001-0000-0000-0000-000000000004', 'omar.farooq@example.com',     'Omar Farooq',  'guest', true, '2026-07-16 10:05:00+05', '2026-07-17 09:25:00+05'),
-- Session 5: Zainab Malik
('e1000001-0000-0000-0000-000000000009', 'd1000001-0000-0000-0000-000000000005', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-07-21 09:00:00+05', '2026-07-21 09:00:00+05'),
('e1000001-0000-0000-0000-000000000010', 'd1000001-0000-0000-0000-000000000005', 'b1000001-0000-0000-0000-000000000005', 'zainab.malik@example.com',    'Zainab Malik', 'guest', true, '2026-07-21 09:10:00+05', '2026-07-22 14:55:00+05'),
-- Session 6: Hassan Ali
('e1000001-0000-0000-0000-000000000011', 'd1000001-0000-0000-0000-000000000006', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-07-24 08:00:00+05', '2026-07-24 08:00:00+05'),
('e1000001-0000-0000-0000-000000000012', 'd1000001-0000-0000-0000-000000000006', 'b1000001-0000-0000-0000-000000000006', 'hassan.ali@example.com',      'Hassan Ali',   'guest', true, '2026-07-24 08:05:00+05', '2026-07-25 09:55:00+05'),
-- Session 7: Sana Tariq
('e1000001-0000-0000-0000-000000000013', 'd1000001-0000-0000-0000-000000000007', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-07-27 10:00:00+05', '2026-07-27 10:00:00+05'),
('e1000001-0000-0000-0000-000000000014', 'd1000001-0000-0000-0000-000000000007', 'b1000001-0000-0000-0000-000000000007', 'sana.tariq@example.com',      'Sana Tariq',   'guest', true, '2026-07-27 10:05:00+05', '2026-07-28 10:55:00+05'),
-- Session 8: cancelled (Bilal Shah) - no guest joined
('e1000001-0000-0000-0000-000000000015', 'd1000001-0000-0000-0000-000000000008', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-07-30 09:00:00+05', '2026-07-30 09:00:00+05');

-- ── AUGUST ──
INSERT INTO session_participants (id, session_id, user_id, email, display_name, role, consent_to_contact, consent_timestamp, joined_at) VALUES
-- Session 9: Bilal Shah
('e1000001-0000-0000-0000-000000000016', 'd1000001-0000-0000-0000-000000000009', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-01 09:00:00+05', '2026-08-01 09:00:00+05'),
('e1000001-0000-0000-0000-000000000017', 'd1000001-0000-0000-0000-000000000009', 'b1000001-0000-0000-0000-000000000008', 'bilal.shah@example.com',      'Bilal Shah',   'guest', true, '2026-08-01 09:10:00+05', '2026-08-02 09:55:00+05'),
-- Session 10: Nadia Pervez
('e1000001-0000-0000-0000-000000000018', 'd1000001-0000-0000-0000-000000000010', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-04 11:00:00+05', '2026-08-04 11:00:00+05'),
('e1000001-0000-0000-0000-000000000019', 'd1000001-0000-0000-0000-000000000010', 'b1000001-0000-0000-0000-000000000009', 'nadia.pervez@example.com',    'Nadia Pervez', 'guest', true, '2026-08-04 11:05:00+05', '2026-08-05 13:55:00+05'),
-- Session 11: Usman Ghani
('e1000001-0000-0000-0000-000000000020', 'd1000001-0000-0000-0000-000000000011', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-08 08:00:00+05', '2026-08-08 08:00:00+05'),
('e1000001-0000-0000-0000-000000000021', 'd1000001-0000-0000-0000-000000000011', 'b1000001-0000-0000-0000-000000000010', 'usman.ghani@example.com',     'Usman Ghani',  'guest', true, '2026-08-08 08:05:00+05', '2026-08-09 10:55:00+05'),
-- Session 12: Hira Noon
('e1000001-0000-0000-0000-000000000022', 'd1000001-0000-0000-0000-000000000012', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-12 10:00:00+05', '2026-08-12 10:00:00+05'),
('e1000001-0000-0000-0000-000000000023', 'd1000001-0000-0000-0000-000000000012', 'b1000001-0000-0000-0000-000000000011', 'hira.noon@example.com',       'Hira Noon',    'guest', true, '2026-08-12 10:05:00+05', '2026-08-13 09:25:00+05'),
-- Session 13: Kamran Akmal
('e1000001-0000-0000-0000-000000000024', 'd1000001-0000-0000-0000-000000000013', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-16 09:00:00+05', '2026-08-16 09:00:00+05'),
('e1000001-0000-0000-0000-000000000025', 'd1000001-0000-0000-0000-000000000013', 'b1000001-0000-0000-0000-000000000012', 'kamran.akmal@example.com',    'Kamran Akmal', 'guest', true, '2026-08-16 09:10:00+05', '2026-08-17 14:55:00+05'),
-- Session 14: Mehwish Hayat
('e1000001-0000-0000-0000-000000000026', 'd1000001-0000-0000-0000-000000000014', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-19 08:00:00+05', '2026-08-19 08:00:00+05'),
('e1000001-0000-0000-0000-000000000027', 'd1000001-0000-0000-0000-000000000014', 'b1000001-0000-0000-0000-000000000013', 'mehwish.hayat@example.com',   'Mehwish Hayat', 'guest', true, '2026-08-19 08:10:00+05', '2026-08-20 09:55:00+05'),
-- Session 15: Saad Mehmood
('e1000001-0000-0000-0000-000000000028', 'd1000001-0000-0000-0000-000000000015', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-22 10:00:00+05', '2026-08-22 10:00:00+05'),
('e1000001-0000-0000-0000-000000000029', 'd1000001-0000-0000-0000-000000000015', 'b1000001-0000-0000-0000-000000000014', 'saad.mehmood@example.com',    'Saad Mehmood', 'guest', true, '2026-08-22 10:05:00+05', '2026-08-23 10:55:00+05'),
-- Session 16: Rabia Aslam
('e1000001-0000-0000-0000-000000000030', 'd1000001-0000-0000-0000-000000000016', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-25 09:00:00+05', '2026-08-25 09:00:00+05'),
('e1000001-0000-0000-0000-000000000031', 'd1000001-0000-0000-0000-000000000016', 'b1000001-0000-0000-0000-000000000015', 'rabia.aslam@example.com',     'Rabia Aslam',  'guest', true, '2026-08-25 09:05:00+05', '2026-08-26 13:55:00+05'),
-- Session 17: live (no guest completed yet)
('e1000001-0000-0000-0000-000000000032', 'd1000001-0000-0000-0000-000000000017', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-28 08:00:00+05', '2026-08-28 08:00:00+05'),
('e1000001-0000-0000-0000-000000000033', 'd1000001-0000-0000-0000-000000000017', NULL, 'usman.ghani@example.com', 'Usman Ghani', 'guest', true, '2026-08-28 08:10:00+05', '2026-08-29 09:55:00+05'),
-- Session 18: cancelled (no guest)
('e1000001-0000-0000-0000-000000000034', 'd1000001-0000-0000-0000-000000000018', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-30 09:00:00+05', '2026-08-30 09:00:00+05');

-- ── SEPTEMBER ──
INSERT INTO session_participants (id, session_id, user_id, email, display_name, role, consent_to_contact, consent_timestamp, joined_at) VALUES
-- Session 19: Fatima Khan (repeat)
('e1000001-0000-0000-0000-000000000035', 'd1000001-0000-0000-0000-000000000019', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-08-30 09:00:00+05', '2026-08-30 09:00:00+05'),
('e1000001-0000-0000-0000-000000000036', 'd1000001-0000-0000-0000-000000000019', 'b1000001-0000-0000-0000-000000000001', 'fatima.khan@example.com',     'Fatima Khan',  'guest', true, '2026-08-30 09:05:00+05', '2026-09-01 09:55:00+05'),
-- Session 20: Ahmed Raza (repeat)
('e1000001-0000-0000-0000-000000000037', 'd1000001-0000-0000-0000-000000000020', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-09-02 11:00:00+05', '2026-09-02 11:00:00+05'),
('e1000001-0000-0000-0000-000000000038', 'd1000001-0000-0000-0000-000000000020', 'b1000001-0000-0000-0000-000000000002', 'ahmed.raza@example.com',      'Ahmed Raza',   'guest', true, '2026-09-02 11:05:00+05', '2026-09-03 13:55:00+05'),
-- Session 21: Ayesha Siddiqui (repeat)
('e1000001-0000-0000-0000-000000000039', 'd1000001-0000-0000-0000-000000000021', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-09-04 08:00:00+05', '2026-09-04 08:00:00+05'),
('e1000001-0000-0000-0000-000000000040', 'd1000001-0000-0000-0000-000000000021', 'b1000001-0000-0000-0000-000000000003', 'ayesha.siddiqui@example.com', 'Ayesha Siddiqui', 'guest', true, '2026-09-04 08:10:00+05', '2026-09-05 10:55:00+05'),
-- Session 22: Omar Farooq (repeat)
('e1000001-0000-0000-0000-000000000041', 'd1000001-0000-0000-0000-000000000022', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-09-06 10:00:00+05', '2026-09-06 10:00:00+05'),
('e1000001-0000-0000-0000-000000000042', 'd1000001-0000-0000-0000-000000000022', 'b1000001-0000-0000-0000-000000000004', 'omar.farooq@example.com',     'Omar Farooq',  'guest', true, '2026-09-06 10:05:00+05', '2026-09-07 09:25:00+05'),
-- Session 23: Zainab Malik (repeat)
('e1000001-0000-0000-0000-000000000043', 'd1000001-0000-0000-0000-000000000023', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-09-08 09:00:00+05', '2026-09-08 09:00:00+05'),
('e1000001-0000-0000-0000-000000000044', 'd1000001-0000-0000-0000-000000000023', 'b1000001-0000-0000-0000-000000000005', 'zainab.malik@example.com',    'Zainab Malik', 'guest', true, '2026-09-08 09:10:00+05', '2026-09-09 14:55:00+05'),
-- Session 24: live (Hira Noon)
('e1000001-0000-0000-0000-000000000045', 'd1000001-0000-0000-0000-000000000024', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-09-10 08:00:00+05', '2026-09-10 08:00:00+05'),
('e1000001-0000-0000-0000-000000000046', 'd1000001-0000-0000-0000-000000000024', 'b1000001-0000-0000-0000-000000000011', 'hira.noon@example.com',       'Hira Noon',    'guest', true, '2026-09-10 08:10:00+05', '2026-09-11 09:55:00+05'),
-- Session 25: scheduled (no guest yet)
('e1000001-0000-0000-0000-000000000047', 'd1000001-0000-0000-0000-000000000025', 'c3504229-2af1-46f5-970b-5e3ccfa26260', 'abidhussainme1@gmail.com', 'Abid Hussain', 'host', true, '2026-09-11 09:00:00+05', '2026-09-11 09:00:00+05');

-- ============================================================
-- 5. SESSION EVALUATIONS (guest evaluations for completed sessions)
-- ============================================================

-- ── JULY evaluations ──
INSERT INTO session_evaluations (session_id, evaluator_participant_id, evaluated_participant_id, rating, notes, created_at) VALUES
('d1000001-0000-0000-0000-000000000001', 'e1000001-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000002', 'strong',   'Excellent problem-solving skills. Solved Two Sum in O(n) with optimal space.', '2026-07-03 11:00:00+05'),
('d1000001-0000-0000-0000-000000000002', 'e1000001-0000-0000-0000-000000000004', 'e1000001-0000-0000-0000-000000000004', 'average',  'Good understanding of linked lists but struggled with edge cases.', '2026-07-08 15:00:00+05'),
('d1000001-0000-0000-0000-000000000003', 'e1000001-0000-0000-0000-000000000006', 'e1000001-0000-0000-0000-000000000006', 'strong',   'Implemented LRU Cache from scratch with O(1) operations. Impressive.', '2026-07-12 12:30:00+05'),
('d1000001-0000-0000-0000-000000000004', 'e1000001-0000-0000-0000-000000000008', 'e1000001-0000-0000-0000-000000000008', 'weak',     'Could not solve Two Sum within the time limit. Needs more practice.', '2026-07-17 10:00:00+05'),
('d1000001-0000-0000-0000-000000000005', 'e1000001-0000-0000-0000-000000000010', 'e1000001-0000-0000-0000-000000000010', 'average',  'Decent DevOps knowledge. Could improve on CI/CD pipeline design.', '2026-07-22 16:00:00+05'),
('d1000001-0000-0000-0000-000000000006', 'e1000001-0000-0000-0000-000000000012', 'e1000001-0000-0000-0000-000000000012', 'strong',   'Great product thinking. Proposed creative solutions for user retention.', '2026-07-25 10:40:00+05'),
('d1000001-0000-0000-0000-000000000007', 'e1000001-0000-0000-0000-000000000014', 'e1000001-0000-0000-0000-000000000014', 'average',  'Good QA instincts. Should work on automated testing skills.', '2026-07-28 11:30:00+05');

-- ── AUGUST evaluations ──
INSERT INTO session_evaluations (session_id, evaluator_participant_id, evaluated_participant_id, rating, notes, created_at) VALUES
('d1000001-0000-0000-0000-000000000009', 'e1000001-0000-0000-0000-000000000017', 'e1000001-0000-0000-0000-000000000017', 'strong',   'Strong React fundamentals. Built a complex component with hooks and context.', '2026-08-02 11:15:00+05'),
('d1000001-0000-0000-0000-000000000010', 'e1000001-0000-0000-0000-000000000019', 'e1000001-0000-0000-0000-000000000019', 'average',  'Solid backend skills. Could improve database optimization knowledge.', '2026-08-05 14:45:00+05'),
('d1000001-0000-0000-0000-000000000011', 'e1000001-0000-0000-0000-000000000021', 'e1000001-0000-0000-0000-000000000021', 'strong',   'Excellent full-stack project. Clean code and good architecture decisions.', '2026-08-09 12:00:00+05'),
('d1000001-0000-0000-0000-000000000012', 'e1000001-0000-0000-0000-000000000023', 'e1000001-0000-0000-0000-000000000023', 'weak',     'Struggled with binary tree recursion. Needs more practice with DSA.', '2026-08-13 10:05:00+05'),
('d1000001-0000-0000-0000-000000000013', 'e1000001-0000-0000-0000-000000000025', 'e1000001-0000-0000-0000-000000000025', 'average',  'Good DevOps understanding. Should learn more about Kubernetes.', '2026-08-17 15:50:00+05'),
('d1000001-0000-0000-0000-000000000014', 'e1000001-0000-0000-0000-000000000027', 'e1000001-0000-0000-0000-000000000027', 'strong',   'Outstanding product sense. Data-driven approach to feature prioritization.', '2026-08-20 11:25:00+05'),
('d1000001-0000-0000-0000-000000000015', 'e1000001-0000-0000-0000-000000000029', 'e1000001-0000-0000-0000-000000000029', 'average',  'Good QA fundamentals. Selenium knowledge needs improvement.', '2026-08-23 11:45:00+05'),
('d1000001-0000-0000-0000-000000000016', 'e1000001-0000-0000-0000-000000000031', 'e1000001-0000-0000-0000-000000000031', 'strong',   'Deep backend expertise. Microservices architecture was spot on.', '2026-08-26 14:55:00+05');

-- ── SEPTEMBER evaluations ──
INSERT INTO session_evaluations (session_id, evaluator_participant_id, evaluated_participant_id, rating, notes, created_at) VALUES
('d1000001-0000-0000-0000-000000000019', 'e1000001-0000-0000-0000-000000000036', 'e1000001-0000-0000-0000-000000000036', 'strong',   'Fatima improved significantly. Solved LRU Cache with clean implementation.', '2026-09-01 10:50:00+05'),
('d1000001-0000-0000-0000-000000000020', 'e1000001-0000-0000-0000-000000000038', 'e1000001-0000-0000-0000-000000000038', 'average',  'Ahmed showed improvement in linked lists. Still needs work on trees.', '2026-09-03 14:40:00+05'),
('d1000001-0000-0000-0000-000000000021', 'e1000001-0000-0000-0000-000000000040', 'e1000001-0000-0000-0000-000000000040', 'strong',   'Ayesha nailed the full-stack project. Excellent API design and React state management.', '2026-09-05 12:10:00+05'),
('d1000001-0000-0000-0000-000000000022', 'e1000001-0000-0000-0000-000000000042', 'e1000001-0000-0000-0000-000000000042', 'weak',     'Omar struggled with the binary tree problem again. Recommended DSA course.', '2026-09-07 10:00:00+05'),
('d1000001-0000-0000-0000-000000000023', 'e1000001-0000-0000-0000-000000000044', 'e1000001-0000-0000-0000-000000000044', 'average',  'Zainab performed well. Good problem decomposition skills.', '2026-09-09 15:55:00+05');

-- ============================================================
-- Summary: 25 sessions total
--   July:   8 sessions (7 completed, 1 cancelled)
--   August: 10 sessions (8 completed, 1 live, 1 cancelled)
--   September: 7 sessions (5 completed, 1 live, 1 scheduled)
--
-- Evaluations: 20 total (all for guest participants)
--   July:   7 evaluations (2 strong, 3 average, 2 weak)  — wait let me count
--   Actually let me just count from the data:
--   July: 7 evaluations
--   August: 8 evaluations
--   September: 5 evaluations
--   Total: 20 evaluations
-- ============================================================
