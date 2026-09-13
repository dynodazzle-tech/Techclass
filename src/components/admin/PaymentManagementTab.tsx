import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  User,
  ArrowRight
} from 'lucide-react';
import { PaymentRecord } from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface PaymentManagementTabProps {
  token: string | null;
  onActionNotification: (msg: string, isError?: boolean) => void;
}

export const PaymentManagementTab: React.FC<PaymentManagementTabProps> = ({
  token,
  onActionNotification
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid or unmatched UTR number in bank statement.');
  const [isRejecting, setIsRejecting] = useState(false);

  // Deletion modal
  const [deleteTarget, setDeleteTarget] = useState<PaymentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPayments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load payment records');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPayments(data);
      }
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [token]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/payments/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve payment');

      onActionNotification('Payment approved! Candidate account upgraded to 365-day Annual Pass.');
      loadPayments();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleReject = async () => {
    if (!token || !rejectTargetId) return;
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/admin/payments/${rejectTargetId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject payment');

      onActionNotification('Payment marked as rejected and notification email sent to candidate.');
      setRejectModalOpen(false);
      setRejectTargetId(null);
      loadPayments();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/payments/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete payment');

      onActionNotification(`Payment record UTR "${deleteTarget.utr_number}" removed permanently.`);
      setDeleteTarget(null);
      loadPayments();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.utr_number?.toLowerCase().includes(q) ||
        p.student_name?.toLowerCase().includes(q) ||
        p.student_email?.toLowerCase().includes(q) ||
        p.student_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CreditCard className="w-4 h-4" />
            <span>Bank Settlement & UPI Verification</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Payment Operations</h2>
          <p className="text-xs text-slate-400">
            Verify candidate 12-digit UTR references against bank statements, activate Annual Passes, or issue rejection notices.
          </p>
        </div>

        {/* Counter badge */}
        <div className="flex items-center space-x-2">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <span className="font-black text-white mr-1.5">
              {payments.filter(p => p.status === 'PENDING').length}
            </span>
            Pending UPI Verifications
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by 12-digit UTR, candidate name, or TC-ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === st ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="grid grid-cols-12 p-3.5 bg-slate-950 text-xs font-bold text-slate-400 border-b border-slate-800">
          <div className="col-span-5 sm:col-span-4">Candidate & Contact</div>
          <div className="col-span-2 hidden sm:block">12-Digit UTR</div>
          <div className="col-span-2 text-center">Amount / Plan</div>
          <div className="col-span-2 hidden md:block text-center">Submission Time</div>
          <div className="col-span-5 sm:col-span-4 md:col-span-2 text-right">Verification</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading payment submissions...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No transactions found matching criteria.</p>
          </div>
        ) : (
          filteredPayments.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 p-3.5 text-xs text-slate-300 border-b border-slate-800/60 items-center hover:bg-slate-850/50 transition"
            >
              {/* Candidate Info */}
              <div className="col-span-5 sm:col-span-4 space-y-0.5">
                <div className="font-bold text-white flex items-center space-x-1.5">
                  <span>{p.student_name || 'Candidate'}</span>
                  <span className="font-mono text-[10px] text-cyan-400">({p.student_id})</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">{p.student_email}</div>
              </div>

              {/* UTR */}
              <div className="col-span-2 hidden sm:block">
                <div className="font-mono text-xs font-bold text-amber-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 inline-block">
                  {p.utr_number}
                </div>
              </div>

              {/* Amount */}
              <div className="col-span-2 text-center">
                <div className="font-mono font-bold text-white">₹{p.amount}</div>
                <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${
                  p.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                  p.status === 'REJECTED' ? 'bg-red-500/20 text-red-300' :
                  'bg-amber-500/20 text-amber-300'
                }`}>
                  {p.status}
                </span>
              </div>

              {/* Date */}
              <div className="col-span-2 hidden md:block text-center text-[11px] text-slate-400 font-mono">
                {new Date(p.created_at).toLocaleString()}
              </div>

              {/* Verification Actions */}
              <div className="col-span-5 sm:col-span-4 md:col-span-2 text-right flex items-center justify-end space-x-1.5">
                {p.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 transition shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectTargetId(p.id);
                        setRejectModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/80 font-bold text-xs transition"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 transition"
                    title="Delete Payment Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Reject UTR Submission</span>
            </h3>

            <p className="text-xs text-slate-400">
              Provide a clear reason for the candidate. This reason will be logged and dispatched via email.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-900/20"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete Payment Entry?"
        message={`Are you sure you want to erase UTR transaction record "${deleteTarget?.utr_number}"? This will not affect the candidate's existing access unless manually revoked.`}
        confirmLabel="Yes, Delete Record"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
