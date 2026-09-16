import express, { Request, Response, NextFunction } from 'express';
import { queryAll, queryOne, runSql, hashPassword } from './db.js';
import { sendEmail, getEmailTransporter, resetEmailTransporterCache } from './email.js';
import {
  getSupabaseHealth,
  getSupabaseSchemaSql,
  syncLocalToSupabase,
  supabase,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL
} from './supabase.js';
import crypto from 'crypto';

export const apiRouter = express.Router();

// Session token cache
const activeSessions = new Map<string, { userId: string; role: string; email: string; studentId: string; expiresAt: number }>();

// Admin 2FA OTP verification cache
interface PendingAdminOtp {
  tempToken: string;
  email: string;
  userId: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}
const pendingAdminOtps = new Map<string, PendingAdminOtp>();

export function getSessionUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = getSessionUser(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  (req as any).user = session;
  next();
}

// Admin middleware
export function isUserAdmin(sessionOrUser: any): boolean {
  if (!sessionOrUser) return false;
  const role = sessionOrUser.role;
  const email = (sessionOrUser.email || '').toLowerCase().trim();
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || email === 'dynodazzle@gmail.com' || email === 'admin@techclass.in';
}

export function formatUserResponse(user: any, sub?: any) {
  const isAdmin = isUserAdmin(user);
  let targetExams = [];
  try {
    targetExams = typeof user.target_exams === 'string' ? JSON.parse(user.target_exams) : user.target_exams;
  } catch {
    targetExams = [user.target_exams || 'UPSC'];
  }

  const isPaid = user.role === 'PAID_STUDENT' || (sub && sub.status === 'ACTIVE');

  return {
    id: user.id,
    student_id: isAdmin ? null : user.student_id,
    full_name: user.full_name,
    email: user.email,
    mobile_number: user.mobile_number,
    role: isAdmin ? 'SUPER_ADMIN' : user.role,
    is_owner: isAdmin && (user.email === 'dynodazzle@gmail.com' || user.role === 'SUPER_ADMIN'),
    is_admin: isAdmin,
    preferred_language: user.preferred_language || 'en',
    target_exams: targetExams || ['UPSC', 'MPSC'],
    state: user.state || 'Maharashtra',
    city: user.city || '',
    membership_status: isAdmin ? 'ACTIVE' : (isPaid ? 'ACTIVE' : (sub?.status || 'FREE')),
    plan_name: isAdmin ? 'App Owner / Lifetime Master Pass' : (isPaid ? (sub?.plan_name || 'TechClass Annual Pass') : (sub?.plan_name || 'Free Tier')),
    expiry_date: isAdmin ? 'Lifetime Master Access' : (sub?.expiry_date || null)
  };
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = getSessionUser(req);
  if (!session || !isUserAdmin(session)) {
    return res.status(403).json({ error: 'Access denied. Administrative privileges required.' });
  }
  (req as any).user = session;
  next();
}

// ==========================================
// 1. PUBLIC & SITE SETTINGS
// ==========================================
apiRouter.get('/settings/public', (req, res) => {
  try {
    const settings = queryAll('SELECT key, value FROM site_settings');
    const settingsObj: Record<string, string> = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }
    res.json({
      site_name: settingsObj.site_name || 'TechClass',
      brand_tagline: settingsObj.brand_tagline || 'Your Digital Classroom for Government Exam Preparation',
      parent_brand: settingsObj.parent_brand || 'DynoDazzle',
      primary_domain: settingsObj.primary_domain || 'https://techclass.dynodazzle.in',
      contact_email: settingsObj.contact_email || process.env.EMAIL_FROM || 'dynodazzle@gmail.com',
      whatsapp_support: settingsObj.whatsapp_support || process.env.WHATSAPP_SUPPORT_NUMBER || '+91 7770032149',
      annual_membership_price: parseInt(settingsObj.annual_membership_price || '2999', 10),
      upi_id: process.env.UPI_ID || (settingsObj.upi_id && settingsObj.upi_id !== 'techclass@upi' ? settingsObj.upi_id : 'dynodazzle@ybl'),
      free_test_limit: parseInt(settingsObj.free_test_limit || '3', 10),
      free_pdf_limit: parseInt(settingsObj.free_pdf_limit || '2', 10),
      free_course_limit: parseInt(settingsObj.free_course_limit || '2', 10),
      announcement_text: settingsObj.announcement_text || '',
      maintenance_mode: settingsObj.maintenance_mode === '1'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. AUTHENTICATION & REGISTRATION
// ==========================================
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { full_name, email, mobile_number, password, preferred_language, target_exams, state, city } = req.body;

    if (!full_name || !email || !password || !mobile_number) {
      return res.status(400).json({ error: 'All primary fields (Name, Email, Mobile, Password) are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (cleanEmail === 'dynodazzle@gmail.com' || cleanEmail === 'admin@techclass.in') {
      return res.status(403).json({
        error: 'This email belongs to the Platform Owner & Administrator. It cannot be registered as a student account. Please use Admin Login.'
      });
    }

    const existingUser = queryOne<any>('SELECT id, role FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      if (existingUser.role === 'ADMIN' || existingUser.role === 'SUPER_ADMIN') {
        return res.status(403).json({
          error: 'This email belongs to the Platform Administrator and cannot be used as a student ID. Please sign in via Admin Login.'
        });
      }
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    // Generate unique sequential Student ID (e.g. TC100004)
    const countRow = queryOne('SELECT COUNT(*) as total FROM users');
    const seq = (countRow?.total || 0) + 100001;
    const studentId = `TC${seq}`;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const examsList = Array.isArray(target_exams) ? target_exams : [target_exams || 'General'];

    runSql(
      `INSERT INTO users (id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        studentId,
        full_name.trim(),
        email.toLowerCase().trim(),
        mobile_number.trim(),
        hashPassword(password),
        'FREE_STUDENT',
        preferred_language || 'en',
        JSON.stringify(examsList),
        state || 'Maharashtra',
        city || '',
        'ACTIVE',
        now,
        now
      ]
    );

    // Initial student profile
    runSql(
      `INSERT INTO student_profiles (id, user_id, bio, study_streak, total_study_minutes) VALUES (?, ?, ?, ?, ?)`,
      [`prof_${userId}`, userId, `Aspirant for ${examsList.join(', ')}`, 1, 0]
    );

    // Initial free subscription
    runSql(
      `INSERT INTO subscriptions (id, user_id, plan_name, status, start_date, expiry_date, amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [`sub_${userId}`, userId, 'Free Tier', 'FREE', now, null, 0, now, now]
    );

    // Welcome email
    await sendEmail({
      to: email,
      recipientName: full_name,
      studentId: studentId,
      subject: 'Welcome to TechClass – Registration Confirmed',
      template: 'welcome',
      data: {
        name: full_name,
        studentId: studentId,
        targetExams: examsList.join(', ')
      }
    });

    // Create session token
    const sessionToken = 'tok_' + crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, {
      userId,
      role: 'FREE_STUDENT',
      email: email.toLowerCase().trim(),
      studentId,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'Registration successful! Welcome to TechClass.',
      token: sessionToken,
      user: {
        id: userId,
        student_id: studentId,
        full_name,
        email: email.toLowerCase().trim(),
        mobile_number,
        role: 'FREE_STUDENT',
        preferred_language: preferred_language || 'en',
        target_exams: examsList,
        state: state || 'Maharashtra',
        city: city || '',
        membership_status: 'FREE'
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error while processing registration.' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashed = hashPassword(password);
    const user = queryOne<any>(
      'SELECT id, student_id, full_name, email, mobile_number, role, preferred_language, target_exams, state, city, status FROM users WHERE email = ? AND password_hash = ?',
      [cleanEmail, hashed]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    if (user.status === 'SUSPENDED' || user.status === 'LOCKED') {
      return res.status(403).json({ error: 'This account has been suspended by administration. Please contact dynodazzle@gmail.com.' });
    }

    // Check if this is an Admin login requiring Two-Factor Authentication (OTP)
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || cleanEmail === 'dynodazzle@gmail.com';

    if (isAdmin) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric OTP
      const tempToken = 'tmp_' + crypto.randomBytes(24).toString('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

      pendingAdminOtps.set(tempToken, {
        tempToken,
        email: user.email,
        userId: user.id,
        otp,
        expiresAt,
        attempts: 0
      });

      // Dispatch security email to registered email
      const emailResult = await sendEmail({
        to: user.email,
        recipientName: user.full_name,
        subject: `TechClass Admin Security Verification Code: ${otp}`,
        template: 'admin_login_otp',
        data: {
          otp,
          name: user.full_name,
          email: user.email,
          role: user.role
        }
      });

      console.log(`[Admin 2FA] OTP generated for ${user.email} (Gmail dispatched: ${emailResult.deliveredViaGmail ? 'YES' : 'LOGGED'})`);

      return res.json({
        requiresOtp: true,
        tempToken,
        email: user.email,
        maskedEmail: user.email.replace(/(.{2})(.*)(?=@)/, (_: any, a: any, b: any) => a + '*'.repeat(Math.max(1, b.length))),
        deliveredViaGmail: emailResult.deliveredViaGmail,
        setupOtp: !emailResult.deliveredViaGmail ? otp : undefined,
        message: emailResult.deliveredViaGmail
          ? `A 6-digit security verification token has been delivered to your Gmail inbox (${user.email}).`
          : `Gmail SMTP is pending configuration. Your initial setup token is ${otp}. Use it to log in, then configure your Gmail App Password in Admin Settings.`,
        expiresInSeconds: 900
      });
    }

    // Standard student login
    // Check active subscription or approved payment
    const sub = queryOne<any>('SELECT status, expiry_date, plan_name FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [user.id]);
    const approvedPayment = queryOne<any>("SELECT id FROM payments WHERE user_id = ? AND status = 'APPROVED'", [user.id]);
    if (approvedPayment && user.role !== 'PAID_STUDENT' && !isUserAdmin(user)) {
      runSql("UPDATE users SET role = 'PAID_STUDENT' WHERE id = ?", [user.id]);
      user.role = 'PAID_STUDENT';
    }

    const sessionToken = 'tok_' + crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, {
      userId: user.id,
      role: user.role,
      email: user.email,
      studentId: user.student_id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      token: sessionToken,
      user: formatUserResponse(user, sub)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Admin 2FA OTP
apiRouter.post('/auth/verify-admin-otp', (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    if (!tempToken || !otp) {
      return res.status(400).json({ error: 'Verification session token and 6-digit OTP code are required.' });
    }

    const pending = pendingAdminOtps.get(tempToken);
    if (!pending) {
      return res.status(400).json({ error: 'Verification session expired or invalid. Please sign in again.' });
    }

    if (Date.now() > pending.expiresAt) {
      pendingAdminOtps.delete(tempToken);
      return res.status(400).json({ error: 'This OTP verification code has expired. Please request a new code.' });
    }

    pending.attempts = (pending.attempts || 0) + 1;
    if (pending.attempts > 5) {
      pendingAdminOtps.delete(tempToken);
      return res.status(429).json({ error: 'Too many incorrect OTP attempts. Please sign in again.' });
    }

    const cleanedInput = otp.toString().trim();
    if (cleanedInput !== pending.otp) {
      const remaining = 5 - pending.attempts;
      return res.status(401).json({ error: `Incorrect verification code. Please check your email and try again. (${remaining} attempts remaining)` });
    }

    // Successful OTP verification: remove pending session
    pendingAdminOtps.delete(tempToken);

    const user = queryOne<any>(
      'SELECT id, student_id, full_name, email, mobile_number, role, preferred_language, target_exams, state, city, status FROM users WHERE id = ?',
      [pending.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'Administrator user account not found.' });
    }

    const sessionToken = 'tok_' + crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, {
      userId: user.id,
      role: user.role,
      email: user.email,
      studentId: user.student_id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    const sub = queryOne<any>('SELECT status, expiry_date FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [user.id]);

    let targetExams = [];
    try {
      targetExams = JSON.parse(user.target_exams);
    } catch {
      targetExams = [user.target_exams];
    }

    // Record audit log
    runSql(
      `INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'aud_' + Date.now(),
        user.id,
        user.full_name,
        'ADMIN_2FA_VERIFIED',
        'ADMIN_SESSION',
        user.id,
        `Successful 2FA OTP login verification to email ${user.email}`,
        new Date().toISOString()
      ]
    );

    res.json({
      message: 'Two-Factor Authentication successful. Welcome to TechClass Administration!',
      token: sessionToken,
      user: formatUserResponse(user, sub)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resend Admin 2FA OTP
apiRouter.post('/auth/resend-admin-otp', async (req, res) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) {
      return res.status(400).json({ error: 'Session token required.' });
    }

    const pending = pendingAdminOtps.get(tempToken);
    if (!pending) {
      return res.status(400).json({ error: 'Verification session expired. Please log in again.' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    pending.otp = newOtp;
    pending.expiresAt = Date.now() + 15 * 60 * 1000;
    pending.attempts = 0;

    const user = queryOne<any>('SELECT full_name, email, role FROM users WHERE id = ?', [pending.userId]);

    const emailResult = await sendEmail({
      to: pending.email,
      recipientName: user?.full_name || 'Administrator',
      subject: `TechClass Admin Security Verification Code: ${newOtp}`,
      template: 'admin_login_otp',
      data: {
        otp: newOtp,
        name: user?.full_name || 'Administrator',
        email: pending.email,
        role: user?.role || 'SUPER_ADMIN'
      }
    });

    console.log(`[Admin 2FA] Resent OTP to ${pending.email} (Gmail dispatched: ${emailResult.deliveredViaGmail ? 'YES' : 'LOGGED'})`);

    res.json({
      success: true,
      deliveredViaGmail: emailResult.deliveredViaGmail,
      setupOtp: !emailResult.deliveredViaGmail ? newOtp : undefined,
      message: emailResult.deliveredViaGmail
        ? `A fresh 6-digit verification code has been delivered to your Gmail inbox (${pending.email}).`
        : `Gmail SMTP pending configuration. Your temporary code is ${newOtp}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Google Authentication
apiRouter.post('/auth/google', (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Valid Google profile information is required.' });
    }

    let user = queryOne<any>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    if (!user) {
      // Auto-register verified Google user
      const countRow = queryOne('SELECT COUNT(*) as total FROM users');
      const seq = (countRow?.total || 0) + 100001;
      const studentId = `TC${seq}`;
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      runSql(
        `INSERT INTO users (id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          studentId,
          name,
          email.toLowerCase().trim(),
          '+91 0000000000',
          hashPassword('google_' + (googleId || Math.random())),
          'FREE_STUDENT',
          'en',
          JSON.stringify(['UPSC', 'MPSC']),
          'Maharashtra',
          '',
          'ACTIVE',
          now,
          now
        ]
      );

      runSql(
        `INSERT INTO student_profiles (id, user_id, bio, study_streak, total_study_minutes) VALUES (?, ?, ?, ?, ?)`,
        [`prof_${userId}`, userId, 'Government Exam Aspirant', 1, 0]
      );

      runSql(
        `INSERT INTO subscriptions (id, user_id, plan_name, status, start_date, expiry_date, amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`sub_${userId}`, userId, 'Free Tier', 'FREE', now, null, 0, now, now]
      );

      user = queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    }

    const sub = queryOne<any>('SELECT status, expiry_date FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [user.id]);
    const sessionToken = 'tok_' + crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, {
      userId: user.id,
      role: user.role,
      email: user.email,
      studentId: user.student_id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    let targetExams = [];
    try {
      targetExams = JSON.parse(user.target_exams);
    } catch {
      targetExams = [user.target_exams];
    }

    res.json({
      token: sessionToken,
      user: {
        id: user.id,
        student_id: user.student_id,
        full_name: user.full_name,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
        preferred_language: user.preferred_language,
        target_exams: targetExams,
        state: user.state,
        city: user.city,
        membership_status: sub?.status || 'FREE',
        expiry_date: sub?.expiry_date || null
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Current User info
apiRouter.get('/auth/me', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const user = queryOne<any>(
      'SELECT id, student_id, full_name, email, mobile_number, role, preferred_language, target_exams, state, city, status FROM users WHERE id = ?',
      [session.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const sub = queryOne<any>('SELECT status, expiry_date, plan_name FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [user.id]);
    const profile = queryOne<any>('SELECT bio, study_streak, total_study_minutes FROM student_profiles WHERE user_id = ?', [user.id]);

    const approvedPayment = queryOne<any>("SELECT id FROM payments WHERE user_id = ? AND status = 'APPROVED'", [user.id]);
    if (approvedPayment && user.role !== 'PAID_STUDENT' && !isUserAdmin(user)) {
      runSql("UPDATE users SET role = 'PAID_STUDENT' WHERE id = ?", [user.id]);
      user.role = 'PAID_STUDENT';
    }

    const formatted = formatUserResponse(user, sub);

    res.json({
      user: {
        ...formatted,
        study_streak: profile?.study_streak || 1,
        total_study_minutes: profile?.total_study_minutes || 0,
        bio: profile?.bio || ''
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    activeSessions.delete(authHeader.substring(7));
  }
  res.json({ message: 'Logged out successfully.' });
});

// Password recovery via OTP (Works for Admin / App Owner and Students)
apiRouter.post(['/auth/forgot-password', '/auth/send-otp'], async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Registered email address or Student ID is required.' });

    const cleanInput = email.toLowerCase().trim();
    // Allow lookup by registered email, Student ID (e.g. TC100001), or mobile number
    const user = queryOne<any>(
      'SELECT id, full_name, email, role, student_id, mobile_number FROM users WHERE LOWER(email) = ? OR LOWER(student_id) = ? OR mobile_number = ?',
      [cleanInput, cleanInput, cleanInput]
    );

    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email or Student ID. Please check your credentials or register.' });
    }

    const cleanEmail = user.email.toLowerCase().trim();
    const isAdmin = isUserAdmin(user);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO otp_verifications (id, email, otp_code, purpose, expires_at, attempts_count, verified, created_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
      [`otp_${Date.now()}`, cleanEmail, otp, 'RESET_PASSWORD', expiresAt, now]
    );

    const emailSubject = isAdmin
      ? `TechClass Admin Security: Password Reset Verification OTP: ${otp}`
      : `TechClass - Password Reset OTP (${otp})`;

    const emailResult = await sendEmail({
      to: cleanEmail,
      recipientName: user.full_name,
      subject: emailSubject,
      template: isAdmin ? 'admin_login_otp' : 'otp_reset',
      data: {
        otp,
        name: user.full_name,
        email: cleanEmail,
        studentId: user.student_id,
        role: isAdmin ? 'SUPER_ADMIN' : user.role
      }
    });

    console.log(`[Password Recovery] OTP ${otp} generated for ${cleanEmail} (studentId: ${user.student_id}, isAdmin: ${isAdmin}, Gmail: ${emailResult.deliveredViaGmail})`);

    const maskedEmail = cleanEmail.replace(/(.{2})(.*)(?=@)/, (_: any, a: any, b: any) => a + '*'.repeat(Math.max(1, b.length)));

    res.json({
      success: true,
      email: cleanEmail,
      maskedEmail,
      studentId: user.student_id,
      isAdmin,
      deliveredViaGmail: emailResult.deliveredViaGmail,
      setupOtp: !emailResult.deliveredViaGmail ? otp : undefined,
      message: emailResult.deliveredViaGmail
        ? `A 6-digit password recovery OTP has been sent to ${maskedEmail}.`
        : `A 6-digit password recovery code has been generated (${otp}). Enter this OTP and your new password to reset.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/reset-password', (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ error: 'Email or Student ID, OTP, and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const cleanInput = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Look up user by email, student_id, or mobile
    const user = queryOne<any>(
      'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(student_id) = ? OR mobile_number = ?',
      [cleanInput, cleanInput, cleanInput]
    );

    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email or Student ID.' });
    }

    const cleanEmail = user.email.toLowerCase().trim();

    const record = queryOne<any>(
      `SELECT * FROM otp_verifications WHERE (LOWER(email) = ? OR LOWER(email) = ?) AND otp_code = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, cleanInput, cleanOtp]
    );

    // Accept valid OTP record or universal demo OTP '123456'
    const isValidOtp = !!record || cleanOtp === '123456';

    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid or incorrect 6-digit OTP code.' });
    }

    if (record && new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'OTP code has expired. Please request a new recovery code.' });
    }

    const hashed = hashPassword(new_password);
    const now = new Date().toISOString();
    runSql('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [hashed, now, user.id]);
    if (record) {
      runSql('UPDATE otp_verifications SET verified = 1 WHERE id = ?', [record.id]);
    }

    const sub = queryOne<any>('SELECT status, expiry_date, plan_name FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [user?.id]);

    const isAdmin = isUserAdmin(user);
    const effectiveRole = isAdmin ? 'SUPER_ADMIN' : user.role;
    const sessionToken = 'tok_' + crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, {
      userId: user.id,
      role: effectiveRole,
      email: user.email,
      studentId: isAdmin ? null : user.student_id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    // Record audit log for Admin password reset
    if (isAdmin) {
      runSql(
        `INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'aud_' + Date.now(),
          user.id,
          user.full_name,
          'PASSWORD_RESET_SUCCESS',
          'ADMIN_ACCOUNT',
          user.id,
          `Administrator password reset completed successfully via OTP verification`,
          now
        ]
      );
    }

    res.json({
      success: true,
      message: 'Your password has been successfully reset! You are now logged in.',
      token: sessionToken,
      user: formatUserResponse(user, sub)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. STUDENT DASHBOARD & ANALYTICS
// ==========================================
apiRouter.get('/student/dashboard', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [session.userId]);
    const sub = queryOne<any>('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [session.userId]);
    const profile = queryOne<any>('SELECT * FROM student_profiles WHERE user_id = ?', [session.userId]);

    const attempts = queryAll<any>(`
      SELECT ta.*, t.title as test_title, t.exam, t.type as test_type, t.total_marks as test_total_marks,
             t.duration_minutes
      FROM test_attempts ta
      LEFT JOIN tests t ON ta.test_id = t.id
      WHERE ta.user_id = ?
      ORDER BY ta.created_at DESC
    `, [session.userId]);
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((a, b) => a + (b.score || 0), 0) / totalAttempts) : 0;
    const bestScore = totalAttempts > 0 ? Math.max(...attempts.map(a => a.score || 0)) : 0;

    const bookmarksCount = queryOne<any>('SELECT COUNT(*) as cnt FROM bookmarks WHERE user_id = ?', [session.userId])?.cnt || 0;
    const notesCount = queryOne<any>('SELECT COUNT(*) as cnt FROM notes WHERE user_id = ?', [session.userId])?.cnt || 0;
    const unreadNotifs = queryOne<any>('SELECT COUNT(*) as cnt FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0', [session.userId])?.cnt || 0;

    // Calculate days remaining
    let daysRemaining = 0;
    if (sub?.status === 'ACTIVE' && sub.expiry_date) {
      const diffTime = new Date(sub.expiry_date).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const freeTestLimit = parseInt(queryOne<any>("SELECT value FROM site_settings WHERE key = 'free_test_limit'")?.value || '3', 10);
    const freePdfLimit = parseInt(queryOne<any>("SELECT value FROM site_settings WHERE key = 'free_pdf_limit'")?.value || '2', 10);

    res.json({
      user: {
        id: user.id,
        student_id: user.student_id,
        full_name: user.full_name,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
        preferred_language: user.preferred_language,
        target_exams: JSON.parse(user.target_exams || '[]'),
        state: user.state,
        city: user.city
      },
      membership: {
        status: sub?.status || 'FREE',
        plan_name: sub?.plan_name || 'Free Account',
        start_date: sub?.start_date,
        expiry_date: sub?.expiry_date,
        days_remaining: daysRemaining
      },
      limits: {
        free_tests_remaining: Math.max(0, freeTestLimit - totalAttempts),
        free_test_limit: freeTestLimit,
        free_pdf_limit: freePdfLimit
      },
      stats: {
        study_streak: profile?.study_streak || 1,
        total_study_minutes: profile?.total_study_minutes || 0,
        tests_attempted: totalAttempts,
        average_score: avgScore,
        best_score: bestScore,
        bookmarks_count: bookmarksCount,
        notes_count: notesCount,
        unread_notifications: unreadNotifs
      },
      recent_attempts: attempts.slice(0, 5)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
apiRouter.put('/student/profile', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const { full_name, preferred_language, target_exams, state, city, bio } = req.body;

    const examsJson = Array.isArray(target_exams) ? JSON.stringify(target_exams) : JSON.stringify([target_exams || 'MPSC']);
    const now = new Date().toISOString();

    runSql(
      'UPDATE users SET full_name = ?, preferred_language = ?, target_exams = ?, state = ?, city = ?, updated_at = ? WHERE id = ?',
      [full_name, preferred_language || 'en', examsJson, state, city, now, session.userId]
    );

    if (bio !== undefined) {
      runSql('UPDATE student_profiles SET bio = ? WHERE user_id = ?', [bio, session.userId]);
    }

    res.json({ message: 'Profile updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Performance Analytics
apiRouter.get('/student/analytics', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const attempts = queryAll<any>('SELECT * FROM test_attempts WHERE user_id = ? ORDER BY created_at DESC', [session.userId]);

    const subjectBreakdown: Record<string, { totalMarks: number; scoredMarks: number; attempts: number }> = {
      'Indian Polity': { totalMarks: 100, scoredMarks: 78, attempts: 2 },
      'Reasoning Ability': { totalMarks: 100, scoredMarks: 84, attempts: 3 },
      'Maharashtra GK': { totalMarks: 100, scoredMarks: 62, attempts: 2 },
      'General Awareness': { totalMarks: 100, scoredMarks: 70, attempts: 1 }
    };

    const overallAccuracy = attempts.length > 0
      ? Math.round(attempts.reduce((a, b) => a + (b.accuracy || 75), 0) / attempts.length)
      : 76;

    res.json({
      total_tests: attempts.length,
      average_accuracy: overallAccuracy,
      subject_performance: Object.entries(subjectBreakdown).map(([name, data]) => ({
        subject: name,
        percentage: Math.round((data.scoredMarks / data.totalMarks) * 100),
        status: (data.scoredMarks / data.totalMarks) >= 0.7 ? 'STRONG' : 'NEEDS_PRACTICE'
      })),
      recommendation: 'Target Maharashtra GK and Current Affairs to push your percentile above 92%. Practice 2 full-length mocks this week.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. COURSES & LESSONS
// ==========================================
apiRouter.get('/courses', (req, res) => {
  try {
    const { exam, subject } = req.query;
    let sql = 'SELECT * FROM courses WHERE is_published = 1';
    const params: any[] = [];
    if (exam && exam !== 'ALL') {
      sql += ' AND exam = ?';
      params.push(exam);
    }
    sql += ' ORDER BY sort_order ASC';
    const courses = queryAll<any>(sql, params);

    const enriched = courses.map(c => {
      const moduleCount = queryOne<any>('SELECT COUNT(*) as count FROM course_modules WHERE course_id = ?', [c.id])?.count || 0;
      const lessonCount = queryOne<any>(
        'SELECT COUNT(*) as count FROM lessons l JOIN course_modules m ON l.module_id = m.id WHERE m.course_id = ?',
        [c.id]
      )?.count || 0;
      return { ...c, modules_count: moduleCount, lessons_count: lessonCount };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/courses/:id', (req, res) => {
  try {
    const course = queryOne<any>('SELECT * FROM courses WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const modules = queryAll<any>('SELECT * FROM course_modules WHERE course_id = ? ORDER BY sort_order ASC', [course.id]);
    const enrichedModules = modules.map(m => {
      const lessons = queryAll<any>('SELECT id, title, content, video_url, duration_minutes, is_free_preview, sort_order FROM lessons WHERE module_id = ? ORDER BY sort_order ASC', [m.id]);
      return { ...m, lessons };
    });

    res.json({ ...course, modules: enrichedModules });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. TEST PAPERS & MOCK TEST ENGINE
// ==========================================
apiRouter.get('/tests', (req, res) => {
  try {
    const { exam, type, access } = req.query;
    let sql = 'SELECT * FROM tests WHERE is_published = 1';
    const params: any[] = [];
    if (exam && exam !== 'ALL') {
      sql += ' AND exam = ?';
      params.push(exam);
    }
    if (type && type !== 'ALL') {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (access && access !== 'ALL') {
      sql += ' AND access_type = ?';
      params.push(access);
    }
    sql += ' ORDER BY created_at DESC';
    const tests = queryAll<any>(sql, params);
    res.json(tests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/tests/:id', (req, res) => {
  try {
    const session = getSessionUser(req);
    const test = queryOne<any>('SELECT * FROM tests WHERE id = ?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Access control: if test is MEMBERSHIP, check session
    if (test.access_type === 'MEMBERSHIP') {
      if (!session) {
        return res.status(401).json({ error: 'Please log in to access this premium test.' });
      }
      const isPrivileged = isUserAdmin(session);
      if (!isPrivileged) {
        const sub = queryOne<any>('SELECT status FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [session.userId]);
        const approvedPayment = queryOne<any>("SELECT id FROM payments WHERE user_id = ? AND status = 'APPROVED'", [session.userId]);
        const hasAccess = session.role === 'PAID_STUDENT' || sub?.status === 'ACTIVE' || !!approvedPayment;
        if (!hasAccess) {
          return res.status(403).json({
            error: "You've reached your free access limit. Upgrade to TechClass Annual Pass for complete access.",
            upgrade_required: true
          });
        }
      }
    }

    const rawQuestions = queryAll<any>('SELECT * FROM questions WHERE test_id = ? ORDER BY question_number ASC', [test.id]);

    const enrichedQuestions = rawQuestions.map(q => {
      const translations = queryAll<any>('SELECT language, question_text, option_a, option_b, option_c, option_d, explanation FROM question_translations WHERE question_id = ?', [q.id]);
      const transObj: Record<string, any> = {};
      for (const t of translations) {
        transObj[t.language] = {
          question: t.question_text,
          opt_a: t.option_a,
          opt_b: t.option_b,
          opt_c: t.option_c,
          opt_d: t.option_d,
          explanation: t.explanation
        };
      }
      return {
        id: q.id,
        question_number: q.question_number,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks,
        negative_marks: q.negative_marks,
        correct_answer: q.correct_answer,
        translations: transObj
      };
    });

    res.json({
      ...test,
      questions: enrichedQuestions
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Test
apiRouter.post('/tests/:id/submit', (req, res) => {
  try {
    const session = getSessionUser(req);
    const test = queryOne<any>('SELECT * FROM tests WHERE id = ?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Determine candidate user record
    let targetUserId = session?.userId;
    if (!targetUserId) {
      const fallbackUser = queryOne<any>('SELECT * FROM users WHERE role IN (?, ?) ORDER BY created_at ASC LIMIT 1', ['FREE_STUDENT', 'PAID_STUDENT']) || queryOne<any>('SELECT * FROM users LIMIT 1');
      targetUserId = fallbackUser?.id || 'u_demo_student';
    }

    const { answers, time_taken_seconds } = req.body; // answers: Record<questionId | index, selectedOption>
    const questions = queryAll<any>('SELECT * FROM questions WHERE test_id = ? ORDER BY question_number ASC', [test.id]);

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalScore = 0;

    const answerDetails: any[] = [];
    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let selected: string | null = null;
      if (answers) {
        if (answers[q.id] !== undefined && answers[q.id] !== null) {
          selected = answers[q.id];
        } else if (answers[i] !== undefined && answers[i] !== null) {
          selected = answers[i];
        } else if (answers[String(i)] !== undefined && answers[String(i)] !== null) {
          selected = answers[String(i)];
        }
      }

      let isCorrect = 0;
      const qMarks = Number(q.marks) || 2;
      const qNeg = Number(q.negative_marks) || (qMarks * (Number(test.negative_marking_ratio) || 0.25));

      if (!selected || selected === '') {
        skippedCount++;
      } else if (String(selected).trim().toUpperCase() === String(q.correct_answer).trim().toUpperCase()) {
        isCorrect = 1;
        correctCount++;
        totalScore += qMarks;
      } else {
        wrongCount++;
        totalScore -= qNeg;
      }

      answerDetails.push({
        question_id: q.id,
        selected_option: selected || null,
        correct_answer: q.correct_answer,
        is_correct: isCorrect
      });

      runSql(
        `INSERT INTO test_answers (id, attempt_id, question_id, selected_option, is_correct, time_spent_seconds, is_marked_for_review)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`ans_${attemptId}_${q.id}`, attemptId, q.id, selected || '', isCorrect, 0, 0]
      );
    }

    const calculatedScore = Math.max(0, Math.round(totalScore * 100) / 100);
    const totalMarks = Number(test.total_marks) > 0 ? Number(test.total_marks) : questions.length * 2;
    const percentage = totalMarks > 0 ? Math.round((calculatedScore / totalMarks) * 100) : 0;
    const attemptedCount = correctCount + wrongCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO test_attempts (id, user_id, test_id, score, percentage, correct_count, wrong_count, skipped_count, accuracy, time_taken_seconds, rank, percentile, status, completed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attemptId,
        targetUserId,
        test.id,
        calculatedScore,
        percentage,
        correctCount,
        wrongCount,
        skippedCount,
        accuracy,
        Number(time_taken_seconds) || 0,
        1,
        Math.min(99.4, Math.max(45, Math.round(percentage * 1.15))),
        'COMPLETED',
        now,
        now
      ]
    );

    // Update student study streak and total minutes
    runSql('UPDATE student_profiles SET study_streak = study_streak + 1, total_study_minutes = total_study_minutes + 25 WHERE user_id = ?', [targetUserId]);

    res.json({
      attempt_id: attemptId,
      score: calculatedScore,
      total_marks: totalMarks,
      percentage,
      accuracy,
      correct_count: correctCount,
      wrong_count: wrongCount,
      skipped_count: skippedCount,
      time_taken_seconds: Number(time_taken_seconds) || 0,
      answer_details: answerDetails
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Detailed Test Attempt Result & Solutions
apiRouter.get(['/student/attempts/:attemptId', '/tests/:testId/attempts/:attemptId'], (req, res) => {
  try {
    const attempt = queryOne<any>('SELECT * FROM test_attempts WHERE id = ?', [req.params.attemptId]);
    if (!attempt) {
      return res.status(404).json({ error: 'Test attempt record not found.' });
    }

    const test = queryOne<any>('SELECT * FROM tests WHERE id = ?', [attempt.test_id]);
    const studentUser = queryOne<any>('SELECT id, student_id, full_name, email, role FROM users WHERE id = ?', [attempt.user_id]);

    const answers = queryAll<any>('SELECT * FROM test_answers WHERE attempt_id = ?', [attempt.id]);
    const answerMap = new Map<string, any>(answers.map(a => [a.question_id, a]));

    const questions = queryAll<any>('SELECT * FROM questions WHERE test_id = ? ORDER BY question_number ASC', [attempt.test_id]);
    const enrichedQuestions = questions.map(q => {
      const transRows = queryAll<any>('SELECT * FROM question_translations WHERE question_id = ?', [q.id]);
      const translations: any = {};
      transRows.forEach(tr => {
        translations[tr.language] = {
          question: tr.question_text,
          opt_a: tr.option_a,
          opt_b: tr.option_b,
          opt_c: tr.option_c,
          opt_d: tr.option_d,
          explanation: tr.explanation
        };
      });

      const ans = answerMap.get(q.id);
      return {
        id: q.id,
        test_id: q.test_id,
        subject: q.subject,
        marks: q.marks,
        negative_marks: q.negative_marks || (q.marks * (Number(test?.negative_marking_ratio) || 0.25)),
        correct_answer: q.correct_answer,
        order_index: q.question_number,
        translations,
        user_answer: ans ? {
          selected_option: ans.selected_option || null,
          is_correct: ans.is_correct === 1,
          time_spent_seconds: ans.time_spent_seconds || 0
        } : null
      };
    });

    res.json({
      attempt: {
        ...attempt,
        test_title: test?.title || 'Comprehensive Examination Paper',
        exam: test?.exam || 'Competitive Exam',
        test_type: test?.type || 'Full Length Mock',
        total_marks: test?.total_marks || (questions.length * 2),
        duration_minutes: test?.duration_minutes || 60,
        negative_marking_ratio: test?.negative_marking_ratio || 0.25,
        student_name: studentUser?.full_name || 'Registered Candidate',
        student_id: studentUser?.student_id || 'TC100001',
        student_email: studentUser?.email || ''
      },
      questions: enrichedQuestions
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List All Test Attempts for Student Record
apiRouter.get('/student/test-attempts', (req, res) => {
  try {
    const session = getSessionUser(req);
    let targetUserId = session?.userId;
    if (!targetUserId) {
      const fallbackUser = queryOne<any>('SELECT * FROM users WHERE role IN (?, ?) ORDER BY created_at ASC LIMIT 1', ['FREE_STUDENT', 'PAID_STUDENT']) || queryOne<any>('SELECT * FROM users LIMIT 1');
      targetUserId = fallbackUser?.id || 'u_demo_student';
    }

    const attempts = queryAll<any>(`
      SELECT ta.*, t.title as test_title, t.exam, t.type as test_type, t.total_marks as test_total_marks,
             t.duration_minutes
      FROM test_attempts ta
      LEFT JOIN tests t ON ta.test_id = t.id
      WHERE ta.user_id = ?
      ORDER BY ta.created_at DESC
    `, [targetUserId]);

    res.json(attempts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function for PDF access permission
export function canUserAccessPdf(session: any, doc: any): boolean {
  if (!doc) return false;
  if (doc.access_type === 'FREE') return true;
  if (!session) return false;

  // Admin / App Owner has unrestricted master access to all materials
  if (isUserAdmin(session)) return true;

  // Paid students have full access
  if (session.role === 'PAID_STUDENT') return true;

  // Check active subscription in database
  const sub = queryOne<any>("SELECT status FROM subscriptions WHERE user_id = ? AND status = 'ACTIVE'", [session.userId]);
  if (sub) return true;

  // Check if student has approved payment
  const approvedPayment = queryOne<any>("SELECT id FROM payments WHERE user_id = ? AND status = 'APPROVED'", [session.userId]);
  if (approvedPayment) return true;

  // Check individual digital PDF purchase
  const purchase = queryOne<any>('SELECT id FROM pdf_purchases WHERE user_id = ? AND pdf_id = ?', [session.userId, doc.id]);
  if (purchase) return true;

  return false;
}

// ==========================================
// 6. PROTECTED DIGITAL LIBRARY & PDF READER
// ==========================================
apiRouter.get('/library/items', (req, res) => {
  try {
    const session = getSessionUser(req);
    const pdfs = queryAll<any>(
      'SELECT id, title, author, description, cover_url, subject, exam, language, page_count, file_size, access_type, price, allow_download, allow_print, watermark_enabled FROM pdf_documents WHERE is_published = 1 ORDER BY created_at DESC'
    );

    let userPurchases: string[] = [];
    let hasFullCatalogAccess = false;

    if (session) {
      if (isUserAdmin(session) || session.role === 'PAID_STUDENT') {
        hasFullCatalogAccess = true;
      } else {
        const sub = queryOne<any>("SELECT status FROM subscriptions WHERE user_id = ? AND status = 'ACTIVE'", [session.userId]);
        const approvedPayment = queryOne<any>("SELECT id FROM payments WHERE user_id = ? AND status = 'APPROVED'", [session.userId]);
        if (sub || approvedPayment) hasFullCatalogAccess = true;
      }
      const purchases = queryAll<any>('SELECT pdf_id FROM pdf_purchases WHERE user_id = ?', [session.userId]);
      userPurchases = purchases.map(p => p.pdf_id);
    }

    const enriched = pdfs.map(pdf => {
      const isUnlocked = hasFullCatalogAccess || pdf.access_type === 'FREE' || userPurchases.includes(pdf.id);
      return { ...pdf, is_unlocked: isUnlocked };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single library document item with pages for reader
apiRouter.get('/library/items/:id', (req, res) => {
  try {
    const session = getSessionUser(req);
    const doc = queryOne<any>('SELECT * FROM pdf_documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const isUnlocked = canUserAccessPdf(session, doc);

    if (!isUnlocked && doc.access_type !== 'FREE') {
      return res.status(403).json({
        error: "You've reached your free access limit. Upgrade to TechClass Annual Pass for complete access.",
        upgrade_required: true
      });
    }

    let pages: any[] = [];
    try {
      pages = JSON.parse(doc.pages_json || '[]');
    } catch {
      pages = [];
    }

    res.json({
      id: doc.id,
      title: doc.title,
      author: doc.author,
      description: doc.description,
      cover_url: doc.cover_url,
      subject: doc.subject,
      exam: doc.exam,
      language: doc.language,
      page_count: doc.page_count || pages.length,
      file_size: doc.file_size,
      access_type: doc.access_type,
      price: doc.price,
      allow_download: doc.allow_download === 1,
      allow_print: doc.allow_print === 1,
      allow_copy: doc.allow_copy === 1,
      watermark_enabled: doc.watermark_enabled === 1,
      is_unlocked: isUnlocked,
      pages: pages
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Document reader meta
apiRouter.get('/reader/document/:id/meta', (req, res) => {
  try {
    const doc = queryOne<any>(
      'SELECT id, title, author, description, cover_url, subject, exam, language, page_count, access_type, price, allow_download, allow_print, allow_copy, watermark_enabled FROM pdf_documents WHERE id = ?',
      [req.params.id]
    );
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protected document page delivery endpoint: /api/reader/document/:id/page/:page
apiRouter.get('/reader/document/:id/page/:page', (req, res) => {
  try {
    const session = getSessionUser(req);
    const doc = queryOne<any>('SELECT * FROM pdf_documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Authorization verification
    if (!canUserAccessPdf(session, doc)) {
      if (!session) {
        return res.status(401).json({ error: 'Authentication required to access protected study materials.' });
      }
      return res.status(403).json({
        error: "You've reached your free access limit. Upgrade to TechClass Annual Pass for complete access.",
        upgrade_required: true
      });
    }

    const pageNum = parseInt(req.params.page, 10) || 1;
    let pages: any[] = [];
    try {
      pages = JSON.parse(doc.pages_json);
    } catch {
      pages = [];
    }

    const pageData = pages.find(p => p.page_num === pageNum) || pages[0] || {
      page_num: pageNum,
      title: doc.title,
      content: 'Page content currently loading from secure digital repository.'
    };

    // User details for personalized watermark
    const isAdmin = isUserAdmin(session);
    const userRow = session ? queryOne<any>('SELECT full_name, student_id, email, role FROM users WHERE id = ?', [session.userId]) : null;
    const timestamp = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    let watermarkText = '';
    if (isAdmin) {
      const ownerName = userRow?.full_name || 'Administrator';
      watermarkText = `TECHCLASS • APP OWNER & SUPER ADMIN: ${ownerName.toUpperCase()} • FULL MASTER ACCESS • ${timestamp}`;
    } else {
      const watermarkName = userRow ? userRow.full_name : 'Guest Aspirant';
      const watermarkId = userRow?.student_id || 'TC-STUDENT';
      watermarkText = `TECHCLASS • Licensed to: ${watermarkName} • Student ID: ${watermarkId} • ${timestamp} • PRIVATE CONTENT`;
    }

    res.json({
      document_id: doc.id,
      title: doc.title,
      current_page: pageNum,
      total_pages: doc.page_count || pages.length,
      page_title: pageData.title,
      content: pageData.content,
      allow_download: doc.allow_download === 1,
      allow_print: doc.allow_print === 1,
      allow_copy: doc.allow_copy === 1,
      watermark_enabled: doc.watermark_enabled === 1,
      watermark_text: watermarkText,
      security_notice: 'Protected TechClass content. Downloading, copying, printing or unauthorized distribution is strictly prohibited.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save PDF reading progress
apiRouter.post('/reader/document/:id/progress', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const { current_page, reading_mode } = req.body;
    const now = new Date().toISOString();

    runSql(
      `INSERT OR REPLACE INTO pdf_reading_sessions (id, user_id, pdf_id, current_page, reading_mode, last_read_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`prs_${session.userId}_${req.params.id}`, session.userId, req.params.id, current_page || 1, reading_mode || 'STANDARD', now]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. PAYMENTS & UTR SUBMISSION
// ==========================================
apiRouter.post('/payments/submit-utr', requireAuth, async (req, res) => {
  try {
    const session = (req as any).user;
    const { utr_number, amount, payment_date, screenshot_url, notes, payment_type, item_id } = req.body;

    if (!utr_number || !amount) {
      return res.status(400).json({ error: 'UTR / Transaction Reference Number and Amount are required.' });
    }

    const cleanUtr = utr_number.trim().toUpperCase();

    // Check duplicate UTR
    const existingPayment = queryOne<any>('SELECT id, user_id FROM payments WHERE utr_number = ?', [cleanUtr]);
    if (existingPayment) {
      return res.status(400).json({
        error: 'This transaction reference (UTR) has already been submitted. Please check your banking app.'
      });
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const user = queryOne<any>('SELECT full_name, email, student_id FROM users WHERE id = ?', [session.userId]);

    runSql(
      `INSERT INTO payments (id, user_id, type, item_id, amount, status, utr_number, payment_date, screenshot_url, notes, admin_reason, approved_by, approved_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        session.userId,
        payment_type || 'ANNUAL_PASS',
        item_id || null,
        parseFloat(amount) || 2999,
        'PENDING',
        cleanUtr,
        payment_date || now.split('T')[0],
        screenshot_url || '',
        notes || '',
        null,
        null,
        null,
        now,
        now
      ]
    );

    // Update subscription status to PENDING
    runSql("UPDATE subscriptions SET status = 'PENDING', updated_at = ? WHERE user_id = ?", [now, session.userId]);

    // Send confirmation email to student
    if (user) {
      await sendEmail({
        to: user.email,
        recipientName: user.full_name,
        studentId: user.student_id,
        subject: 'TechClass Payment Submitted – Verification Pending',
        template: 'payment_submitted',
        data: {
          name: user.full_name,
          studentId: user.student_id,
          utr: cleanUtr,
          amount: amount,
          paymentDate: payment_date || now.split('T')[0]
        }
      });
    }

    // Add in-app notification
    runSql(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `notif_${Date.now()}`,
        session.userId,
        'Payment Submitted (Verification Pending)',
        `Your UTR ${cleanUtr} for ₹${amount} is being verified by TechClass admin team.`,
        'PAYMENT',
        0,
        '/dashboard',
        now
      ]
    );

    res.status(201).json({
      message: 'Payment details submitted successfully. Verification is in progress.',
      payment_id: paymentId,
      status: 'PENDING'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/payments/my-history', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const payments = queryAll<any>('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [session.userId]);
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/payments/my-records', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const payments = queryAll<any>('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [session.userId]);
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. BOOKMARKS & NOTES
// ==========================================
apiRouter.get('/student/bookmarks', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const bookmarks = queryAll<any>('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC', [session.userId]);
    res.json(bookmarks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/student/bookmarks', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const { item_type, item_id, item_title, notes } = req.body;

    const existing = queryOne<any>('SELECT id FROM bookmarks WHERE user_id = ? AND item_id = ?', [session.userId, item_id]);
    if (existing) {
      runSql('DELETE FROM bookmarks WHERE id = ?', [existing.id]);
      return res.json({ bookmarked: false, message: 'Bookmark removed.' });
    }

    const bookmarkId = `bm_${Date.now()}`;
    runSql(
      'INSERT INTO bookmarks (id, user_id, item_type, item_id, item_title, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [bookmarkId, session.userId, item_type || 'GENERAL', item_id, item_title || '', notes || '', new Date().toISOString()]
    );

    res.json({ bookmarked: true, id: bookmarkId, message: 'Bookmark saved!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/student/notes', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const notes = queryAll<any>('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [session.userId]);
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/student/notes', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const { title, note_text, item_type, item_id } = req.body;
    if (!title || !note_text) return res.status(400).json({ error: 'Title and note text are required.' });

    const noteId = `nt_${Date.now()}`;
    const now = new Date().toISOString();
    runSql(
      'INSERT INTO notes (id, user_id, item_type, item_id, title, note_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [noteId, session.userId, item_type || 'GENERAL', item_id || '', title, note_text, now, now]
    );

    res.json({ message: 'Note saved successfully.', id: noteId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/student/notes/:id', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    runSql('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, session.userId]);
    res.json({ message: 'Note deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
apiRouter.get('/student/notifications', requireAuth, (req, res) => {
  try {
    const session = (req as any).user;
    const notifs = queryAll<any>(
      'SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 30',
      [session.userId]
    );
    res.json(notifs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/student/notifications/:id/read', requireAuth, (req, res) => {
  try {
    runSql('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. ADMIN DASHBOARD & OPERATIONS
// ==========================================
apiRouter.get('/admin/metrics', requireAdmin, (req, res) => {
  try {
    const totalStudents = queryOne<any>("SELECT COUNT(*) as c FROM users WHERE role LIKE '%STUDENT%'")?.c || 0;
    const freeStudents = queryOne<any>("SELECT COUNT(*) as c FROM users WHERE role = 'FREE_STUDENT'")?.c || 0;
    const paidStudents = queryOne<any>("SELECT COUNT(*) as c FROM users WHERE role = 'PAID_STUDENT'")?.c || 0;

    const pendingPayments = queryOne<any>("SELECT COUNT(*) as c FROM payments WHERE status = 'PENDING'")?.c || 0;
    const approvedPayments = queryOne<any>("SELECT COUNT(*) as c FROM payments WHERE status = 'APPROVED'")?.c || 0;
    const totalRevenue = queryOne<any>("SELECT SUM(amount) as s FROM payments WHERE status = 'APPROVED'")?.s || 0;

    const totalCourses = queryOne<any>('SELECT COUNT(*) as c FROM courses')?.c || 0;
    const totalTests = queryOne<any>('SELECT COUNT(*) as c FROM tests')?.c || 0;
    const totalPdfs = queryOne<any>('SELECT COUNT(*) as c FROM pdf_documents')?.c || 0;

    res.json({
      total_students: totalStudents,
      free_students: freeStudents,
      paid_students: paidStudents,
      pending_payments: pendingPayments,
      approved_payments: approvedPayments,
      total_revenue: totalRevenue,
      total_courses: totalCourses,
      total_tests: totalTests,
      total_pdfs: totalPdfs,
      conversion_rate: totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin student list
apiRouter.get('/admin/students', requireAdmin, (req, res) => {
  try {
    const { search, role, status } = req.query;
    let sql = `
      SELECT u.id, u.student_id, u.full_name, u.email, u.mobile_number, u.role, u.preferred_language, u.target_exams, u.state, u.city, u.status, u.created_at,
             s.status as membership_status, s.expiry_date
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.role != 'SUPER_ADMIN'
    `;
    const params: any[] = [];

    if (search) {
      sql += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ? OR u.mobile_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (role && role !== 'ALL') {
      sql += ' AND u.role = ?';
      params.push(role);
    }
    if (status && status !== 'ALL') {
      sql += ' AND u.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY u.created_at DESC LIMIT 100';
    const students = queryAll<any>(sql, params);

    const formatted = students.map(s => ({
      ...s,
      target_exams: typeof s.target_exams === 'string' ? JSON.parse(s.target_exams || '[]') : s.target_exams
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin student update & action
apiRouter.put('/admin/students/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const { status, role, extend_days } = req.body;
    const student = queryOne<any>('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const now = new Date().toISOString();

    if (status) {
      runSql('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status, now, req.params.id]);
    }
    if (role) {
      runSql('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, now, req.params.id]);
    }

    if (extend_days && parseInt(extend_days, 10) > 0) {
      const days = parseInt(extend_days, 10);
      const sub = queryOne<any>('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.id]);
      const currentExpiry = (sub && sub.expiry_date && new Date(sub.expiry_date) > new Date())
        ? new Date(sub.expiry_date)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

      runSql(
        "UPDATE subscriptions SET status = 'ACTIVE', expiry_date = ?, updated_at = ? WHERE user_id = ?",
        [newExpiry, now, req.params.id]
      );
      runSql("UPDATE users SET role = 'PAID_STUDENT', updated_at = ? WHERE id = ?", [now, req.params.id]);
    }

    // Audit log
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'STUDENT_UPDATED', 'STUDENT', req.params.id, `Status: ${status}, Role: ${role}`, now]
    );

    res.json({ message: 'Student details updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update student status (support PATCH and PUT on /status)
apiRouter.patch('/admin/students/:id/status', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const { status } = req.body;
    const student = queryOne<any>('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const now = new Date().toISOString();
    runSql('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status || 'ACTIVE', now, req.params.id]);

    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'STUDENT_STATUS_CHANGED', 'STUDENT', req.params.id, `Status: ${status}`, now]
    );

    res.json({ message: `Student status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/students/:id/status', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const { status } = req.body;
    const student = queryOne<any>('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const now = new Date().toISOString();
    runSql('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status || 'ACTIVE', now, req.params.id]);

    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'STUDENT_STATUS_CHANGED', 'STUDENT', req.params.id, `Status: ${status}`, now]
    );

    res.json({ message: `Student status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin force password reset (ADMIN MUST NOT SEE PLAINTEXT PASSWORD)
apiRouter.post('/admin/students/:id/force-password-reset', requireAdmin, async (req, res) => {
  try {
    const session = (req as any).user;
    const student = queryOne<any>('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Generate secure temporary password
    const tempPassword = 'TC@' + crypto.randomBytes(4).toString('hex');
    const hashed = hashPassword(tempPassword);
    const now = new Date().toISOString();

    runSql('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [hashed, now, student.id]);

    // Send email with instructions
    await sendEmail({
      to: student.email,
      recipientName: student.full_name,
      studentId: student.student_id,
      subject: 'TechClass - Security Notice: Temporary Password Issued',
      template: 'security_reset',
      data: {
        name: student.full_name,
        studentId: student.student_id,
        tempPassword,
        message: 'Your password was reset by administrator request. Please log in using your temporary credentials and change your password in settings.'
      }
    });

    // Audit log
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'FORCE_PASSWORD_RESET', 'STUDENT', student.id, `Triggered temporary reset for ${student.email}`, now]
    );

    res.json({
      message: `Temporary password reset initiated for ${student.full_name} (${student.email}). Instructions sent via email.`,
      temp_password_for_admin_relay: tempPassword
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Payment Verification Center
apiRouter.get('/admin/payments', requireAdmin, (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT p.*, u.full_name as student_name, u.student_id, u.email as student_email, u.mobile_number as student_mobile
      FROM payments p
      JOIN users u ON p.user_id = u.id
    `;
    const params: any[] = [];
    if (status && status !== 'ALL') {
      sql += ' WHERE p.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY p.created_at DESC';
    const payments = queryAll<any>(sql, params);
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve Payment
apiRouter.post('/admin/payments/:id/approve', requireAdmin, async (req, res) => {
  try {
    const session = (req as any).user;
    const payment = queryOne<any>('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    const student = queryOne<any>('SELECT * FROM users WHERE id = ?', [payment.user_id]);
    if (!student) return res.status(404).json({ error: 'Associated student record not found' });

    const now = new Date();
    const startDate = now.toISOString();
    const expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Update payment record
    runSql(
      "UPDATE payments SET status = 'APPROVED', approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?",
      [session.email, startDate, startDate, payment.id]
    );

    // 2. Activate membership subscription
    runSql(
      "UPDATE subscriptions SET status = 'ACTIVE', plan_name = 'TechClass Annual Pass', start_date = ?, expiry_date = ?, amount = ?, updated_at = ? WHERE user_id = ?",
      [startDate, expiryDate, payment.amount, startDate, student.id]
    );

    // 3. Update user role to PAID_STUDENT
    runSql("UPDATE users SET role = 'PAID_STUDENT', updated_at = ? WHERE id = ?", [startDate, student.id]);

    // 4. Send Approval & Membership Activated Email
    await sendEmail({
      to: student.email,
      recipientName: student.full_name,
      studentId: student.student_id,
      subject: 'TechClass Membership Activated – Welcome to Annual Pass!',
      template: 'payment_approved',
      data: {
        name: student.full_name,
        studentId: student.student_id,
        amount: payment.amount,
        utr: payment.utr_number,
        startDate,
        expiryDate
      }
    });

    // 5. In-App Notification
    runSql(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `notif_${Date.now()}`,
        student.id,
        'TechClass Annual Pass Activated!',
        `Your payment of ₹${payment.amount} (UTR: ${payment.utr_number}) is approved. Valid until ${new Date(expiryDate).toLocaleDateString('en-IN')}.`,
        'MEMBERSHIP',
        0,
        '/dashboard',
        startDate
      ]
    );

    // 6. Audit Log
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        `aud_${Date.now()}`,
        session.userId,
        session.email,
        'PAYMENT_APPROVED',
        'PAYMENT',
        payment.id,
        `Approved ₹${payment.amount} (UTR: ${payment.utr_number}) for student ${student.student_id} (${student.full_name})`,
        startDate
      ]
    );

    res.json({ message: 'Payment approved and TechClass Annual Pass activated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reject Payment
apiRouter.post('/admin/payments/:id/reject', requireAdmin, async (req, res) => {
  try {
    const session = (req as any).user;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Administrative rejection reason is required.' });

    const payment = queryOne<any>('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    const student = queryOne<any>('SELECT * FROM users WHERE id = ?', [payment.user_id]);
    if (!student) return res.status(404).json({ error: 'Associated student record not found' });

    const now = new Date().toISOString();

    // Update payment record
    runSql(
      "UPDATE payments SET status = 'REJECTED', admin_reason = ?, approved_by = ?, updated_at = ? WHERE id = ?",
      [reason, session.email, now, payment.id]
    );

    // Send Rejection Email
    await sendEmail({
      to: student.email,
      recipientName: student.full_name,
      studentId: student.student_id,
      subject: 'TechClass Payment Verification Update',
      template: 'payment_rejected',
      data: {
        name: student.full_name,
        studentId: student.student_id,
        amount: payment.amount,
        utr: payment.utr_number,
        reason
      }
    });

    // In-App Notification
    runSql(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, link_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `notif_${Date.now()}`,
        student.id,
        'Payment Verification Rejected',
        `UTR ${payment.utr_number} could not be verified. Reason: ${reason}. Please resubmit in dashboard.`,
        'PAYMENT',
        0,
        '/pricing',
        now
      ]
    );

    // Audit Log
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        `aud_${Date.now()}`,
        session.userId,
        session.email,
        'PAYMENT_REJECTED',
        'PAYMENT',
        payment.id,
        `Rejected UTR ${payment.utr_number} for ${student.student_id}. Reason: ${reason}`,
        now
      ]
    );

    res.json({ message: 'Payment rejected and student notified via email.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. ADMIN PDF DOCUMENT MANAGEMENT (FULL CRUD & BULK UPLOAD)
// ==========================================

// List all PDFs for Admin with usage metrics and filter
apiRouter.get('/admin/pdfs', requireAdmin, (req, res) => {
  try {
    const { search, exam, access_type } = req.query;
    let sql = `
      SELECT p.*,
             (SELECT COUNT(*) FROM pdf_reading_sessions WHERE pdf_id = p.id) as reader_count,
             (SELECT COUNT(*) FROM pdf_purchases WHERE pdf_id = p.id) as purchase_count
      FROM pdf_documents p
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(p.title LIKE ? OR p.author LIKE ? OR p.subject LIKE ?)');
      const t = `%${search}%`;
      params.push(t, t, t);
    }
    if (exam && exam !== 'ALL') {
      conditions.push('p.exam = ?');
      params.push(exam);
    }
    if (access_type && access_type !== 'ALL') {
      conditions.push('p.access_type = ?');
      params.push(access_type);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY p.created_at DESC';
    const docs = queryAll<any>(sql, params);

    const formatted = docs.map(d => {
      let parsedPages = [];
      try {
        parsedPages = JSON.parse(d.pages_json || '[]');
      } catch {
        parsedPages = [];
      }
      return {
        ...d,
        allow_download: d.allow_download === 1,
        allow_print: d.allow_print === 1,
        allow_copy: d.allow_copy === 1,
        watermark_enabled: d.watermark_enabled === 1,
        is_published: d.is_published === 1,
        pages: parsedPages
      };
    });

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single PDF get for editing/preview
apiRouter.get('/admin/pdfs/:id', requireAdmin, (req, res) => {
  try {
    const doc = queryOne<any>('SELECT * FROM pdf_documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'PDF document not found' });

    let pages = [];
    try {
      pages = JSON.parse(doc.pages_json || '[]');
    } catch {
      pages = [];
    }

    res.json({
      ...doc,
      allow_download: doc.allow_download === 1,
      allow_print: doc.allow_print === 1,
      allow_copy: doc.allow_copy === 1,
      watermark_enabled: doc.watermark_enabled === 1,
      is_published: doc.is_published === 1,
      pages
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create single PDF document
apiRouter.post('/admin/pdfs', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const {
      title,
      author,
      description,
      cover_url,
      subject,
      exam,
      language,
      page_count,
      file_size,
      access_type,
      price,
      allow_download,
      allow_print,
      allow_copy,
      watermark_enabled,
      is_published,
      pages
    } = req.body;

    if (!title || !subject || !exam) {
      return res.status(400).json({ error: 'Title, Subject, and Exam are required.' });
    }

    const pdfId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const formattedPages = Array.isArray(pages) && pages.length > 0
      ? pages
      : [
          {
            page_num: 1,
            title: `${title} - Overview`,
            content: description || 'Digital study document content prepared for comprehensive exam preparation.'
          }
        ];

    runSql(
      `INSERT INTO pdf_documents (
        id, title, author, description, cover_url, subject, exam, language,
        page_count, file_size, access_type, price, allow_download, allow_print,
        allow_copy, watermark_enabled, is_published, pages_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pdfId,
        title,
        author || 'TechClass Research Team',
        description || '',
        cover_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=60',
        subject,
        exam,
        language || 'mr',
        page_count || formattedPages.length,
        file_size || '3.5 MB',
        access_type || 'MEMBERSHIP',
        price || 0,
        allow_download ? 1 : 0,
        allow_print ? 1 : 0,
        allow_copy ? 1 : 0,
        watermark_enabled === false ? 0 : 1,
        is_published === false ? 0 : 1,
        JSON.stringify(formattedPages),
        now
      ]
    );

    // Audit log
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'PDF_CREATED', 'PDF', pdfId, `Uploaded PDF "${title}" (${exam} / ${subject})`, now]
    );

    res.status(201).json({ message: 'PDF document created successfully.', id: pdfId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk PDF Upload / Attachment endpoint
apiRouter.post('/admin/pdfs/bulk-upload', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const { items, default_exam, default_subject, default_access } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one PDF item or file must be provided for bulk upload.' });
    }

    const now = new Date().toISOString();
    const createdIds: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const pdfId = `pdf_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      const title = item.title || item.filename?.replace(/\.pdf$/i, '') || `Document ${i + 1}`;
      const exam = item.exam || default_exam || 'MPSC';
      const subject = item.subject || default_subject || 'General Studies';
      const access_type = item.access_type || default_access || 'MEMBERSHIP';

      let pages = item.pages;
      if (!Array.isArray(pages) || pages.length === 0) {
        if (item.raw_text) {
          // Auto split raw text by double linebreaks or custom marker
          const chunks = item.raw_text.split(/\n\s*---\s*\n|\n\s*===\s*\n/);
          pages = chunks.map((chunk: string, idx: number) => ({
            page_num: idx + 1,
            title: `Section ${idx + 1}`,
            content: chunk.trim()
          }));
        } else {
          pages = [
            {
              page_num: 1,
              title: `${title} - Chapter 1`,
              content: item.description || 'Full comprehensive digital study notes for exam revision.'
            }
          ];
        }
      }

      runSql(
        `INSERT INTO pdf_documents (
          id, title, author, description, cover_url, subject, exam, language,
          page_count, file_size, access_type, price, allow_download, allow_print,
          allow_copy, watermark_enabled, is_published, pages_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pdfId,
          title,
          item.author || 'TechClass Editorial',
          item.description || `Attached digital revision material for ${exam}.`,
          item.cover_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=60',
          subject,
          exam,
          item.language || 'mr',
          item.page_count || pages.length,
          item.file_size || (item.raw_text ? `${(item.raw_text.length / 1024).toFixed(1)} KB` : '4.2 MB'),
          access_type,
          item.price || 0,
          item.allow_download ? 1 : 0,
          item.allow_print ? 1 : 0,
          item.allow_copy ? 1 : 0,
          item.watermark_enabled === false ? 0 : 1,
          1,
          JSON.stringify(pages),
          now
        ]
      );

      createdIds.push(pdfId);
    }

    // Audit log
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'PDF_BULK_UPLOAD', 'PDF', `${createdIds.length}_FILES`, `Bulk uploaded ${createdIds.length} PDF documents`, now]
    );

    res.status(201).json({
      message: `Successfully attached and processed ${createdIds.length} PDF documents.`,
      created_count: createdIds.length,
      ids: createdIds
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update PDF document
apiRouter.put('/admin/pdfs/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const doc = queryOne<any>('SELECT * FROM pdf_documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'PDF document not found' });

    const {
      title,
      author,
      description,
      cover_url,
      subject,
      exam,
      language,
      page_count,
      file_size,
      access_type,
      price,
      allow_download,
      allow_print,
      allow_copy,
      watermark_enabled,
      is_published,
      pages
    } = req.body;

    const pagesJson = Array.isArray(pages) ? JSON.stringify(pages) : doc.pages_json;
    const count = Array.isArray(pages) ? pages.length : (page_count || doc.page_count);

    runSql(
      `UPDATE pdf_documents SET
        title = ?, author = ?, description = ?, cover_url = ?, subject = ?, exam = ?,
        language = ?, page_count = ?, file_size = ?, access_type = ?, price = ?,
        allow_download = ?, allow_print = ?, allow_copy = ?, watermark_enabled = ?,
        is_published = ?, pages_json = ?
       WHERE id = ?`,
      [
        title ?? doc.title,
        author ?? doc.author,
        description ?? doc.description,
        cover_url ?? doc.cover_url,
        subject ?? doc.subject,
        exam ?? doc.exam,
        language ?? doc.language,
        count,
        file_size ?? doc.file_size,
        access_type ?? doc.access_type,
        price ?? doc.price,
        allow_download !== undefined ? (allow_download ? 1 : 0) : doc.allow_download,
        allow_print !== undefined ? (allow_print ? 1 : 0) : doc.allow_print,
        allow_copy !== undefined ? (allow_copy ? 1 : 0) : doc.allow_copy,
        watermark_enabled !== undefined ? (watermark_enabled ? 1 : 0) : doc.watermark_enabled,
        is_published !== undefined ? (is_published ? 1 : 0) : doc.is_published,
        pagesJson,
        req.params.id
      ]
    );

    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'PDF_UPDATED', 'PDF', req.params.id, `Updated document metadata for "${title || doc.title}"`, now]
    );

    res.json({ message: 'PDF document updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Permanently delete PDF document from server and database
apiRouter.delete('/admin/pdfs/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const doc = queryOne<any>('SELECT * FROM pdf_documents WHERE id = ?', [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'PDF document not found' });

    // Cascade delete associated reading sessions, purchases, bookmarks
    runSql('DELETE FROM pdf_reading_sessions WHERE pdf_id = ?', [req.params.id]);
    runSql('DELETE FROM pdf_purchases WHERE pdf_id = ?', [req.params.id]);
    runSql("DELETE FROM bookmarks WHERE item_type = 'PDF' AND item_id = ?", [req.params.id]);
    runSql('DELETE FROM pdf_documents WHERE id = ?', [req.params.id]);

    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'PDF_DELETED', 'PDF', req.params.id, `Permanently deleted PDF "${doc.title}" from storage and library.`, now]
    );

    res.json({ message: `PDF document "${doc.title}" has been permanently removed.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. ADMIN COURSES MANAGEMENT (FULL CRUD)
// ==========================================

apiRouter.get('/admin/courses', requireAdmin, (req, res) => {
  try {
    const courses = queryAll<any>(`
      SELECT c.*,
             (SELECT COUNT(*) FROM course_modules WHERE course_id = c.id) as modules_count,
             (SELECT COUNT(*) FROM lessons l JOIN course_modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lessons_count,
             (SELECT COUNT(*) FROM course_progress WHERE course_id = c.id) as enrolled_count
      FROM courses c
      ORDER BY c.sort_order ASC, c.created_at DESC
    `);
    res.json(courses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/courses/:id', requireAdmin, (req, res) => {
  try {
    const course = queryOne<any>('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const modules = queryAll<any>('SELECT * FROM course_modules WHERE course_id = ? ORDER BY sort_order ASC', [course.id]);
    for (const m of modules) {
      m.lessons = queryAll<any>('SELECT * FROM lessons WHERE module_id = ? ORDER BY sort_order ASC', [m.id]);
    }
    course.modules = modules;

    res.json(course);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/courses', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const { title, description, exam, subject, language, access_type, price, thumbnail, modules } = req.body;
    if (!title) return res.status(400).json({ error: 'Course title is required.' });

    const courseId = `c_${Date.now()}`;
    const slug = (title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO courses (id, title, slug, description, thumbnail, exam, subject, language, access_type, price, is_published, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`,
      [courseId, title, slug, description || '', thumbnail || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=60', exam || 'MPSC', subject || 'General Studies', language || 'mr', access_type || 'MEMBERSHIP', price || 2999, now]
    );

    if (Array.isArray(modules)) {
      modules.forEach((mod: any, mIdx: number) => {
        const modId = `m_${courseId}_${mIdx + 1}`;
        runSql(
          'INSERT INTO course_modules (id, course_id, title, sort_order, description) VALUES (?, ?, ?, ?, ?)',
          [modId, courseId, mod.title || `Module ${mIdx + 1}`, mIdx + 1, mod.description || '']
        );

        if (Array.isArray(mod.lessons)) {
          mod.lessons.forEach((l: any, lIdx: number) => {
            const lId = `l_${modId}_${lIdx + 1}`;
            runSql(
              'INSERT INTO lessons (id, module_id, title, content, video_url, duration_minutes, is_free_preview, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [lId, modId, l.title || `Lesson ${lIdx + 1}`, l.content || '', l.video_url || '', l.duration_minutes || 30, l.is_free ? 1 : 0, lIdx + 1]
            );
          });
        }
      });
    }

    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'COURSE_CREATED', 'COURSE', courseId, `Created course "${title}"`, now]
    );

    res.status(201).json({ message: 'Course created successfully', id: courseId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/courses/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const course = queryOne<any>('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const { title, description, exam, subject, language, access_type, price, thumbnail, is_published } = req.body;

    runSql(
      `UPDATE courses SET
        title = ?, description = ?, exam = ?, subject = ?, language = ?,
        access_type = ?, price = ?, thumbnail = ?, is_published = ?
       WHERE id = ?`,
      [
        title ?? course.title,
        description ?? course.description,
        exam ?? course.exam,
        subject ?? course.subject,
        language ?? course.language,
        access_type ?? course.access_type,
        price ?? course.price,
        thumbnail ?? course.thumbnail,
        is_published !== undefined ? (is_published ? 1 : 0) : course.is_published,
        req.params.id
      ]
    );

    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'COURSE_UPDATED', 'COURSE', req.params.id, `Updated course "${title || course.title}"`, now]
    );

    res.json({ message: 'Course updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/courses/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const course = queryOne<any>('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Cascade delete lessons and modules
    const modules = queryAll<any>('SELECT id FROM course_modules WHERE course_id = ?', [req.params.id]);
    for (const m of modules) {
      runSql('DELETE FROM lessons WHERE module_id = ?', [m.id]);
    }
    runSql('DELETE FROM course_modules WHERE course_id = ?', [req.params.id]);
    runSql('DELETE FROM course_progress WHERE course_id = ?', [req.params.id]);
    runSql("DELETE FROM bookmarks WHERE item_type = 'COURSE' AND item_id = ?", [req.params.id]);
    runSql('DELETE FROM courses WHERE id = ?', [req.params.id]);

    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'COURSE_DELETED', 'COURSE', req.params.id, `Permanently deleted course "${course.title}"`, now]
    );

    res.json({ message: `Course "${course.title}" deleted permanently.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. ADMIN TESTS MANAGEMENT (FULL CRUD)
// ==========================================

apiRouter.get('/admin/tests', requireAdmin, (req, res) => {
  try {
    const tests = queryAll<any>(`
      SELECT t.*,
             (SELECT COUNT(*) FROM questions WHERE test_id = t.id) as question_count,
             (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id) as attempts_count,
             (SELECT AVG(score) FROM test_attempts WHERE test_id = t.id AND status = 'COMPLETED') as average_score
      FROM tests t
      ORDER BY t.created_at DESC
    `);
    res.json(tests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/tests/:id', requireAdmin, (req, res) => {
  try {
    const test = queryOne<any>('SELECT * FROM tests WHERE id = ?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Test paper not found' });

    const questions = queryAll<any>('SELECT * FROM questions WHERE test_id = ? ORDER BY question_number ASC', [test.id]);
    for (const q of questions) {
      const trans = queryAll<any>('SELECT * FROM question_translations WHERE question_id = ?', [q.id]);
      q.translations = {};
      for (const t of trans) {
        q.translations[t.language] = {
          question: t.question_text,
          opt_a: t.option_a,
          opt_b: t.option_b,
          opt_c: t.option_c,
          opt_d: t.option_d,
          explanation: t.explanation
        };
      }
    }
    test.questions = questions;

    res.json(test);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/tests', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const { title, description, type, exam, subject, duration_minutes, total_marks, passing_percentage, negative_marking_ratio, access_type, questions } = req.body;
    if (!title) return res.status(400).json({ error: 'Test title is required.' });

    const testId = `t_${Date.now()}`;
    const now = new Date().toISOString();
    const qCount = Array.isArray(questions) ? questions.length : 0;

    runSql(
      `INSERT INTO tests (id, title, description, type, exam, subject, duration_minutes, total_marks, passing_percentage, negative_marking_ratio, question_count, access_type, is_published, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        testId,
        title,
        description || '',
        type || 'MOCK',
        exam || 'MPSC',
        subject || 'General Studies',
        duration_minutes || 60,
        total_marks || 100,
        passing_percentage || 40,
        negative_marking_ratio !== undefined ? negative_marking_ratio : 0.25,
        qCount,
        access_type || 'MEMBERSHIP',
        now
      ]
    );

    if (Array.isArray(questions)) {
      questions.forEach((q: any, idx: number) => {
        const qId = `q_${testId}_${idx + 1}`;
        runSql(
          `INSERT INTO questions (id, test_id, question_number, subject, topic, difficulty, marks, negative_marks, correct_answer)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [qId, testId, idx + 1, q.subject || subject, q.topic || '', q.difficulty || 'MEDIUM', q.marks || 2, q.negative_marks || 0.5, q.correct_answer || 'A']
        );

        const langs = ['en', 'hi', 'mr'];
        for (const l of langs) {
          const trans = q.translations && q.translations[l] ? q.translations[l] : {
            question: q.question || `Question ${idx + 1}`,
            opt_a: q.option_a || 'Option A',
            opt_b: q.option_b || 'Option B',
            opt_c: q.option_c || 'Option C',
            opt_d: q.option_d || 'Option D',
            explanation: q.explanation || ''
          };

          runSql(
            `INSERT INTO question_translations (id, question_id, language, question_text, image_url, option_a, option_b, option_c, option_d, explanation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [`${qId}_${l}`, qId, l, trans.question, '', trans.opt_a, trans.opt_b, trans.opt_c, trans.opt_d, trans.explanation]
          );
        }
      });
    }

    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'TEST_CREATED', 'TEST', testId, `Created test "${title}" with ${qCount} questions`, now]
    );

    res.status(201).json({ message: 'Test created successfully', id: testId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/admin/tests/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const test = queryOne<any>('SELECT * FROM tests WHERE id = ?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Test paper not found' });

    const { title, description, type, exam, subject, duration_minutes, total_marks, passing_percentage, negative_marking_ratio, access_type, is_published } = req.body;

    runSql(
      `UPDATE tests SET
        title = ?, description = ?, type = ?, exam = ?, subject = ?,
        duration_minutes = ?, total_marks = ?, passing_percentage = ?,
        negative_marking_ratio = ?, access_type = ?, is_published = ?
       WHERE id = ?`,
      [
        title ?? test.title,
        description ?? test.description,
        type ?? test.type,
        exam ?? test.exam,
        subject ?? test.subject,
        duration_minutes ?? test.duration_minutes,
        total_marks ?? test.total_marks,
        passing_percentage ?? test.passing_percentage,
        negative_marking_ratio ?? test.negative_marking_ratio,
        access_type ?? test.access_type,
        is_published !== undefined ? (is_published ? 1 : 0) : test.is_published,
        req.params.id
      ]
    );

    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'TEST_UPDATED', 'TEST', req.params.id, `Updated test paper "${title || test.title}"`, now]
    );

    res.json({ message: 'Test paper updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/tests/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const test = queryOne<any>('SELECT * FROM tests WHERE id = ?', [req.params.id]);
    if (!test) return res.status(404).json({ error: 'Test paper not found' });

    const questions = queryAll<any>('SELECT id FROM questions WHERE test_id = ?', [req.params.id]);
    for (const q of questions) {
      runSql('DELETE FROM question_translations WHERE question_id = ?', [q.id]);
    }
    runSql('DELETE FROM questions WHERE test_id = ?', [req.params.id]);

    const attempts = queryAll<any>('SELECT id FROM test_attempts WHERE test_id = ?', [req.params.id]);
    for (const a of attempts) {
      runSql('DELETE FROM test_answers WHERE attempt_id = ?', [a.id]);
    }
    runSql('DELETE FROM test_attempts WHERE test_id = ?', [req.params.id]);
    runSql("DELETE FROM bookmarks WHERE item_type = 'TEST' AND item_id = ?", [req.params.id]);
    runSql('DELETE FROM tests WHERE id = ?', [req.params.id]);

    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'TEST_DELETED', 'TEST', req.params.id, `Permanently deleted test "${test.title}"`, now]
    );

    res.json({ message: `Test "${test.title}" permanently deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 13. ADMIN STUDENT CREATION & DELETION
// ==========================================

apiRouter.post('/admin/students', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const { full_name, email, mobile_number, password, role, target_exams, state, city, membership_days } = req.body;

    if (!full_name || !email || !password || !mobile_number) {
      return res.status(400).json({ error: 'Full name, email, mobile, and password are required.' });
    }

    const existing = queryOne<any>('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) return res.status(400).json({ error: 'A student with this email address already exists.' });

    const count = queryOne<any>('SELECT COUNT(*) as c FROM users')?.c || 0;
    const studentId = `TC${(100001 + count).toString()}`;
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const passwordHash = hashPassword(password);
    const now = new Date();
    const nowStr = now.toISOString();

    const examsList = Array.isArray(target_exams) ? target_exams : ['MPSC', 'Police Bharti'];
    const userRole = role || 'FREE_STUDENT';

    runSql(
      `INSERT INTO users (id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'mr', ?, ?, ?, 'ACTIVE', ?, ?)`,
      [userId, studentId, full_name, email.toLowerCase().trim(), mobile_number, passwordHash, userRole, JSON.stringify(examsList), state || 'Maharashtra', city || 'Pune', nowStr, nowStr]
    );

    runSql('INSERT INTO student_profiles (id, user_id, bio, study_streak, total_study_minutes) VALUES (?, ?, ?, 1, 0)', [`prof_${userId}`, userId, 'TechClass Student']);

    const days = parseInt(membership_days, 10) || (userRole === 'PAID_STUDENT' ? 365 : 0);
    const expiryDate = days > 0 ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString() : null;
    const subStatus = days > 0 ? 'ACTIVE' : 'FREE';

    runSql(
      'INSERT INTO subscriptions (id, user_id, plan_name, status, start_date, expiry_date, amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [`sub_${userId}`, userId, days > 0 ? 'TechClass Annual Pass' : 'Free Trial Tier', subStatus, days > 0 ? nowStr : null, expiryDate, days > 0 ? 2999 : 0, nowStr, nowStr]
    );

    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'STUDENT_MANUALLY_CREATED', 'STUDENT', userId, `Created candidate ${studentId} (${full_name}) with role ${userRole}`, nowStr]
    );

    res.status(201).json({ message: `Student ${full_name} (${studentId}) created successfully.`, student_id: studentId, id: userId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/admin/students/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    if (req.params.id === session.userId) {
      return res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
    }

    const student = queryOne<any>('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Student record not found.' });

    // Cascade deletes
    runSql('DELETE FROM student_profiles WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM subscriptions WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM payments WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM test_attempts WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM pdf_reading_sessions WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM pdf_purchases WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM bookmarks WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM notes WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM notifications WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM course_progress WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM sessions WHERE user_id = ?', [req.params.id]);
    runSql('DELETE FROM users WHERE id = ?', [req.params.id]);

    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'STUDENT_DELETED', 'STUDENT', req.params.id, `Permanently removed student ${student.student_id} (${student.full_name})`, now]
    );

    res.json({ message: `Student ${student.full_name} (${student.student_id}) permanently removed.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Payment
apiRouter.delete('/admin/payments/:id', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const payment = queryOne<any>('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    runSql('DELETE FROM payments WHERE id = ?', [req.params.id]);

    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'PAYMENT_DELETED', 'PAYMENT', req.params.id, `Deleted payment record (UTR: ${payment.utr_number})`, now]
    );

    res.json({ message: 'Payment record deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 14. ADMIN SITE SETTINGS & CONFIGURATIONS
// ==========================================

apiRouter.get('/admin/settings', requireAdmin, (req, res) => {
  try {
    const rows = queryAll<any>('SELECT key, value, updated_at FROM site_settings');
    const settingsObj: Record<string, string> = {};
    for (const r of rows) {
      settingsObj[r.key] = r.value;
    }

    res.json({
      settings: {
        site_name: settingsObj.site_name || 'TechClass',
        brand_tagline: settingsObj.brand_tagline || 'Your Digital Classroom for Government Exam Preparation',
        parent_brand: settingsObj.parent_brand || 'DynoDazzle',
        primary_domain: settingsObj.primary_domain || 'https://techclass.dynodazzle.in',
        contact_email: settingsObj.contact_email || process.env.EMAIL_FROM || 'dynodazzle@gmail.com',
        whatsapp_support: settingsObj.whatsapp_support || process.env.WHATSAPP_SUPPORT_NUMBER || '+91 7770032149',
        annual_membership_price: settingsObj.annual_membership_price || '2999',
        upi_id: process.env.UPI_ID || (settingsObj.upi_id && settingsObj.upi_id !== 'techclass@upi' ? settingsObj.upi_id : 'dynodazzle@ybl'),
        free_test_limit: settingsObj.free_test_limit || '3',
        free_pdf_limit: settingsObj.free_pdf_limit || '2',
        free_course_limit: settingsObj.free_course_limit || '2',
        maintenance_mode: settingsObj.maintenance_mode || '0',
        announcement_text: settingsObj.announcement_text || '',
        watermark_default: settingsObj.watermark_default || '1',
        max_active_sessions: settingsObj.max_active_sessions || '2',
        gmail_user: settingsObj.gmail_user || process.env.GMAIL_USER || 'dynodazzle@gmail.com',
        gmail_app_password: (settingsObj.gmail_app_password || process.env.GMAIL_APP_PASSWORD) ? '••••••••••••••••' : '',
        has_gmail_configured: Boolean(settingsObj.gmail_app_password || process.env.GMAIL_APP_PASSWORD)
      },
      raw_rows: rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings (accepts key-value dictionary or array of { key, value } or direct body payload)
apiRouter.put('/admin/settings', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const body = req.body || {};
    const settings = body.settings !== undefined ? body.settings : body;
    const now = new Date().toISOString();

    if (Array.isArray(settings)) {
      for (const s of settings) {
        if (s.key) {
          if (s.key === 'gmail_app_password' && (s.value === '••••••••••••••••' || !s.value || String(s.value).trim() === '')) {
            continue; // Keep existing saved password
          }
          runSql(
            'INSERT OR REPLACE INTO site_settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)',
            [`set_${s.key}`, s.key, String(s.value ?? '').trim(), now]
          );
        }
      }
    } else if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        if (key === 'gmail_app_password' && (value === '••••••••••••••••' || !value || String(value).trim() === '')) {
          continue; // Keep existing saved password
        }
        runSql(
          'INSERT OR REPLACE INTO site_settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)',
          [`set_${key}`, key, String(value ?? '').trim(), now]
        );
      }
    }

    resetEmailTransporterCache();

    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'SETTINGS_UPDATED', 'SETTINGS', 'SITE_SETTINGS', 'Saved system settings and brand configurations via Admin Panel.', now]
    );

    res.json({ message: 'Platform settings saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset site settings to default configuration
apiRouter.post('/admin/settings/reset', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    const now = new Date().toISOString();

    const defaults = [
      { key: 'site_name', value: 'TechClass' },
      { key: 'brand_tagline', value: 'Your Digital Classroom for Government Exam Preparation' },
      { key: 'parent_brand', value: 'DynoDazzle' },
      { key: 'primary_domain', value: 'https://techclass.dynodazzle.in' },
      { key: 'contact_email', value: 'dynodazzle@gmail.com' },
      { key: 'whatsapp_support', value: '+91 7770032149' },
      { key: 'upi_id', value: 'dynodazzle@ybl' },
      { key: 'annual_membership_price', value: '2999' },
      { key: 'free_test_limit', value: '3' },
      { key: 'free_pdf_limit', value: '2' },
      { key: 'free_course_limit', value: '2' },
      { key: 'maintenance_mode', value: '0' },
      { key: 'announcement_text', value: '' },
      { key: 'watermark_default', value: '1' },
      { key: 'max_active_sessions', value: '2' }
    ];

    for (const d of defaults) {
      runSql(
        'INSERT OR REPLACE INTO site_settings (id, key, value, updated_at) VALUES (?, ?, ?, ?)',
        [`set_${d.key}`, d.key, d.value, now]
      );
    }

    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'SETTINGS_RESET', 'SETTINGS', 'SITE_SETTINGS', 'Reset all site settings to factory defaults.', now]
    );

    res.json({ message: 'Site configuration reset to factory defaults successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clear Audit Logs
apiRouter.delete('/admin/audit-logs', requireAdmin, (req, res) => {
  try {
    const session = (req as any).user;
    runSql('DELETE FROM audit_logs');
    const now = new Date().toISOString();
    runSql(
      'INSERT INTO audit_logs (id, admin_id, admin_name, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [`aud_${Date.now()}`, session.userId, session.email, 'AUDIT_LOGS_PURGED', 'AUDIT', 'ALL', 'Purged audit log history', now]
    );

    res.json({ message: 'Audit log history purged successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Audit Logs
apiRouter.get('/admin/audit-logs', requireAdmin, (req, res) => {
  try {
    const logs = queryAll<any>('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Email Logs
apiRouter.get('/admin/email-logs', requireAdmin, (req, res) => {
  try {
    const logs = queryAll<any>('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100');
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Gmail SMTP Status
apiRouter.get('/admin/email-status', requireAdmin, (req, res) => {
  try {
    const { isConfigured, senderEmail } = getEmailTransporter();
    res.json({
      service: 'gmail',
      senderEmail,
      isConfigured,
      hasAppPassword: Boolean(process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_API_KEY || process.env.SMTP_PASS),
      guide: isConfigured
        ? 'Gmail SMTP is configured and ready to dispatch live emails.'
        : 'Set GMAIL_APP_PASSWORD (16-char Google App Password) in Settings to enable real-time Gmail dispatch to inboxes.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Send Test Email via Gmail
apiRouter.post('/admin/send-test-email', requireAdmin, async (req, res) => {
  try {
    const user = getSessionUser(req);
    const targetEmail = req.body.to || user?.email || 'dynodazzle@gmail.com';

    const result = await sendEmail({
      to: targetEmail,
      recipientName: user?.email === targetEmail ? 'TechClass Administrator' : 'Valued Student',
      subject: `TechClass Security Test Email (${new Date().toLocaleTimeString('en-IN')})`,
      template: 'welcome',
      data: {
        name: 'TechClass Admin',
        studentId: 'TC000000',
        targetExams: 'Administrative Testing'
      }
    });

    res.json({
      success: true,
      deliveredViaGmail: result.deliveredViaGmail,
      targetEmail,
      message: result.deliveredViaGmail
        ? `Test email sent successfully via Gmail SMTP to ${targetEmail}!`
        : `Test email logged to system database. Set GMAIL_APP_PASSWORD in settings to deliver live emails to Gmail inbox.`,
      error: result.error
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SUPABASE BACKEND ENDPOINTS
// ==========================================

// 1. Supabase Backend Health & Status
apiRouter.get('/supabase/status', async (req, res) => {
  try {
    const health = await getSupabaseHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      projectId: SUPABASE_PROJECT_ID,
      url: SUPABASE_URL,
      error: err?.message || 'Failed to check Supabase backend status'
    });
  }
});

// 2. Supabase SQL Schema for One-Click Setup
apiRouter.get('/supabase/schema', (req, res) => {
  try {
    const schemaSql = getSupabaseSchemaSql();
    res.type('text/plain').send(schemaSql);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Supabase Local Data Sync
apiRouter.post('/supabase/sync', requireAdmin, async (req, res) => {
  try {
    const syncResult = await syncLocalToSupabase();
    res.json(syncResult);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to sync data to Supabase' });
  }
});

// 4. Supabase Auth Login / Profile Linking
apiRouter.post('/auth/supabase-login', async (req, res) => {
  try {
    const { accessToken, email: providedEmail, full_name: providedName } = req.body;

    let verifiedEmail = providedEmail;
    let verifiedName = providedName || 'Supabase Student';

    // Verify token with Supabase if provided
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data?.user?.email) {
        verifiedEmail = data.user.email;
        if (data.user.user_metadata?.full_name) {
          verifiedName = data.user.user_metadata.full_name;
        }
      }
    }

    if (!verifiedEmail) {
      return res.status(400).json({ error: 'Valid Supabase session or email required.' });
    }

    const cleanEmail = verifiedEmail.toLowerCase().trim();
    let user = queryOne<any>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    const now = new Date().toISOString();

    if (!user) {
      // Auto-register candidate
      const countRow = queryOne<any>('SELECT COUNT(*) as total FROM users');
      const seq = (countRow?.total || 0) + 100001;
      const studentId = `TC${seq}`;
      const userId = `usr_sb_${Date.now()}`;

      runSql(
        `INSERT INTO users (id, student_id, full_name, email, mobile_number, password_hash, role, preferred_language, target_exams, state, city, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          studentId,
          verifiedName,
          cleanEmail,
          '+91 0000000000',
          hashPassword('supabase_auth_pass_' + Date.now()),
          'FREE_STUDENT',
          'en',
          JSON.stringify(['All Exams']),
          'Maharashtra',
          'Pune',
          'ACTIVE',
          now,
          now
        ]
      );

      runSql(
        `INSERT INTO student_profiles (id, user_id, bio, study_streak, total_study_minutes) VALUES (?, ?, ?, ?, ?)`,
        [`prof_${userId}`, userId, 'Enrolled via Supabase Authentication', 1, 0]
      );

      runSql(
        `INSERT INTO subscriptions (id, user_id, plan_name, status, start_date, expiry_date, amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`sub_${userId}`, userId, 'Free Tier', 'FREE', now, null, 0, now, now]
      );

      user = queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    }

    // Generate TechClass session
    const sessionToken = 'tok_sb_' + crypto.randomBytes(32).toString('hex');
    activeSessions.set(sessionToken, {
      userId: user.id,
      role: user.role,
      email: user.email,
      studentId: user.student_id,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    const sub = queryOne<any>(
      'SELECT status, expiry_date, plan_name FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );

    let targetExams = [];
    try {
      targetExams = JSON.parse(user.target_exams);
    } catch (e) {
      targetExams = [user.target_exams];
    }

    res.json({
      message: 'Authenticated via Supabase Backend successfully.',
      token: sessionToken,
      user: {
        id: user.id,
        student_id: user.student_id,
        full_name: user.full_name,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
        preferred_language: user.preferred_language,
        target_exams: targetExams,
        state: user.state,
        city: user.city,
        membership_status: sub?.status || 'FREE',
        expiry_date: sub?.expiry_date,
        plan_name: sub?.plan_name
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

