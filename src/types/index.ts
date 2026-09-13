export type UserRole = 'VISITOR' | 'FREE_STUDENT' | 'PAID_STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export type MembershipStatus = 'FREE' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export interface User {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  role: UserRole;
  preferred_language: SupportedLanguage;
  target_exams: string[];
  state: string;
  city: string;
  status?: string;
  membership_status?: MembershipStatus;
  expiry_date?: string | null;
  membership_expires_at?: string | null;
  plan_name?: string;
  study_streak?: number;
  total_study_minutes?: number;
  bio?: string;
}

export interface SiteSettings {
  site_name: string;
  brand_tagline: string;
  parent_brand: string;
  primary_domain: string;
  contact_email: string;
  whatsapp_support: string;
  annual_membership_price: number;
  upi_id: string;
  free_test_limit: number;
  free_pdf_limit: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  duration: number;
  is_free: boolean;
  content: string;
  video_url?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  exam: string;
  subject: string;
  language: SupportedLanguage;
  access_type: 'FREE' | 'MEMBERSHIP' | 'PAID';
  price: number;
  modules_count?: number;
  lessons_count?: number;
  modules?: CourseModule[];
}

export interface QuestionTranslation {
  question: string;
  opt_a: string;
  opt_b: string;
  opt_c: string;
  opt_d: string;
  explanation: string;
}

export interface Question {
  id: string;
  question_number: number;
  subject: string;
  topic?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
  negative_marks: number;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  translations: Record<SupportedLanguage, QuestionTranslation>;
}

export interface TestPaper {
  id: string;
  title: string;
  description: string;
  type: 'MOCK' | 'PRACTICE' | 'PYQ' | 'TOPIC' | 'SUBJECT' | 'FULL_LENGTH';
  exam: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  negative_marking_ratio: number;
  question_count: number;
  access_type: 'FREE' | 'MEMBERSHIP';
  questions?: Question[];
}

export interface PdfPage {
  page_num: number;
  title: string;
  content: string;
}

export interface PdfDocument {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  subject: string;
  exam: string;
  language: SupportedLanguage;
  page_count: number;
  file_size: string;
  access_type: 'FREE' | 'MEMBERSHIP' | 'PAID_PURCHASE';
  price: number;
  allow_download: boolean;
  allow_print: boolean;
  allow_copy?: boolean;
  watermark_enabled?: boolean;
  is_unlocked?: boolean;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  student_name?: string;
  student_id?: string;
  student_email?: string;
  student_mobile?: string;
  type: 'ANNUAL_PASS' | 'PDF_PURCHASE';
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  utr_number: string;
  payment_date: string;
  screenshot_url?: string;
  notes?: string;
  admin_reason?: string;
  approved_by?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'PAYMENT' | 'MEMBERSHIP' | 'CONTENT' | 'ANNOUNCEMENT' | 'SECURITY';
  is_read: number;
  link_url?: string;
  created_at: string;
}

export interface BookmarkItem {
  id: string;
  item_type: 'COURSE' | 'TEST' | 'PDF' | 'QUESTION';
  item_id: string;
  item_title?: string;
  notes?: string;
  created_at: string;
}

export interface NoteItem {
  id: string;
  title: string;
  note_text: string;
  item_type?: string;
  item_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogItem {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface EmailLogItem {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  template_name: string;
  status: string;
  body_preview: string;
  sent_at: string;
}
