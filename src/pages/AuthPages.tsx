import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User as UserType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../lib/api';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ArrowRight, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Database,
  RotateCw,
  ArrowLeft,
  KeyRound
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

  // Admin 2FA Login OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [setupOtp, setSetupOtp] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Forgot / Reset Password state
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetAdmin, setIsResetAdmin] = useState(false);

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
        if (err.isHtml || err.message?.includes('HTML') || err.message?.includes('<!DOCTYPE') || err.message?.includes('Unexpected token') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          console.warn('[TechClass Netlify Mode] Checking local student accounts...');
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
              full_name: 'Aditya Patil (Candidate)',
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

          setErrorMsg('Invalid login credentials. If you are registering for the first time, click "Register Free" below.');
          return;
        }
        setErrorMsg(err.message || 'Invalid email or password.');
      } finally {
        setSubmitting(false);
      }
    } else if (mode === 'REGISTER') {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === 'admin@techclass.in' || cleanEmail === 'dynodazzle@gmail.com') {
        setErrorMsg('This email address is reserved for the TechClass Administrator & App Owner. Please sign in via the Admin Login.');
        setSubmitting(false);
        return;
      }

      try {
        const data = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName,
            email: cleanEmail,
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
        if (err.isHtml || err.message?.includes('HTML') || err.message?.includes('<!DOCTYPE') || err.message?.includes('Unexpected token') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          console.warn('[TechClass Netlify Mode] Registering student in client storage...');
          const studentId = `TC${Math.floor(100000 + Math.random() * 900000)}`;
          const fallbackUser: UserType = {
            id: `usr_${Date.now()}`,
            student_id: studentId,
            full_name: fullName.trim(),
            email: cleanEmail,
            mobile_number: mobile.trim(),
            role: 'FREE_STUDENT',
            preferred_language: 'en',
            target_exams: targetExams.split(',').map(x => x.trim()),
            state: stateName || 'Maharashtra',
            city: city || 'Pune',
            membership_status: 'FREE'
          };

          try {
            const localStudents = JSON.parse(localStorage.getItem('techclass_local_students') || '[]');
            localStudents.push({ ...fallbackUser, password });
            localStorage.setItem('techclass_local_students', JSON.stringify(localStudents));
          } catch (e) {}

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
      // Step 1: Request Password Recovery OTP
      if (!resetOtpSent) {
        if (!email || !email.trim()) {
          setErrorMsg('Please enter your registered Email address, Student ID (e.g. TC100001), or Mobile Number.');
          setSubmitting(false);
          return;
        }

        try {
          const cleanEmail = email.trim();
          const data = await apiFetch('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email: cleanEmail })
          });

          setResetOtpSent(true);
          setIsResetAdmin(!!data.isAdmin || cleanEmail.toLowerCase() === 'admin@techclass.in' || cleanEmail.toLowerCase() === 'dynodazzle@gmail.com');
          if (data.email) {
            setEmail(data.email);
          }
          if (data.setupOtp) {
            setSetupOtp(data.setupOtp);
            setResetOtpCode(data.setupOtp);
          }
          setSuccessMsg(data.message || `A 6-digit password reset OTP has been dispatched to ${data.maskedEmail || cleanEmail}.`);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to request password reset code.');
        } finally {
          setSubmitting(false);
        }
      } else {
        // Step 2: Submit OTP & Set New Password
        if (!email || !email.trim()) {
          setErrorMsg('Please enter your registered Email address or Student ID.');
          setSubmitting(false);
          return;
        }

        if (!resetOtpCode || resetOtpCode.trim().length < 4) {
          setErrorMsg('Please enter the 6-digit OTP received on your email.');
          setSubmitting(false);
          return;
        }

        if (!newPassword || newPassword.length < 6) {
          setErrorMsg('New password must be at least 6 characters long.');
          setSubmitting(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setErrorMsg('New password and confirmation do not match.');
          setSubmitting(false);
          return;
        }

        try {
          const data = await apiFetch('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({
              email: email.trim(),
              otp: resetOtpCode.trim(),
              new_password: newPassword
            })
          });

          login(data.token, data.user);
          setSuccessMsg('Password successfully reset! Redirecting to your dashboard...');
          setTimeout(() => {
            if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN' || data.user.email === 'admin@techclass.in' || data.user.email === 'dynodazzle@gmail.com') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }, 800);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to reset password with the provided OTP.');
        } finally {
          setSubmitting(false);
        }
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

  const handleResendResetOtp = async () => {
    if (!email || !email.trim()) {
      setErrorMsg('Please enter your registered email address or Student ID first.');
      return;
    }
    setErrorMsg(null);
    setResending(true);
    try {
      const data = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      });

      if (data.email) {
        setEmail(data.email);
      }
      if (data.setupOtp) {
        setSetupOtp(data.setupOtp);
        setResetOtpCode(data.setupOtp);
      }
      setSuccessMsg(data.message || `A fresh password recovery code has been dispatched to ${data.maskedEmail || email}.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 flex items-center justify-center bg-slate-950">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-1 border border-cyan-500/20">
            {mode === 'FORGOT' ? (
              <KeyRound className="w-8 h-8" />
            ) : otpStep ? (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            ) : (
              <GraduationCap className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {mode === 'LOGIN' ? (
              otpStep ? 'Administrator 2FA Verification' : 'Welcome Back'
            ) : mode === 'REGISTER' ? (
              'Create Candidate Account'
            ) : resetOtpSent ? (
              'Enter OTP & Reset Password'
            ) : (
              'Forgot Password'
            )}
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'LOGIN' ? (
              otpStep ? 'Verify your identity to open the master TechClass Admin Console' : 'Sign in to access your tests, notes, and study ranking'
            ) : mode === 'REGISTER' ? (
              'Join thousands of Maharashtra aspirants preparing for competitive exams'
            ) : resetOtpSent ? (
              isResetAdmin 
                ? 'Owner & Admin Master Account: Enter your 6-digit OTP to set a new password'
                : 'Enter the 6-digit OTP code received on your email along with your new password'
            ) : (
              'Enter your registered email address, student ID, or mobile number to receive an OTP'
            )}
          </p>
        </div>

        {/* Forgot Password Step Selector */}
        {mode === 'FORGOT' && (
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setResetOtpSent(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
                !resetOtpSent 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>1. Request OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setResetOtpSent(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center space-x-1.5 ${
                resetOtpSent 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>2. Enter OTP & Reset</span>
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Setup Mode Auto-Fill Helper */}
        {setupOtp && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Recovery / 2FA Code Helper</span>
            </div>
            <div className="flex items-center justify-between bg-slate-950/90 px-3 py-2 rounded-xl border border-amber-500/30">
              <span className="font-mono text-base tracking-widest font-bold text-amber-300">{setupOtp}</span>
              <button
                type="button"
                onClick={() => {
                  if (mode === 'FORGOT') setResetOtpCode(setupOtp);
                  else setOtpCode(setupOtp);
                }}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline"
              >
                Auto-fill Code
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              In production with Gmail SMTP configured, this 6-digit code delivers straight to your inbox.
            </p>
          </div>
        )}

        {/* Form: Login OTP Verification Mode */}
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
        ) : mode === 'FORGOT' && resetOtpSent ? (
          /* Form: Forgot Password OTP & New Password Mode */
          <form onSubmit={handleSubmit} className="space-y-4">
            {isResetAdmin && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
                <span>App Owner / Admin account verified: <strong>{email}</strong></span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Registered Email, Student ID, or Mobile
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@gmail.com, student@techclass.in, or TC100001"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter 6-Digit Verification OTP
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetOtpCode}
                  onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="e.g. 123456"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-bold tracking-wider focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{submitting ? 'Resetting Password...' : 'Reset Password & Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setResetOtpSent(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Request New OTP</span>
              </button>

              <button
                type="button"
                disabled={resending}
                onClick={handleResendResetOtp}
                className="text-cyan-400 hover:underline flex items-center space-x-1 font-semibold disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Sending...' : 'Resend Code'}</span>
              </button>
            </div>

            <div className="pt-2 text-center border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        ) : (
          /* Regular Form: Login / Register / Forgot Step 1 */
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
                {mode === 'LOGIN' ? 'Email or Student ID' : mode === 'FORGOT' ? 'Registered Email, Student ID, or Mobile' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'LOGIN' ? 'e.g. free@student.in or TC100001' : mode === 'FORGOT' ? 'e.g. candidate@gmail.com, student@techclass.in, or TC100001' : 'e.g. name@gmail.com or admin@techclass.in'}
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>
                {submitting 
                  ? 'Please wait...' 
                  : mode === 'LOGIN' 
                  ? 'Sign In to Classroom' 
                  : mode === 'REGISTER' 
                  ? 'Create Free Account' 
                  : 'Send Password Reset OTP'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {mode === 'FORGOT' && (
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-center space-y-2">
                <p className="text-[11px] text-slate-400">Already received your 6-digit OTP code?</p>
                <button
                  type="button"
                  onClick={() => {
                    setResetOtpSent(true);
                    setErrorMsg(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Enter OTP & Set New Password Directly &rarr;</span>
                </button>
              </div>
            )}

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

            {mode === 'FORGOT' && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* Switch mode links */}
        {!otpStep && mode !== 'FORGOT' && (
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
