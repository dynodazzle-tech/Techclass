import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldAlert,
  Save,
  RotateCcw,
  CreditCard,
  Building,
  Mail,
  Smartphone,
  Globe,
  Bell,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Key,
  Lock,
  Eye,
  EyeOff,
  Send,
  ExternalLink
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface SettingsManagementTabProps {
  token: string | null;
  onActionNotification: (msg: string, isError?: boolean) => void;
}

export const SettingsManagementTab: React.FC<SettingsManagementTabProps> = ({
  token,
  onActionNotification
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [siteName, setSiteName] = useState('TechClass');
  const [siteTagline, setSiteTagline] = useState('Your Digital Classroom for Government Exam Preparation');
  const [brandParent, setBrandParent] = useState('DynoDazzle');
  const [siteDomain, setSiteDomain] = useState('https://techclass.dynodazzle.in');
  const [contactEmail, setContactEmail] = useState('dynodazzle@gmail.com');
  const [whatsappSupport, setWhatsappSupport] = useState('+91 7770032149');
  const [upiId, setUpiId] = useState('dynodazzle@ybl');
  const [passPrice, setPassPrice] = useState('2999');
  const [freeTestLimit, setFreeTestLimit] = useState('3');
  const [freePdfLimit, setFreePdfLimit] = useState('2');
  const [freeCourseLimit, setFreeCourseLimit] = useState('2');
  const [announcementText, setAnnouncementText] = useState('🔥 MPSC State Services 2026 Prelims Fastrack Batch & Mock Papers Live Now!');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Gmail SMTP credentials state
  const [gmailUser, setGmailUser] = useState('dynodazzle@gmail.com');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [hasGmailConfigured, setHasGmailConfigured] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Reset confirmation modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load system settings');
      const data = await res.json();
      const s = data.settings || data;
      if (s) {
        if (s.site_name) setSiteName(s.site_name);
        if (s.site_tagline) setSiteTagline(s.site_tagline);
        if (s.brand_parent) setBrandParent(s.brand_parent);
        if (s.site_domain) setSiteDomain(s.site_domain);
        if (s.contact_email) setContactEmail(s.contact_email);
        if (s.whatsapp_support) setWhatsappSupport(s.whatsapp_support);
        if (s.upi_id) setUpiId(s.upi_id);
        if (s.pass_price !== undefined) setPassPrice(String(s.pass_price));
        if (s.free_test_limit !== undefined) setFreeTestLimit(String(s.free_test_limit));
        if (s.free_pdf_limit !== undefined) setFreePdfLimit(String(s.free_pdf_limit));
        if (s.free_course_limit !== undefined) setFreeCourseLimit(String(s.free_course_limit));
        if (s.announcement_text !== undefined) setAnnouncementText(s.announcement_text);
        if (s.maintenance_mode !== undefined) setMaintenanceMode(Boolean(s.maintenance_mode));
        if (s.gmail_user) setGmailUser(s.gmail_user);
        if (s.gmail_app_password) setGmailAppPassword(s.gmail_app_password);
        if (s.has_gmail_configured !== undefined) setHasGmailConfigured(Boolean(s.has_gmail_configured));
      }
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [token]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);

    try {
      const payload = {
        site_name: siteName,
        site_tagline: siteTagline,
        brand_parent: brandParent,
        site_domain: siteDomain,
        contact_email: contactEmail,
        whatsapp_support: whatsappSupport,
        upi_id: upiId,
        pass_price: parseFloat(passPrice) || 2999,
        free_test_limit: parseInt(freeTestLimit) || 3,
        free_pdf_limit: parseInt(freePdfLimit) || 2,
        free_course_limit: parseInt(freeCourseLimit) || 2,
        announcement_text: announcementText,
        maintenance_mode: maintenanceMode,
        gmail_user: gmailUser,
        gmail_app_password: gmailAppPassword
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings: payload })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      if (gmailAppPassword && gmailAppPassword !== '••••••••••••••••') {
        setHasGmailConfigured(true);
        setGmailAppPassword('••••••••••••••••');
      }

      onActionNotification('System configurations and Gmail SMTP settings updated successfully!');
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleTestGmail = async () => {
    if (!token) return;
    setTestingEmail(true);
    try {
      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ to: gmailUser || 'dynodazzle@gmail.com' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test email delivery failed');

      if (data.deliveredViaGmail) {
        setHasGmailConfigured(true);
        onActionNotification(`✅ Test email delivered successfully to ${gmailUser || 'dynodazzle@gmail.com'} via Gmail SMTP!`);
      } else {
        onActionNotification(`⚠️ Email logged to database. Please paste your 16-character Google App Password below and click Save.`, true);
      }
    } catch (err: any) {
      onActionNotification(`Gmail SMTP Error: ${err.message}`, true);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!token) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/settings/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset settings');

      onActionNotification('Platform settings reset to factory defaults.');
      setResetModalOpen(false);
      loadSettings();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Platform Configuration & Global Controls</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">System Settings & Layout</h2>
          <p className="text-xs text-slate-400">
            Control platform branding, live UPI payment handles, Annual Pass pricing, trial usage limits, and site-wide maintenance modes.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Factory Reset</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Branding & Identity */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Brand Identity & Domain Mapping</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Parent Brand / Entity</label>
              <input
                type="text"
                value={brandParent}
                onChange={(e) => setBrandParent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={siteTagline}
                onChange={(e) => setSiteTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">Primary Production Domain URL</label>
              <input
                type="text"
                value={siteDomain}
                onChange={(e) => setSiteDomain(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: UPI & Pricing */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>UPI Gateway & Pass Monetization</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Merchant UPI ID (VPA)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="dynodazzle@ybl"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Generated QR code and payment intent use this VPA.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">365-Day Annual Pass Fee (₹ INR)</label>
              <input
                type="number"
                value={passPrice}
                onChange={(e) => setPassPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default price displayed on checkout page.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Contact & Support */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>Candidate Support Channels</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Official Support Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">WhatsApp Helpdesk Number</label>
              <input
                type="text"
                value={whatsappSupport}
                onChange={(e) => setWhatsappSupport(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3.5: Gmail SMTP Email Dispatch Setup */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Gmail SMTP Dispatch & App Password</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    hasGmailConfigured
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {hasGmailConfigured ? '● Gmail SMTP Configured' : '○ Pending 16-Char Password'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Sends admin 2FA security OTPs, password reset links, and student receipts directly to Gmail inboxes.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={testingEmail}
              onClick={handleTestGmail}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition border border-slate-700 disabled:opacity-50 shrink-0 self-start sm:self-auto"
            >
              <Send className={`w-3.5 h-3.5 ${testingEmail ? 'animate-pulse' : ''}`} />
              <span>{testingEmail ? 'Sending Test Email...' : 'Send Test to dynodazzle@gmail.com'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Gmail Sender Account
              </label>
              <input
                type="email"
                value={gmailUser}
                onChange={(e) => setGmailUser(e.target.value)}
                placeholder="dynodazzle@gmail.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                The registered Gmail address that will dispatch authentication and student emails.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                16-Character Google App Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  placeholder={hasGmailConfigured ? '•••••••••••••••• (Saved)' : 'Enter 16-character code (e.g. abcd efgh ijkl mnop)'}
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Generated from your Google Account security settings. Leave blank or masked to keep current.
              </p>
            </div>
          </div>

          {/* Setup Guide Accordion */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>How to generate your 16-Character Google App Password:</span>
              </span>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center space-x-1 font-mono text-[11px]"
              >
                <span>Google App Passwords</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>Open your Google Account at <strong className="text-white">myaccount.google.com</strong> and ensure <strong className="text-cyan-300">2-Step Verification</strong> is enabled.</li>
              <li>Navigate to <strong className="text-white">Security &gt; 2-Step Verification &gt; App passwords</strong> (or search "App passwords" in the top bar).</li>
              <li>Create a new app name (e.g. <strong className="text-white">TechClass</strong>) and click <strong className="text-white">Create</strong>.</li>
              <li>Copy the yellow 16-character code (e.g. <code className="text-amber-300 font-mono">abcd efgh ijkl mnop</code>), paste it into the field above, and click <strong className="text-cyan-400">Save Platform Configurations</strong> below.</li>
            </ol>
          </div>
        </div>

        {/* Section 4: Freemium Limits & Announcements */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Trial Restrictions & Dynamic Banner</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Free Tests Allowed</label>
              <input
                type="number"
                value={freeTestLimit}
                onChange={(e) => setFreeTestLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Free PDF Notes Allowed</label>
              <input
                type="number"
                value={freePdfLimit}
                onChange={(e) => setFreePdfLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Free Course Lessons Allowed</label>
              <input
                type="number"
                value={freeCourseLimit}
                onChange={(e) => setFreeCourseLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-300 mb-1">Top Announcement Banner Text</label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Notice displayed at the top of all pages..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">System Maintenance Mode</div>
              <p className="text-[11px] text-slate-400">
                When activated, non-admin visitors will see a maintenance notice while admins retain full access.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving System Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        title="Reset All Settings to Factory Defaults?"
        message="Are you sure you want to reset all site settings (pricing, UPI ID, trial limits, banner) back to default values? This cannot be undone."
        confirmLabel="Yes, Reset Settings"
        confirmVariant="warning"
        isLoading={isResetting}
        onConfirm={handleConfirmReset}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
};
