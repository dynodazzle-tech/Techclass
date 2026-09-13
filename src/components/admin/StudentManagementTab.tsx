import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  Calendar,
  Lock,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  Smartphone,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { User } from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface StudentManagementTabProps {
  token: string | null;
  currentUserId?: string;
  onActionNotification: (msg: string, isError?: boolean) => void;
}

export const StudentManagementTab: React.FC<StudentManagementTabProps> = ({
  token,
  currentUserId,
  onActionNotification
}) => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('techclass123');
  const [role, setRole] = useState<'FREE_STUDENT' | 'PAID_STUDENT' | 'ADMIN'>('PAID_STUDENT');
  const [targetExams, setTargetExams] = useState('MPSC, Police Bharti');
  const [membershipDays, setMembershipDays] = useState('365');

  const loadStudents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load student directory');
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [token]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        full_name: fullName,
        email,
        mobile_number: mobile,
        password,
        role,
        target_exams: targetExams.split(',').map(s => s.trim()).filter(Boolean),
        membership_days: parseInt(membershipDays) || 365
      };

      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register student');

      onActionNotification(`Student registered successfully! Student ID assigned: ${data.student.student_id}`);
      setCreateModalOpen(false);
      resetForm();
      loadStudents();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleUpdateRole = async (studentId: string, newRole: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/students/${studentId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');

      onActionNotification(`Student role changed to ${newRole}.`);
      loadStudents();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleExtendMembership = async (studentId: string, days: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/students/${studentId}/extend-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ days })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extend membership');

      onActionNotification(`Extended membership by ${days} days! Valid until ${new Date(data.membership_expires_at).toLocaleDateString()}.`);
      loadStudents();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleToggleStatus = async (student: User) => {
    if (!token) return;
    const newStatus = student.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await fetch(`/api/admin/students/${student.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to toggle status');

      onActionNotification(`Account ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'} for ${student.full_name}.`);
      loadStudents();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleResetPassword = async (student: User) => {
    if (!token) return;
    const tempPassword = `TC${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const res = await fetch(`/api/admin/students/${student.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: tempPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      onActionNotification(`Password reset for ${student.full_name}! Temporary password: ${tempPassword}`);
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/students/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete student');

      onActionNotification(`Candidate ${deleteTarget.full_name} permanently removed from system.`);
      setDeleteTarget(null);
      loadStudents();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setMobile('');
    setPassword('techclass123');
  };

  const filteredStudents = students.filter(s => {
    if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q) ||
        s.mobile_number?.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Candidate & User Administration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Student Directory</h2>
          <p className="text-xs text-slate-400">
            Provision student credentials, assign administrative roles, extend Annual Passes, and enforce access restrictions.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Candidate Manually</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, TC-ID, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Roles</option>
              <option value="PAID_STUDENT">Paid Pass</option>
              <option value="FREE_STUDENT">Free Trial</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="grid grid-cols-12 p-3.5 bg-slate-950 text-xs font-bold text-slate-400 border-b border-slate-800">
          <div className="col-span-5 sm:col-span-4">Student Name & Contact</div>
          <div className="col-span-2 hidden sm:block">Roll / TC-ID</div>
          <div className="col-span-2 text-center">Membership Validity</div>
          <div className="col-span-2 hidden md:block text-center">Role / Status</div>
          <div className="col-span-5 sm:col-span-4 md:col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading student directory...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No students found.</p>
          </div>
        ) : (
          filteredStudents.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-12 p-3.5 text-xs text-slate-300 border-b border-slate-800/60 items-center hover:bg-slate-850/50 transition"
            >
              <div className="col-span-5 sm:col-span-4 space-y-0.5">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <span>{s.full_name}</span>
                  {s.role === 'ADMIN' && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-slate-500" />
                  <span>{s.email}</span>
                </div>
                {s.mobile_number && (
                  <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Smartphone className="w-3 h-3" />
                    <span>{s.mobile_number}</span>
                  </div>
                )}
              </div>

              <div className="col-span-2 hidden sm:block">
                <span className="font-mono text-xs text-cyan-400 font-bold">{s.student_id}</span>
              </div>

              <div className="col-span-2 text-center text-[11px]">
                {s.role === 'PAID_STUDENT' && s.membership_expires_at ? (
                  <div>
                    <div className="font-bold text-emerald-400">
                      {new Date(s.membership_expires_at).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {Math.max(0, Math.ceil((new Date(s.membership_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-500">Free Tier</span>
                )}
              </div>

              <div className="col-span-2 hidden md:flex flex-col items-center justify-center space-y-1">
                <select
                  value={s.role}
                  onChange={(e) => handleUpdateRole(s.id, e.target.value)}
                  className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-bold"
                >
                  <option value="FREE_STUDENT">FREE STUDENT</option>
                  <option value="PAID_STUDENT">PAID STUDENT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>

                <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                  s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {s.status}
                </span>
              </div>

              <div className="col-span-5 sm:col-span-4 md:col-span-2 text-right flex items-center justify-end space-x-1.5">
                <button
                  onClick={() => handleExtendMembership(s.id, 365)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 text-[10px] font-bold transition"
                  title="Extend Membership by 365 Days"
                >
                  +1 Yr
                </button>

                <button
                  onClick={() => handleResetPassword(s)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Reset Student Password"
                >
                  <Key className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleToggleStatus(s)}
                  className={`p-1.5 rounded-lg transition ${
                    s.status === 'ACTIVE' ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                  title={s.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                >
                  {s.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                {s.id !== currentUserId && (
                  <button
                    onClick={() => setDeleteTarget(s)}
                    className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 transition"
                    title="Permanently Delete Student"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE STUDENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full my-8 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Register Candidate Manually</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Anand R. Patil"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aspirant@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="PAID_STUDENT">PAID STUDENT (Pass)</option>
                    <option value="FREE_STUDENT">FREE STUDENT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              {role === 'PAID_STUDENT' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Membership Validity (Days)</label>
                  <input
                    type="number"
                    value={membershipDays}
                    onChange={(e) => setMembershipDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Exams (comma-separated)</label>
                <input
                  type="text"
                  value={targetExams}
                  onChange={(e) => setTargetExams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete Student Record?"
        message={`Are you sure you want to permanently delete candidate "${deleteTarget?.full_name}" (${deleteTarget?.student_id})? This will erase their user profile, test attempts, test scores, and reading bookmarks forever.`}
        confirmLabel="Yes, Delete Student"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
