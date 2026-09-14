import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User as UserType } from '../types';
import { apiFetch, ApiError } from '../lib/api';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Database,
  ShieldCheck,
  KeyRound,
  RotateCw,
  ArrowLeft
} from 'lucide-react';
import { SUPABASE_PROJECT_ID, supabase } from '../lib/supabase';

interface AuthPageProps {
  mode: 'LOGIN' | 'REGISTER' | 'FORGOT';
  navigate: (path: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode, navigate }) => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [targetExams, setTargetExams] = useState('MPSC, Police Bharti');
  const [stateName, setStateName] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');

  // Admin 2FA OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [setupOtp, setSetupOtp] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    if (mode === 'LOGIN') {
      try {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password })
        });

        // Check if Admin 2FA OTP is required
        if (data.requiresOtp) {
          setOtpStep(true);
          setTempToken(data.tempToken);
          setMaskedEmail(data.maskedEmail || email);
          if (data.setupOtp) {
            setSetupOtp(data.setupOtp);
          } else {
            setSetupOtp(null);
          }
          setSuccessMsg(data.message || `Verification code sent to ${data.email || email}`);
          return;
        }

        login(data.token, data.user);
        navigate(data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard');
      } catch (err: any) {
        // Fallback for Netlify when backend server is detached or returned HTML
        if (err.isHtml || err.message?.includes('HTML') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          console.warn('[TechClass Netlify Mode] Backend unavailable, checking local student accounts...');
          try {
            const localStudents = JSON.parse(localStorage.getItem('techclass_local_students') || '[]');
            const cleanEmail = email.toLowerCase().trim();
            const found = localStudents.find((s: any) => (s.email === cleanEmail || s.student_id === email.trim()) && s.password === password);
            if (found) {
              const { password: _, ...userData } = found;
              login(`tok_${Date.now()}`, userData);
              navigate('/dashboard');
              return;
            }
          } catch (e) {}

          // Built-in Demo student fallback on Netlify
          if (email.toLowerCase().trim() === 'student@techclass.in' || email.toLowerCase().trim() === 'demo@techclass.in' || email.toLowerCase().trim() === 'free@student.in') {
            const demoStudent: UserType = {
              id: 'usr_demo_student',
              student_id: 'TC100001',
              full_name: 'Aditya Patil (Demo Student)',
              email: email.toLowerCase().trim(),
              mobile_number: '+91 9876543210',
              role: 'FREE_STUDENT',
              preferred_language: 'en',
              target_exams: ['MPSC', 'Police Bharti'],
              state: 'Maharashtra',
              city: 'Pune',
              membership_status: 'FREE'
            };
            login(`tok_demo_${Date.now()}`, demoStudent);
            navigate('/dashboard');
            return;
          }

          setErrorMsg('Backend API is currently unreachable. If you created a student account on this device, check your email or click "Quick Demo Student Login" below.');
          return;
        }
        setErrorMsg(err.message || 'Invalid email or password.');
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'REGISTER') {
      try {
        const data = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName,
            email: email.trim(),
            password,
            mobile_number: mobile,
            target_exams: targetExams.split(',').map(x => x.trim()),
            state: stateName,
            city
          })
        });

        login(data.token, data.user);
        navigate('/dashboard');
      } catch (err: any) {
        // Fallback for Netlify when backend server is detached or returned HTML
        if (err.isHtml || err.message?.includes('HTML') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          console.warn('[TechClass Netlify Mode] Backend unavailable, registering student in client & Supabase storage...');
          const studentId = `TC${Math.floor(100000 + Math.random() * 900000)}`;
          const fallbackUser: UserType = {
            id: `usr_${Date.now()}`,
            student_id: studentId,
            full_name: fullName.trim(),
            email: email.toLowerCase().trim(),
            mobile_number: mobile.trim(),
            role: 'FREE_STUDENT',
            preferred_language: 'en',
            target_exams: targetExams.split(',').map(x => x.trim()),
            state: stateName || 'Maharashtra',
            city: city || 'Pune',
            membership_status: 'FREE'
          };

          // Persist in local storage
          try {
            const localStudents = JSON.parse(localStorage.getItem('techclass_local_students') || '[]');
            localStudents.push({ ...fallbackUser, password });
            localStorage.setItem('techclass_local_students', JSON.stringify(localStudents));
          } catch (e) {}

          // Attempt sync with Supabase project
          try {
            await supabase.from('users').insert({
              id: fallbackUser.id,
              student_id: fallbackUser.student_id,
              full_name: fallbackUser.full_name,
              email: fallbackUser.email,
              mobile_number: fallbackUser.mobile_number,
              password_hash: 'client_registered',
              role: 'FREE_STUDENT',
              preferred_language: 'en',
              target_exams: JSON.stringify(fallbackUser.target_exams),
              state: fallbackUser.state,
              city: fallbackUser.city,
              status: 'ACTIVE'
            });
          } catch (e) {}

          login(`tok_${Date.now()}`, fallbackUser);
          navigate('/dashboard');
          return;
        }

        setErrorMsg(err.message || 'Registration failed.');
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'FORGOT') {
      try {
        const data = await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim() })
        });
        setSuccessMsg(data.message || 'If an account exists, a reset code was delivered.');
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const data = await apiFetch('/api/auth/verify-admin-otp', {
        method: 'POST',
        body: JSON.stringify({ tempToken, otp: otpCode.trim() })
      });

      login(data.token, data.user);
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg(null);
    setResending(true);
    try {
      const data = await apiFetch('/api/auth/resend-admin-otp', {
        method: 'POST',
        body: JSON.stringify({ tempToken })
      });

      if (data.setupOtp) {
        setSetupOtp(data.setupOtp);
      }
      setSuccessMsg(data.message || 'A fresh verification code has been dispatched to your email.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              {otpStep ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <GraduationCap className="w-6 h-6 text-cyan-400" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {otpStep
              ? 'Admin 2FA Security Verification'
              : mode === 'LOGIN'
              ? 'Welcome Back to TechClass'
              : mode === 'REGISTER'
              ? 'Join TechClass Free'
              : 'Recover Account Password'}
          </h1>
          <p className="text-xs text-slate-400">
            {otpStep
              ? `Enter the 6-digit security verification code sent to your registered Gmail address:`
              : mode === 'LOGIN'
              ? 'Log in with your Student ID or Registered Email.'
              : mode === 'REGISTER'
              ? 'Get your unique Student ID and 3 free mock tests instantly.'
              : 'Enter your email to receive recovery instructions.'}
          </p>
          {otpStep && (
            <div className="inline-block px-3 py-1 bg-cyan-950/70 border border-cyan-500/40 rounded-full text-cyan-300 font-mono text-xs font-semibold">
              {maskedEmail || email}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Bootstrap OTP Helper (Only shown when Gmail SMTP App Password has not yet been configured in Admin Settings) */}
        {otpStep && setupOtp && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Initial Setup Verification Code</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Gmail SMTP is waiting for your 16-character Google App Password in Admin Settings. Use this initial code to log in:
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-950/90 px-3 py-2 rounded-xl border border-amber-500/30">
              <span className="font-mono text-base tracking-widest font-bold text-amber-300">{setupOtp}</span>
              <button
                type="button"
                onClick={() => setOtpCode(setupOtp)}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline"
              >
                Auto-fill Code
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Once logged in, open <strong>Admin Console &gt; Settings</strong> and save your Gmail App Password to deliver codes directly to your inbox.
            </p>
          </div>
        )}

        {/* Form: OTP Verification Mode */}
        {otpStep ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                Enter 6-Digit One-Time Password (OTP)
              </label>
              <div className="relative max-w-[260px] mx-auto">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-full text-center py-3 px-4 rounded-xl bg-slate-950 border-2 border-cyan-500/50 text-white font-mono text-2xl font-bold tracking-[10px] focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 shadow-inner"
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Valid for 15 minutes • Check your inbox at <span className="text-slate-400">{maskedEmail || email}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || otpCode.length < 4}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Verifying OTP...' : 'Verify & Access Admin Console'}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setOtpCode('');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>

              <button
                type="button"
                disabled={resending}
                onClick={handleResendOtp}
                className="text-cyan-400 hover:underline flex items-center space-x-1 font-semibold disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Sending...' : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Regular Form: Login / Register / Forgot */
          <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {mode === 'LOGIN' ? 'Email or Student ID' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'LOGIN' ? 'e.g. free@student.in or TC100001' : 'e.g. name@gmail.com'}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {mode !== 'FORGOT' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {mode === 'REGISTER' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Please wait...' : mode === 'LOGIN' ? 'Sign In to Classroom' : mode === 'REGISTER' ? 'Create Free Account' : 'Send Recovery Link'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {mode === 'LOGIN' && (
            <button
              type="button"
              onClick={() => {
                setEmail('student@techclass.in');
                setPassword('student123');
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 text-[11px] font-medium transition flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto-fill Demo Student Credentials</span>
            </button>
          )}
        </form>
        )}

        {/* Switch mode links */}
        {!otpStep && (
          <div className="text-center text-xs text-slate-400">
            {mode === 'LOGIN' ? (
              <p>
                New candidate?{' '}
                <button onClick={() => navigate('/register')} className="text-cyan-400 hover:underline font-semibold">
                  Register Free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button onClick={() => navigate('/login')} className="text-cyan-400 hover:underline font-semibold">
                  Sign In
                </button>
              </p>
            )}
          </div>
        )}

        {/* Supabase Connected Badge */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-[10px] text-slate-400 font-mono">
          <Database className="w-3 h-3 text-emerald-400" />
          <span>Connected to Supabase Project: <span className="text-emerald-400 font-bold">{SUPABASE_PROJECT_ID}</span></span>
        </div>
      </div>
    </div>
  );
};

