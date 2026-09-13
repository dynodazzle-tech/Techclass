-- =========================================================================
-- TechClass Digital Classroom - Supabase PostgreSQL Schema & Seed Migration
-- Project ID: nuvxtpwgdlzeqsdnbnpx
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nuvxtpwgdlzeqsdnbnpx/sql/new
-- =========================================================================

-- 1. Roles
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- 2. Users
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'FREE_STUDENT',
  preferred_language TEXT NOT NULL DEFAULT 'en',
  target_exams TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users(student_id);

-- 3. Student Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  study_streak INTEGER DEFAULT 1,
  last_activity_date TIMESTAMPTZ,
  total_study_minutes INTEGER DEFAULT 0
);

-- 4. Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'FREE',
  start_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- 6. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'ANNUAL_PASS',
  item_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  utr_number TEXT UNIQUE NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  screenshot_url TEXT,
  notes TEXT,
  admin_reason TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_utr ON public.payments(utr_number);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 7. Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail TEXT,
  exam TEXT NOT NULL,
  subject TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  access_type TEXT NOT NULL DEFAULT 'MEMBERSHIP',
  price NUMERIC DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Course Modules
CREATE TABLE IF NOT EXISTS public.course_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 1,
  description TEXT
);

-- 9. Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER DEFAULT 30,
  is_free_preview BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 1
);

-- 10. Tests
CREATE TABLE IF NOT EXISTS public.tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'MOCK',
  exam TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks NUMERIC NOT NULL DEFAULT 100,
  passing_percentage NUMERIC NOT NULL DEFAULT 40,
  negative_marking_ratio NUMERIC NOT NULL DEFAULT 0.25,
  question_count INTEGER NOT NULL DEFAULT 0,
  access_type TEXT NOT NULL DEFAULT 'MEMBERSHIP',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT DEFAULT 'MEDIUM',
  marks NUMERIC DEFAULT 2,
  negative_marks NUMERIC DEFAULT 0.5,
  correct_answer TEXT NOT NULL
);

-- 12. Question Translations
CREATE TABLE IF NOT EXISTS public.question_translations (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  question_text TEXT NOT NULL,
  image_url TEXT,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  explanation TEXT
);
CREATE INDEX IF NOT EXISTS idx_q_trans ON public.question_translations(question_id, language);

-- 13. Test Attempts
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  accuracy NUMERIC DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 1,
  percentile NUMERIC DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Test Answers
CREATE TABLE IF NOT EXISTS public.test_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  is_marked_for_review BOOLEAN DEFAULT FALSE
);

-- 15. PDF Documents
CREATE TABLE IF NOT EXISTS public.pdf_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_url TEXT,
  subject TEXT NOT NULL,
  exam TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  page_count INTEGER DEFAULT 1,
  file_size TEXT,
  access_type TEXT NOT NULL DEFAULT 'MEMBERSHIP',
  price NUMERIC DEFAULT 0,
  allow_download BOOLEAN DEFAULT FALSE,
  allow_print BOOLEAN DEFAULT FALSE,
  allow_copy BOOLEAN DEFAULT FALSE,
  watermark_enabled BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT TRUE,
  pages_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. PDF Purchases
CREATE TABLE IF NOT EXISTS public.pdf_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pdf_id TEXT NOT NULL REFERENCES public.pdf_documents(id) ON DELETE CASCADE,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'ANNOUNCEMENT',
  is_read INTEGER DEFAULT 0,
  link_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS & Configure Public Access Policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated read for public content
DO $$
BEGIN
  -- Site Settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read settings' AND tablename = 'site_settings') THEN
    CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT USING (true);
  END IF;

  -- Courses & Lessons
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read courses' AND tablename = 'courses') THEN
    CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read course_modules' AND tablename = 'course_modules') THEN
    CREATE POLICY "Public read course_modules" ON public.course_modules FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read lessons' AND tablename = 'lessons') THEN
    CREATE POLICY "Public read lessons" ON public.lessons FOR SELECT USING (true);
  END IF;

  -- Tests & Questions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read tests' AND tablename = 'tests') THEN
    CREATE POLICY "Public read tests" ON public.tests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read questions' AND tablename = 'questions') THEN
    CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read question_translations' AND tablename = 'question_translations') THEN
    CREATE POLICY "Public read question_translations" ON public.question_translations FOR SELECT USING (true);
  END IF;

  -- PDF Documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read pdf_documents' AND tablename = 'pdf_documents') THEN
    CREATE POLICY "Public read pdf_documents" ON public.pdf_documents FOR SELECT USING (true);
  END IF;

  -- Notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
  END IF;

  -- Allow users and payments operations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to app' AND tablename = 'users') THEN
    CREATE POLICY "Allow all access to app" ON public.users FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all payments access' AND tablename = 'payments') THEN
    CREATE POLICY "Allow all payments access" ON public.payments FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all attempts access' AND tablename = 'test_attempts') THEN
    CREATE POLICY "Allow all attempts access" ON public.test_attempts FOR ALL USING (true);
  END IF;
END $$;

-- Initial Seed Data: Roles
INSERT INTO public.roles (id, name, description) VALUES
  ('VISITOR', 'Visitor', 'Unauthenticated public visitor'),
  ('FREE_STUDENT', 'Free Student', 'Registered student on free access tier'),
  ('PAID_STUDENT', 'Paid Student', 'Active subscriber to TechClass Annual Pass'),
  ('ADMIN', 'Admin', 'Platform administrator with operations management access'),
  ('SUPER_ADMIN', 'Super Admin', 'Full system security and role configuration access')
ON CONFLICT (id) DO NOTHING;

-- Initial Seed Data: Site Settings
INSERT INTO public.site_settings (id, key, value, updated_at) VALUES
  ('set_site_name', 'site_name', 'TechClass', NOW()),
  ('set_brand_tagline', 'brand_tagline', 'Your Digital Classroom for Government Exam Preparation', NOW()),
  ('set_parent_brand', 'parent_brand', 'DynoDazzle', NOW()),
  ('set_primary_domain', 'primary_domain', 'https://techclass.dynodazzle.in', NOW()),
  ('set_contact_email', 'contact_email', 'dynodazzle@gmail.com', NOW()),
  ('set_whatsapp_support', 'whatsapp_support', '+91 7770032149', NOW()),
  ('set_annual_membership_price', 'annual_membership_price', '2999', NOW()),
  ('set_upi_id', 'upi_id', 'dynodazzle@ybl', NOW()),
  ('set_free_test_limit', 'free_test_limit', '3', NOW()),
  ('set_free_pdf_limit', 'free_pdf_limit', '2', NOW()),
  ('set_free_course_limit', 'free_course_limit', '2', NOW()),
  ('set_announcement_text', 'announcement_text', '🔥 MPSC State Services 2026 Prelims Fastrack Batch & Mock Papers Live Now!', NOW()),
  ('set_maintenance_mode', 'maintenance_mode', '0', NOW())
ON CONFLICT (id) DO NOTHING;

-- Initial Seed Data: Super Admin (dynodazzle@gmail.com / Vicky@12345)
INSERT INTO public.users (
  id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at
) VALUES (
  'usr_dynodazzle_admin',
  'TC000000',
  'DynoDazzle Administrator',
  'dynodazzle@gmail.com',
  '+91 7770032149',
  'e3226642fe4ec5683f6203872976477ff96362fee69081f587554031f8cbf6b7',
  'SUPER_ADMIN',
  'en',
  '["All Exams", "UPSC", "MPSC", "SSC", "Banking"]',
  'Maharashtra',
  'Pune',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status;
