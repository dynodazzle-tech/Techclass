import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initialSiteSettings, initialCourses, initialTests, initialPdfs } from './seedData.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'techclass.sqlite');

let db: Database;

export function hashPassword(password: string): string {
  const salt = 'techclass_secure_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export function saveDatabase() {
  if (!db) return;
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// SQL query helper
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runSql(sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDatabase();
}

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
    console.log('[Database] Loaded existing TechClass SQLite database from disk.');
    ensureAdminUsers();
    return db;
  }

  console.log('[Database] Initializing fresh TechClass relational SQLite database with full schema...');
  db = new SQL.Database();

  // 1. Roles
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
  `);

  // 2. Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
  `);

  // 3. Student Profiles
  db.run(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      study_streak INTEGER DEFAULT 1,
      last_activity_date TEXT,
      total_study_minutes INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Site Settings
  db.run(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 5. Subscriptions
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'FREE',
      start_date TEXT,
      expiry_date TEXT,
      amount REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
  `);

  // 6. Payments
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'ANNUAL_PASS',
      item_id TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      utr_number TEXT UNIQUE NOT NULL,
      payment_date TEXT NOT NULL,
      screenshot_url TEXT,
      notes TEXT,
      admin_reason TEXT,
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_payments_utr ON payments(utr_number);
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  `);

  // 7. Courses
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      thumbnail TEXT,
      exam TEXT NOT NULL,
      subject TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      access_type TEXT NOT NULL DEFAULT 'MEMBERSHIP',
      price REAL DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // 8. Course Modules
  db.run(`
    CREATE TABLE IF NOT EXISTS course_modules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER DEFAULT 1,
      description TEXT,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);

  // 9. Lessons
  db.run(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      video_url TEXT,
      duration_minutes INTEGER DEFAULT 30,
      is_free_preview INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 1,
      FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
    );
  `);

  // 10. Tests
  db.run(`
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'MOCK',
      exam TEXT NOT NULL,
      subject TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      total_marks REAL NOT NULL DEFAULT 100,
      passing_percentage REAL NOT NULL DEFAULT 40,
      negative_marking_ratio REAL NOT NULL DEFAULT 0.25,
      question_count INTEGER NOT NULL DEFAULT 0,
      access_type TEXT NOT NULL DEFAULT 'MEMBERSHIP',
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // 11. Questions
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      question_number INTEGER NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT,
      difficulty TEXT DEFAULT 'MEDIUM',
      marks REAL DEFAULT 2,
      negative_marks REAL DEFAULT 0.5,
      correct_answer TEXT NOT NULL,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );
  `);

  // 12. Question Translations
  db.run(`
    CREATE TABLE IF NOT EXISTS question_translations (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      language TEXT NOT NULL,
      question_text TEXT NOT NULL,
      image_url TEXT,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      explanation TEXT,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_q_trans ON question_translations(question_id, language);
  `);

  // 13. Test Attempts
  db.run(`
    CREATE TABLE IF NOT EXISTS test_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      test_id TEXT NOT NULL,
      score REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      wrong_count INTEGER DEFAULT 0,
      skipped_count INTEGER DEFAULT 0,
      accuracy REAL DEFAULT 0,
      time_taken_seconds INTEGER DEFAULT 0,
      rank INTEGER DEFAULT 1,
      percentile REAL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );
  `);

  // 14. Test Answers
  db.run(`
    CREATE TABLE IF NOT EXISTS test_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_option TEXT,
      is_correct INTEGER DEFAULT 0,
      time_spent_seconds INTEGER DEFAULT 0,
      is_marked_for_review INTEGER DEFAULT 0,
      FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE
    );
  `);

  // 15. PDF Documents
  db.run(`
    CREATE TABLE IF NOT EXISTS pdf_documents (
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
      price REAL DEFAULT 0,
      allow_download INTEGER DEFAULT 0,
      allow_print INTEGER DEFAULT 0,
      allow_copy INTEGER DEFAULT 0,
      watermark_enabled INTEGER DEFAULT 1,
      is_published INTEGER DEFAULT 1,
      pages_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 16. PDF Purchases
  db.run(`
    CREATE TABLE IF NOT EXISTS pdf_purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pdf_id TEXT NOT NULL,
      payment_id TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      purchased_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
    );
  `);

  // 17. PDF Reading Sessions
  db.run(`
    CREATE TABLE IF NOT EXISTS pdf_reading_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pdf_id TEXT NOT NULL,
      current_page INTEGER DEFAULT 1,
      reading_mode TEXT DEFAULT 'STANDARD',
      last_read_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
    );
  `);

  // 18. Bookmarks
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      item_title TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 19. Notes
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      title TEXT NOT NULL,
      note_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 20. Notifications
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'ANNOUNCEMENT',
      is_read INTEGER DEFAULT 0,
      link_url TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 21. Study Progress
  db.run(`
    CREATE TABLE IF NOT EXISTS study_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_date TEXT NOT NULL,
      details TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 22. Course Progress
  db.run(`
    CREATE TABLE IF NOT EXISTS course_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      completed_lessons TEXT NOT NULL DEFAULT '[]',
      progress_percentage REAL DEFAULT 0,
      last_activity_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 23. Email Logs
  db.run(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      template_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DELIVERED',
      body_preview TEXT,
      sent_at TEXT NOT NULL
    );
  `);

  // 24. OTP & Reset Tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts_count INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0
    );
  `);

  // 25. Active Sessions
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      last_active_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 26. Audit Logs
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed Roles
  const roles = [
    ['VISITOR', 'Visitor', 'Unauthenticated public visitor'],
    ['FREE_STUDENT', 'Free Student', 'Registered student on free access tier'],
    ['PAID_STUDENT', 'Paid Student', 'Active subscriber to TechClass Annual Pass'],
    ['ADMIN', 'Admin', 'Platform administrator with operations management access'],
    ['SUPER_ADMIN', 'Super Admin', 'Full system security and role configuration access']
  ];
  for (const r of roles) {
    db.run(`INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`, r);
  }

  // Seed Site Settings
  const now = new Date().toISOString();
  for (const s of initialSiteSettings) {
    db.run(
      `INSERT OR IGNORE INTO site_settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)`,
      ['set_' + s.key, s.key, s.value, now]
    );
  }

  // Seed Users
  // 1. Super Admin
  const adminId = 'usr_admin_01';
  db.run(
    `INSERT OR IGNORE INTO users (id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      adminId,
      'TC000001',
      'TechClass Administrator',
      'admin@techclass.in',
      '+91 7770032149',
      hashPassword('admin123'),
      'SUPER_ADMIN',
      'en',
      JSON.stringify(['All Exams']),
      'Maharashtra',
      'Pune',
      'ACTIVE',
      now,
      now
    ]
  );

  // 2. Free Student
  const freeStudentId = 'usr_free_01';
  db.run(
    `INSERT OR IGNORE INTO users (id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      freeStudentId,
      'TC100001',
      'Rahul Deshmukh',
      'free@student.in',
      '+91 9823456789',
      hashPassword('student123'),
      'FREE_STUDENT',
      'mr',
      JSON.stringify(['MPSC', 'Police Bharti']),
      'Maharashtra',
      'Chhatrapati Sambhajinagar',
      'ACTIVE',
      now,
      now
    ]
  );
  db.run(
    `INSERT OR IGNORE INTO student_profiles (id, user_id, bio, study_streak, total_study_minutes) VALUES (?, ?, ?, ?, ?)`,
    ['prof_free_01', freeStudentId, 'Aspiring MPSC Officer', 3, 140]
  );
  db.run(
    `INSERT OR IGNORE INTO subscriptions (id, user_id, plan_name, status, start_date, expiry_date, amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sub_free_01', freeStudentId, 'Free Tier', 'FREE', now, null, 0, now, now]
  );

  // 3. Paid Student
  const paidStudentId = 'usr_paid_02';
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  db.run(
    `INSERT OR IGNORE INTO users (id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      paidStudentId,
      'TC100002',
      'Pooja Sharma',
      'paid@student.in',
      '+91 9812345678',
      hashPassword('student123'),
      'PAID_STUDENT',
      'en',
      JSON.stringify(['UPSC', 'SSC']),
      'Delhi',
      'New Delhi',
      'ACTIVE',
      now,
      now
    ]
  );
  db.run(
    `INSERT OR IGNORE INTO student_profiles (id, user_id, bio, study_streak, total_study_minutes) VALUES (?, ?, ?, ?, ?)`,
    ['prof_paid_02', paidStudentId, 'Dedicated Civil Services Aspirant', 14, 820]
  );
  db.run(
    `INSERT OR IGNORE INTO subscriptions (id, user_id, plan_name, status, start_date, expiry_date, amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['sub_paid_02', paidStudentId, 'TechClass Annual Pass', 'ACTIVE', now, oneYearLater, 2999, now, now]
  );

  // Seed sample payments
  db.run(
    `INSERT OR IGNORE INTO payments (id, user_id, type, amount, status, utr_number, payment_date, screenshot_url, notes, admin_reason, approved_by, approved_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'pay_seed_01',
      paidStudentId,
      'ANNUAL_PASS',
      2999,
      'APPROVED',
      'UTR202609138812',
      now,
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=60',
      'Paid via GPay UPI',
      'Verified in HDFC merchant bank account statement',
      'TechClass Administrator',
      now,
      now,
      now
    ]
  );

  // One pending payment from free student to test Admin approval flow
  db.run(
    `INSERT OR IGNORE INTO payments (id, user_id, type, amount, status, utr_number, payment_date, screenshot_url, notes, admin_reason, approved_by, approved_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'pay_seed_pending',
      freeStudentId,
      'ANNUAL_PASS',
      2999,
      'PENDING',
      'UTR202609137731',
      now,
      '',
      'Paid from PhonePe. Please verify soon!',
      null,
      null,
      null,
      now,
      now
    ]
  );

  // Seed Courses, Modules & Lessons
  for (const c of initialCourses) {
    db.run(
      `INSERT OR IGNORE INTO courses (id, title, slug, description, thumbnail, exam, subject, language, access_type, price, is_published, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.title, c.slug, c.description, c.thumbnail, c.exam, c.subject, c.language, c.access_type, c.price, c.is_published, c.sort_order, now]
    );

    for (const m of c.modules) {
      db.run(
        `INSERT OR IGNORE INTO course_modules (id, course_id, title, sort_order, description) VALUES (?, ?, ?, ?, ?)`,
        [m.id, c.id, m.title, 1, '']
      );

      for (const l of m.lessons) {
        db.run(
          `INSERT OR IGNORE INTO lessons (id, module_id, title, content, video_url, duration_minutes, is_free_preview, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, m.id, l.title, l.content, '', l.duration, l.is_free, 1]
        );
      }
    }
  }

  // Seed Tests, Questions & Translations
  for (const t of initialTests) {
    db.run(
      `INSERT OR IGNORE INTO tests (id, title, description, type, exam, subject, duration_minutes, total_marks, passing_percentage, negative_marking_ratio, question_count, access_type, is_published, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.title, t.description, t.type, t.exam, t.subject, t.duration_minutes, t.total_marks, t.passing_percentage, t.negative_marking_ratio, t.questions.length, t.access_type, t.is_published, now]
    );

    for (const q of t.questions) {
      db.run(
        `INSERT OR IGNORE INTO questions (id, test_id, question_number, subject, topic, difficulty, marks, negative_marks, correct_answer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.id, t.id, q.question_number, q.subject, q.topic, q.difficulty, q.marks, q.negative_marks, q.correct_answer]
      );

      // Translations (en, hi, mr)
      for (const lang of ['en', 'hi', 'mr'] as const) {
        const trans = q.translations[lang];
        if (trans) {
          db.run(
            `INSERT OR IGNORE INTO question_translations (id, question_id, language, question_text, image_url, option_a, option_b, option_c, option_d, explanation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `${q.id}_${lang}`,
              q.id,
              lang,
              trans.question,
              '',
              trans.opt_a,
              trans.opt_b,
              trans.opt_c,
              trans.opt_d,
              trans.explanation
            ]
          );
        }
      }
    }
  }

  // Seed PDFs
  for (const p of initialPdfs) {
    db.run(
      `INSERT OR IGNORE INTO pdf_documents (id, title, author, description, cover_url, subject, exam, language, page_count, file_size, access_type, price, allow_download, allow_print, allow_copy, watermark_enabled, is_published, pages_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.title,
        p.author,
        p.description,
        p.cover_url,
        p.subject,
        p.exam,
        p.language,
        p.page_count,
        p.file_size,
        p.access_type,
        p.price,
        p.allow_download,
        p.allow_print,
        p.allow_copy,
        p.watermark_enabled,
        p.is_published,
        JSON.stringify(p.pages),
        now
      ]
    );
  }

  // Seed sample notifications
  db.run(
    `INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'notif_01',
      freeStudentId,
      'Welcome to TechClass!',
      'Your student account TC100001 is ready. Explore free mock tests and Maharashtra GK notes.',
      'ANNOUNCEMENT',
      0,
      '/tests',
      now
    ]
  );
  db.run(
    `INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'notif_02',
      paidStudentId,
      'TechClass Annual Pass Activated',
      'All premium courses, digital library, and WhatsApp priority support are unlocked.',
      'MEMBERSHIP',
      0,
      '/library',
      now
    ]
  );

  // Seed initial email logs
  db.run(
    `INSERT OR IGNORE INTO email_logs (id, recipient_email, recipient_name, subject, template_name, status, body_preview, sent_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'eml_01',
      'paid@student.in',
      'Pooja Sharma',
      'TechClass Membership Activated – Welcome to Premium',
      'membership_activated',
      'DELIVERED',
      'Your TechClass Annual Pass (TC100002) has been activated for 365 days until ' + oneYearLater,
      now
    ]
  );

  // Seed initial audit logs
  db.run(
    `INSERT OR IGNORE INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'aud_01',
      adminId,
      'TechClass Administrator',
      'PAYMENT_APPROVED',
      'PAYMENT',
      'pay_seed_01',
      'Approved UTR202609138812 (Rs. 2999) for Pooja Sharma (TC100002)',
      now
    ]
  );

  saveDatabase();
  console.log('[Database] TechClass database initialized with sample seed data successfully.');
  ensureAdminUsers();
  return db;
}

export function ensureAdminUsers() {
  if (!db) return;
  const now = new Date().toISOString();
  const dynoEmail = 'dynodazzle@gmail.com';
  const hashedPass = hashPassword('Vicky@12345');

  const existingDyno = queryOne('SELECT id, email, role FROM users WHERE email = ?', [dynoEmail]);
  if (!existingDyno) {
    db.run(
      `INSERT INTO users (id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr_dynodazzle_admin',
        'TC000000',
        'DynoDazzle Administrator',
        dynoEmail,
        '+91 7770032149',
        hashedPass,
        'SUPER_ADMIN',
        'en',
        JSON.stringify(['All Exams', 'UPSC', 'MPSC', 'SSC', 'Banking']),
        'Maharashtra',
        'Pune',
        'ACTIVE',
        now,
        now
      ]
    );
    console.log('[Database] Seeded Super Admin: dynodazzle@gmail.com with password Vicky@12345');
  } else {
    db.run(
      `UPDATE users SET password_hash = ?, role = 'SUPER_ADMIN', status = 'ACTIVE', updated_at = ? WHERE email = ?`,
      [hashedPass, now, dynoEmail]
    );
    console.log('[Database] Updated Super Admin: dynodazzle@gmail.com with password Vicky@12345');
  }

  // Ensure Gmail SMTP credentials configured
  const userRow = queryOne('SELECT value FROM site_settings WHERE key = ?', ['gmail_user']);
  if (!userRow) {
    db.run(
      'INSERT OR REPLACE INTO site_settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)',
      ['set_gmail_user', 'gmail_user', 'dynodazzle@gmail.com', now]
    );
  }
  const passRow = queryOne('SELECT value FROM site_settings WHERE key = ?', ['gmail_app_password']);
  const appPass = (passRow?.value || process.env.GMAIL_APP_PASSWORD || 'nftx efpc ropm cdfz').trim();
  if (!passRow || !passRow.value || passRow.value.trim() === '') {
    db.run(
      'INSERT OR REPLACE INTO site_settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)',
      ['set_gmail_app_password', 'gmail_app_password', appPass, now]
    );
    console.log('[Database] Configured Gmail SMTP App Password for dynodazzle@gmail.com');
  }

  saveDatabase();
}
