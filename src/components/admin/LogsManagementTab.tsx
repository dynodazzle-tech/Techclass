import React, { useState, useEffect } from 'react';
import {
  FileText,
  Mail,
  ShieldCheck,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Send,
  ExternalLink
} from 'lucide-react';
import { AuditLogItem, EmailLogItem } from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface LogsManagementTabProps {
  token: string | null;
  onActionNotification: (msg: string, isError?: boolean) => void;
}

export const LogsManagementTab: React.FC<LogsManagementTabProps> = ({
  token,
  onActionNotification
}) => {
  const [subTab, setSubTab] = useState<'AUDIT' | 'EMAILS'>('AUDIT');
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ senderEmail: string; isConfigured: boolean; hasAppPassword: boolean; guide: string } | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('dynodazzle@gmail.com');

  // Purge Modal
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Email Preview Modal
  const [previewEmail, setPreviewEmail] = useState<EmailLogItem | null>(null);

  const loadLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [resAudit, resEmail, resStatus] = await Promise.all([
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/email-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/email-status', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (resAudit.ok) {
        const auditData = await resAudit.json();
        if (Array.isArray(auditData)) setAuditLogs(auditData);
      }
      if (resEmail.ok) {
        const emailData = await resEmail.json();
        if (Array.isArray(emailData)) setEmailLogs(emailData);
      }
      if (resStatus.ok) {
        const statusData = await resStatus.json();
        setEmailStatus(statusData);
      }
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!token) return;
    setSendingTestEmail(true);
    try {
      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ to: testEmailAddress })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch test email');

      if (data.deliveredViaGmail) {
        onActionNotification(`✅ Real Gmail email sent to ${testEmailAddress} via SMTP!`);
      } else {
        onActionNotification(`Email logged to database. Set GMAIL_APP_PASSWORD in settings to deliver directly to Gmail inbox.`);
      }
      loadLogs();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setSendingTestEmail(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [token]);

  const handlePurgeAuditLogs = async () => {
    if (!token) return;
    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear audit trail');

      onActionNotification('Audit history purged successfully.');
      setPurgeModalOpen(false);
      loadLogs();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setIsPurging(false);
    }
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.admin_email?.toLowerCase().includes(q) ||
      log.target_type?.toLowerCase().includes(q) ||
      log.target_id?.toLowerCase().includes(q)
    );
  });

  const filteredEmailLogs = emailLogs.filter(email => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      email.recipient_email?.toLowerCase().includes(q) ||
      email.subject?.toLowerCase().includes(q) ||
      email.template_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Compliance, Security & Notification Logs</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">System Audit & Email Logs</h2>
          <p className="text-xs text-slate-400">
            Immutable tracking of all administrative actions, student account changes, payment operations, and outgoing transactional emails.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {subTab === 'AUDIT' && (
            <button
              onClick={() => setPurgeModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Audit History</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab Bar */}
      <div className="flex items-center justify-between gap-4 p-2 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setSubTab('AUDIT')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              subTab === 'AUDIT' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Admin Audit Trail ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setSubTab('EMAILS')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              subTab === 'EMAILS' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Dispatched Emails ({emailLogs.length})</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* VIEW: AUDIT LOGS */}
      {subTab === 'AUDIT' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="grid grid-cols-12 p-3.5 bg-slate-950 text-xs font-bold text-slate-400 border-b border-slate-800">
            <div className="col-span-3 sm:col-span-2">Timestamp</div>
            <div className="col-span-3 sm:col-span-3">Admin Actor</div>
            <div className="col-span-3 sm:col-span-3">Action Executed</div>
            <div className="col-span-3 sm:col-span-4">Target & Metadata</div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading audit records...</div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No audit events found.</p>
            </div>
          ) : (
            filteredAuditLogs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-12 p-3 text-xs text-slate-300 border-b border-slate-800/60 items-center hover:bg-slate-850/40 transition font-mono"
              >
                <div className="col-span-3 sm:col-span-2 text-[11px] text-slate-400 truncate">
                  {new Date(log.created_at).toLocaleString()}
                </div>

                <div className="col-span-3 sm:col-span-3 font-sans font-semibold text-white truncate">
                  {log.admin_email || 'System'}
                </div>

                <div className="col-span-3 sm:col-span-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.action.includes('DELETE')
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : log.action.includes('CREATE') || log.action.includes('APPROVE')
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {log.action}
                  </span>
                </div>

                <div className="col-span-3 sm:col-span-4 text-[11px] text-slate-400 font-sans truncate">
                  <span className="font-bold text-slate-300">{log.target_type}</span>: {log.target_id || log.details_json || 'System Setting'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW: EMAIL LOGS */}
      {subTab === 'EMAILS' && (
        <div className="space-y-4">
          {/* Gmail SMTP Status Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-white">Gmail SMTP Dispatch Service</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      emailStatus?.isConfigured
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {emailStatus?.isConfigured ? '● Gmail SMTP Active' : '○ Ready for App Password'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Sender Account: <code className="text-cyan-400 font-mono font-semibold">{emailStatus?.senderEmail || 'dynodazzle@gmail.com'}</code>
                  </p>
                </div>
              </div>

              {/* Test Email Dispatch Trigger */}
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Target email address"
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 font-mono"
                />
                <button
                  type="button"
                  disabled={sendingTestEmail || !testEmailAddress}
                  onClick={handleSendTestEmail}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-pulse' : ''}`} />
                  <span>{sendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 shrink-0">Gmail Config Guide:</span>
              <span>
                To send live emails to any inbox using <code className="text-cyan-400 font-mono">dynodazzle@gmail.com</code>, turn on 2-Step Verification on your Google Account, generate a 16-character App Password at{' '}
                <span className="text-cyan-300 font-mono">Google Account &gt; Security &gt; 2-Step Verification &gt; App passwords</span>, and provide it as <code className="text-amber-300 font-mono">GMAIL_APP_PASSWORD</code> in Settings.
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="grid grid-cols-12 p-3.5 bg-slate-950 text-xs font-bold text-slate-400 border-b border-slate-800">
              <div className="col-span-3 sm:col-span-2">Sent Time</div>
              <div className="col-span-4 sm:col-span-3">Recipient</div>
              <div className="col-span-3 sm:col-span-5">Subject Line</div>
              <div className="col-span-2 text-right">Preview</div>
            </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading email logs...</div>
          ) : filteredEmailLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Mail className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No email logs found.</p>
            </div>
          ) : (
            filteredEmailLogs.map((email) => (
              <div
                key={email.id}
                className="grid grid-cols-12 p-3 text-xs text-slate-300 border-b border-slate-800/60 items-center hover:bg-slate-850/40 transition"
              >
                <div className="col-span-3 sm:col-span-2 text-[11px] text-slate-400 font-mono truncate">
                  {new Date(email.created_at).toLocaleString()}
                </div>

                <div className="col-span-4 sm:col-span-3 font-semibold text-white truncate">
                  {email.recipient_email}
                </div>

                <div className="col-span-3 sm:col-span-5 truncate text-slate-300">
                  <span className="font-bold text-cyan-400 mr-2">[{email.template_name}]</span>
                  <span>{email.subject}</span>
                </div>

                <div className="col-span-2 text-right">
                  <button
                    onClick={() => setPreviewEmail(email)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 transition"
                    title="Preview Email Content"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}

      {/* EMAIL PREVIEW MODAL */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Email Delivery Details</span>
              </h3>
              <button onClick={() => setPreviewEmail(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div><span className="text-slate-400">To:</span> <strong className="text-white">{previewEmail.recipient_email}</strong></div>
                <div><span className="text-slate-400">Subject:</span> <strong className="text-white">{previewEmail.subject}</strong></div>
                <div><span className="text-slate-400">Template:</span> <span className="font-mono text-cyan-400">{previewEmail.template_name}</span></div>
                <div><span className="text-slate-400">Sent At:</span> <span className="text-slate-300">{new Date(previewEmail.created_at).toLocaleString()}</span></div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-60 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-slate-300">
                {previewEmail.body_preview || 'No raw email body stored.'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURGE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={purgeModalOpen}
        title="Purge All Administrative Audit History?"
        message="Are you sure you want to permanently erase the entire system audit trail? All historical records of admin logins, document uploads, and student adjustments will be destroyed."
        confirmLabel="Yes, Clear All History"
        confirmVariant="danger"
        isLoading={isPurging}
        onConfirm={handlePurgeAuditLogs}
        onCancel={() => setPurgeModalOpen(false)}
      />
    </div>
  );
};
