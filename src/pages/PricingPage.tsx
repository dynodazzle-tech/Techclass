import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PaymentRecord } from '../types';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Clock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  FileText,
  Sparkles,
  Zap,
  ExternalLink
} from 'lucide-react';

interface PricingPageProps {
  navigate: (path: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ navigate }) => {
  const { user, token, settings } = useAuth();
  const { t } = useLanguage();

  const [utrNumber, setUtrNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [myPayments, setMyPayments] = useState<PaymentRecord[]>([]);

  const price = settings?.annual_membership_price || 2999;
  const upiId = settings?.upi_id || 'dynodazzle@ybl';

  // Standard scannable UPI intent URL for Indian payment apps
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('TechClass')}&am=${price}&cu=INR&tn=${encodeURIComponent('TechClass Annual Pass')}`;

  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(upiPayUrl, { errorCorrectionLevel: 'M' });
      const size = qr.modules.size;
      const margin = 2;
      const totalSize = size + margin * 2;
      let path = '';
      for (let r = 0; r < size; r++) {
        let start = -1;
        for (let c = 0; c <= size; c++) {
          if (c < size && qr.modules.get(r, c)) {
            if (start === -1) start = c;
          } else {
            if (start !== -1) {
              const len = c - start;
              path += `M${start + margin},${r + margin}h${len}v1h-${len}z `;
              start = -1;
            }
          }
        }
      }
      return { totalSize, path };
    } catch (e) {
      console.error('Failed to generate QR modules:', e);
      return null;
    }
  }, [upiPayUrl]);

  // Load user's payment records if logged in
  useEffect(() => {
    if (token) {
      fetch('/api/payments/my-records', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => (res.ok ? res.json() : []))
        .then(data => {
          if (Array.isArray(data)) setMyPayments(data);
        })
        .catch(err => console.error(err));
    }
  }, [token, successMsg]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UTR reference number from your UPI app receipt.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/payments/submit-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'ANNUAL_PASS',
          amount: price,
          utr_number: utrNumber.trim(),
          payment_date: paymentDate,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment reference');
      }

      setSuccessMsg('Your UTR reference has been submitted successfully! Our verification desk will review and activate your Annual Pass within 2-4 hours.');
      setUtrNumber('');
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const isPaid = user?.membership_status === 'ACTIVE' || user?.role === 'PAID_STUDENT';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Simple, Transparent Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">TechClass Annual Pass</h1>
        <p className="text-sm text-slate-400">
          Prepare for UPSC, MPSC, SSC, Banking, and Police Bharti exams with full year access to all courses, mock tests, and protected digital library.
        </p>
      </div>

      {/* Pricing Comparison Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Free Plan */}
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Free Student Tier</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                Forever Free
              </span>
            </div>
            <div className="text-4xl font-black text-white">₹0</div>
            <p className="text-xs text-slate-400">
              Get started with sample tests and foundational notes to experience the TechClass digital classroom.
            </p>
            <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>3 Full-Length Mock Tests</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Maharashtra GK & Atlas Notes in Library</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Course Preview Lessons</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Personal Student Dashboard</span>
              </li>
            </ul>
          </div>

          <button
            disabled={!user || user.role === 'FREE_STUDENT'}
            onClick={() => navigate(user ? '/dashboard' : '/register')}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            {user?.role === 'FREE_STUDENT' ? 'Current Active Tier' : 'Register Free Account'}
          </button>
        </div>

        {/* Annual Pass Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border-2 border-cyan-500/50 flex flex-col justify-between space-y-6 shadow-2xl relative">
          <div className="absolute top-4 right-4">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500 text-slate-950 shadow-sm">
              RECOMMENDED
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Annual Pass (365 Days)</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black text-cyan-400">₹{price}</span>
              <span className="text-xs text-slate-400 font-medium">/ year</span>
            </div>
            <p className="text-xs text-slate-300">
              Unrestricted access to all courses, full mock test papers, protected E-Ink notes, and dedicated WhatsApp student desk.
            </p>
            <ul className="space-y-3 text-xs text-slate-200 pt-4 border-t border-slate-800/80">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Unlimited Mock Tests</strong> across all exams all year</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Complete Digital Library</strong> with E-Ink Paper Mode</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Previous-Year Solved Papers</strong> with full solutions</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Priority WhatsApp Academic Desk:</strong> +91 7770032149</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Personalized Anti-Piracy Watermark</strong> on all notes</span>
              </li>
            </ul>
          </div>

          {isPaid ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center text-xs font-bold">
              ✓ Annual Pass is Active on Your Account!
            </div>
          ) : (
            <a
              href="#upi-section"
              className="w-full py-3 text-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20 block"
            >
              Pay ₹{price} via UPI & Submit UTR
            </a>
          )}
        </div>
      </div>

      {/* UPI Payment Flow & UTR Submission Form */}
      <section id="upi-section" className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Manual UPI Payment Instructions</span>
          </div>
          <h2 className="text-2xl font-bold text-white">How to Pay Using Any UPI App</h2>
          <p className="text-xs text-slate-400">
            Pay from Google Pay, PhonePe, Paytm, BHIM, or any bank app, then enter the 12-digit UTR reference number below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: UPI Details & QR Simulation */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 text-center">
            {/* Visual QR Code Container */}
            <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-lg flex flex-col items-center justify-center space-y-2">
              {/* SVG QR Code Pattern */}
              {qrData ? (
                <svg
                  viewBox={`0 0 ${qrData.totalSize} ${qrData.totalSize}`}
                  className="w-full h-full text-slate-950"
                  shapeRendering="crispEdges"
                >
                  <path fill="#ffffff" d={`M0 0h${qrData.totalSize}v${qrData.totalSize}H0z`} />
                  <path fill="#020617" d={qrData.path} />
                </svg>
              ) : (
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950" fill="currentColor">
                  <rect width="100" height="100" fill="#f8fafc" />
                </svg>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-slate-300">
                Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)
              </div>
              <div className="pt-0.5">
                <a
                  href={upiPayUrl}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
                >
                  <span>Tap to Pay on UPI App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* UPI ID Copy Box */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 text-left">OFFICIAL UPI ID</div>
                <div className="font-mono font-bold text-cyan-300">{upiId}</div>
              </div>
              <button
                onClick={handleCopyUpi}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              Payee Name: <strong className="text-slate-200">TechClass (DynoDazzle EdTech)</strong>
            </div>
          </div>

          {/* Right: UTR Submission Form */}
          <form onSubmit={handleSubmitUtr} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                12-Digit UTR / Transaction Reference Number *
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 507421890342"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Found in bank SMS or under transaction details in your UPI app.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount Paid
                </label>
                <input
                  type="text"
                  disabled
                  value={`₹${price}`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-cyan-400 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Notes (Bank / Account name)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid from Rahul Deshmukh SBI account"
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <span>Submitting Reference...</span>
              ) : (
                <>
                  <span>Submit UTR for Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <strong>Verification SLA:</strong> Our team checks bank statements against submitted UTRs within 2-4 hours. You will receive an official activation confirmation email once approved.
            </div>
          </form>
        </div>
      </section>

      {/* Submitted Payment History */}
      {myPayments.length > 0 && (
        <section className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-white">Your Submitted Payment Records</h3>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="grid grid-cols-4 p-3.5 bg-slate-950 text-xs font-bold text-slate-400 border-b border-slate-800">
              <div>UTR Number</div>
              <div>Date</div>
              <div>Amount</div>
              <div className="text-right">Status</div>
            </div>
            {myPayments.map(p => (
              <div key={p.id} className="grid grid-cols-4 p-3.5 text-xs text-slate-300 border-b border-slate-800/60 items-center">
                <div className="font-mono text-cyan-300">{p.utr_number}</div>
                <div>{p.payment_date}</div>
                <div>₹{p.amount}</div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    p.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : p.status === 'REJECTED'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
