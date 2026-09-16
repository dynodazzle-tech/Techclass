import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CreditCard,
  BookOpen,
  FileCheck2,
  FileText,
  Mail,
  Settings,
  ArrowRight,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Lock,
  ExternalLink,
  Database,
  Cloud
} from 'lucide-react';
import { PdfManagementTab } from '../components/admin/PdfManagementTab';
import { CourseManagementTab } from '../components/admin/CourseManagementTab';
import { TestManagementTab } from '../components/admin/TestManagementTab';
import { StudentManagementTab } from '../components/admin/StudentManagementTab';
import { PaymentManagementTab } from '../components/admin/PaymentManagementTab';
import { SettingsManagementTab } from '../components/admin/SettingsManagementTab';
import { LogsManagementTab } from '../components/admin/LogsManagementTab';
import { SupabaseManagementTab } from '../components/admin/SupabaseManagementTab';

interface AdminPageProps {
  navigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const { user, token, updateUserData } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'METRICS' | 'SUPABASE' | 'PDFS' | 'COURSES' | 'TESTS' | 'STUDENTS' | 'PAYMENTS' | 'SETTINGS' | 'LOGS'
  >('METRICS');

  const [stats, setStats] = useState<any>(null);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  // Global notification banner for actions
  const [actionNotification, setActionNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  const notify = (message: string, isError: boolean = false) => {
    setActionNotification({ message, isError });
    setTimeout(() => {
      setActionNotification((current) => (current?.message === message ? null : current));
    }, 5000);
  };

  // Load high level metrics
  const loadOverviewMetrics = () => {
    if (!token) return;

    fetch('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setStats(data);
          if (data.pending_payments_count !== undefined) {
            setPendingPaymentsCount(data.pending_payments_count);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadOverviewMetrics();
  }, [token]);

  // Check Authorization
  if (!token || !user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white">Administrative Authentication Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please log in with verified administrator credentials to access the TechClass management console and database controls.
          </p>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
        >
          Sign In to Administrator Account
        </button>
      </div>
    );
  }

  const isOwnerOrAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.email?.toLowerCase().trim() === 'dynodazzle@gmail.com' ||
    user?.email?.toLowerCase().trim() === 'admin@techclass.in' ||
    Boolean(user?.is_admin) ||
    Boolean(user?.is_owner);

  // Auto-sync administrative privileges if owner/admin is logged in
  useEffect(() => {
    if (user && isOwnerOrAdmin && user.role !== 'SUPER_ADMIN') {
      updateUserData({
        role: 'SUPER_ADMIN',
        is_admin: true,
        is_owner: true,
        membership_status: 'ACTIVE',
        plan_name: 'App Owner / Lifetime Master Pass'
      });
    }
  }, [user?.email, user?.role, isOwnerOrAdmin]);

  if (!isOwnerOrAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-red-500/30 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">Administrative Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your current account (<span className="text-white font-semibold">{user.email}</span>) is registered as{' '}
            <span className="font-mono text-cyan-400 font-bold">[{user.role}]</span>. Unrestricted administrative privileges are required to view this area.
          </p>
        </div>
        <div className="flex flex-col space-y-2 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Return to Candidate Dashboard
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-2 text-xs text-slate-400 hover:text-white"
          >
            Switch to Admin Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>TechClass Administrative Control Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Admin Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Full administrative authority over digital PDFs, courses, mock test papers, candidates, UPI verification, and site settings.
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'METRICS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('SUPABASE')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'SUPABASE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-300 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Cloud</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('PDFS')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'PDFS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Documents</span>
          </button>

          <button
            onClick={() => setActiveTab('COURSES')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'COURSES' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Courses</span>
          </button>

          <button
            onClick={() => setActiveTab('TESTS')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'TESTS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Mock Tests</span>
          </button>

          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'STUDENTS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidates</span>
          </button>

          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-3 py-1.5 rounded-xl transition relative flex items-center space-x-1.5 ${
              activeTab === 'PAYMENTS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payments</span>
            {pendingPaymentsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-mono">
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'SETTINGS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              activeTab === 'LOGS' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Logs</span>
          </button>
        </div>
      </div>

      {/* Global Notification Toast */}
      {actionNotification && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border shadow-lg animate-in fade-in slide-in-from-top-2 duration-150 ${
            actionNotification.isError
              ? 'bg-red-950/80 border-red-500/50 text-red-200'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {actionNotification.isError ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold">{actionNotification.message}</span>
          </div>
          <button
            onClick={() => setActionNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'METRICS' && (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Students</div>
              <div className="text-2xl font-black text-white">{stats?.total_students ?? 2}</div>
              <div className="text-[11px] text-cyan-400">Registered Aspirants</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Paid Members</div>
              <div className="text-2xl font-black text-emerald-400">{stats?.paid_students ?? 1}</div>
              <div className="text-[11px] text-emerald-400">Annual Pass Holders</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Pending UTRs</div>
              <div className="text-2xl font-black text-amber-400">{pendingPaymentsCount}</div>
              <div className="text-[11px] text-amber-400">Awaiting Verification</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Approved Revenue</div>
              <div className="text-2xl font-black text-cyan-400">₹{stats?.approved_revenue ?? 2999}</div>
              <div className="text-[11px] text-slate-400">UPI Collections</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Conversion Rate</div>
              <div className="text-2xl font-black text-purple-400">{stats?.conversion_rate ?? 50}%</div>
              <div className="text-[11px] text-purple-400">Free to Paid Pass</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Audit Events</div>
              <div className="text-2xl font-black text-slate-300">{stats?.audit_events_count ?? 12}</div>
              <div className="text-[11px] text-slate-400">Compliance Trail</div>
            </div>
          </div>

          {/* Quick Launch Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition group">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Supabase Cloud Backend</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Project nuvxtpwgdlzeqsdnbnpx is connected. Inspect PostgreSQL tables, copy setup SQL, and sync classroom data.
              </p>
              <button
                onClick={() => setActiveTab('SUPABASE')}
                className="pt-2 text-xs text-emerald-400 font-bold group-hover:underline flex items-center space-x-1"
              >
                <span>Manage Supabase Cloud</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-cyan-500/40 transition group">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">PDF Document Management</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload single or bulk PDF materials, adjust DRM print/download permissions, and manage student library files.
              </p>
              <button
                onClick={() => setActiveTab('PDFS')}
                className="pt-2 text-xs text-cyan-400 font-bold group-hover:underline flex items-center space-x-1"
              >
                <span>Launch PDF Management</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition group">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">UPI Payment Queue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reconcile submitted 12-digit UTR transaction codes with bank statements and instantly activate 365-day access.
              </p>
              <button
                onClick={() => setActiveTab('PAYMENTS')}
                className="pt-2 text-xs text-emerald-400 font-bold group-hover:underline flex items-center space-x-1"
              >
                <span>Review Payments ({pendingPaymentsCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-amber-500/40 transition group">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">System Settings & Layout</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure brand details, recipient UPI VPA, membership pricing, announcement bar text, and toggle maintenance mode.
              </p>
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className="pt-2 text-xs text-amber-400 font-bold group-hover:underline flex items-center space-x-1"
              >
                <span>Open Platform Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUPABASE CLOUD MANAGEMENT */}
      {activeTab === 'SUPABASE' && (
        <SupabaseManagementTab token={token} onActionNotification={notify} />
      )}


      {/* TAB 2: PDF MANAGEMENT */}
      {activeTab === 'PDFS' && (
        <PdfManagementTab token={token} onActionNotification={notify} />
      )}

      {/* TAB 3: COURSE MANAGEMENT */}
      {activeTab === 'COURSES' && (
        <CourseManagementTab token={token} onActionNotification={notify} />
      )}

      {/* TAB 4: TEST MANAGEMENT */}
      {activeTab === 'TESTS' && (
        <TestManagementTab token={token} onActionNotification={notify} />
      )}

      {/* TAB 5: STUDENT MANAGEMENT */}
      {activeTab === 'STUDENTS' && (
        <StudentManagementTab token={token} currentUserId={user.id} onActionNotification={notify} />
      )}

      {/* TAB 6: PAYMENT MANAGEMENT */}
      {activeTab === 'PAYMENTS' && (
        <PaymentManagementTab token={token} onActionNotification={notify} />
      )}

      {/* TAB 7: SETTINGS MANAGEMENT */}
      {activeTab === 'SETTINGS' && (
        <SettingsManagementTab token={token} onActionNotification={notify} />
      )}

      {/* TAB 8: LOGS MANAGEMENT */}
      {activeTab === 'LOGS' && (
        <LogsManagementTab token={token} onActionNotification={notify} />
      )}
    </div>
  );
};
