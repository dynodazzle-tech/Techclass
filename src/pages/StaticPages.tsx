import React from 'react';
import { Mail, MessageSquare, Shield, ExternalLink, GraduationCap, CheckCircle2 } from 'lucide-react';

interface StaticPageProps {
  page: 'ABOUT' | 'CONTACT' | 'TERMS' | 'PRIVACY' | 'REFUND';
  navigate: (path: string) => void;
}

export const StaticPage: React.FC<StaticPageProps> = ({ page, navigate }) => {
  if (page === 'ABOUT') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">About Us</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">About TechClass</h1>
          <p className="text-sm text-cyan-400/90 font-medium">A DynoDazzle EdTech Initiative</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-8 rounded-3xl border border-slate-800">
          <p>
            <strong>TechClass</strong> is an advanced digital classroom and competitive exam preparation platform built specifically for Indian government job aspirants appearing for <strong>UPSC, MPSC, SSC, Banking, Railway, and Police Bharti</strong> examinations.
          </p>
          <p>
            Developed under the banner of <strong>DynoDazzle</strong>, our objective is to dismantle the barriers of expensive coaching and language friction. We provide top-tier learning resources in <strong>Marathi, Hindi, and English</strong>, accompanied by an authentic exam simulation engine and an eye-friendly protected digital reading experience.
          </p>
          <h3 className="text-lg font-bold text-white pt-2">Our Core Pillars</h3>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>Trilingual Exam Engine:</strong> Every test item is curated and translated into English, हिन्दी, and मराठी.</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>E-Ink Reading Technology:</strong> Zero eye fatigue study modes emulating natural paper books.</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>Anti-Piracy Traceable Protection:</strong> Dynamic student watermarking on private notes.</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span><strong>Affordable Access:</strong> Annual Pass at just ₹2,999/year with manual UPI verification.</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (page === 'CONTACT') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Support & Help</span>
          <h1 className="text-3xl font-extrabold text-white">Contact TechClass Desk</h1>
          <p className="text-sm text-slate-400">Reach our academic and support desk directly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <Mail className="w-6 h-6 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Official General Support</h3>
            <p className="text-xs text-slate-400">For account queries, partnership and feedback:</p>
            <a href="mailto:dynodazzle@gmail.com" className="text-sm font-mono text-cyan-400 hover:underline block font-bold">
              dynodazzle@gmail.com
            </a>
            <div className="text-[11px] text-slate-500">Response time: within 24 business hours.</div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Paid Member WhatsApp Desk</h3>
            <p className="text-xs text-slate-400">Exclusive priority support for active Annual Pass students:</p>
            <a href="https://wa.me/917770032149" target="_blank" rel="noreferrer" className="text-sm font-mono text-emerald-400 hover:underline block font-bold">
              +91 7770032149
            </a>
            <div className="text-[11px] text-slate-500">Operating hours: 9:00 AM – 9:00 PM IST.</div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'TERMS') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-sm text-slate-300">
        <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
        <p className="text-xs text-slate-400">Last updated: March 2026</p>
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">1. Platform Access & Student License</h3>
          <p className="text-xs leading-relaxed">
            TechClass grants the registered student a personal, non-transferable, non-exclusive license to access courses, mock test papers, and digital study material strictly for individual educational preparation.
          </p>
          <h3 className="text-base font-bold text-white">2. Content Protection & Anti-Piracy</h3>
          <p className="text-xs leading-relaxed">
            All PDF notes and tests are stamped with dynamic watermarks containing the student's name and permanent Student ID. Unlicensed duplication, extraction, or distribution on public forums or Telegram channels is strictly prohibited and subject to account termination and legal action.
          </p>
          <h3 className="text-base font-bold text-white">3. Annual Pass Validity</h3>
          <p className="text-xs leading-relaxed">
            The TechClass Annual Pass remains valid for exactly 365 calendar days from the date of administrative payment approval.
          </p>
        </div>
      </div>
    );
  }

  if (page === 'PRIVACY') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-sm text-slate-300">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <p className="text-xs leading-relaxed">
            TechClass and DynoDazzle prioritize student privacy. We collect essential candidate data such as full name, email, mobile number, and target exams solely for managing platform accounts and educational communications.
          </p>
          <p className="text-xs leading-relaxed">
            We never sell or distribute student contact information to third-party telemarketers. All session tokens and passwords are cryptographically secured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-sm text-slate-300">
      <h1 className="text-3xl font-bold text-white">Payment & Refund Policy</h1>
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Manual UPI Payment Verification</h3>
        <p className="text-xs leading-relaxed">
          Payments for TechClass Annual Pass (₹2,999/year) are completed via direct UPI transfer to our official ID <code>techclass@upi</code>. Once the candidate submits their 12-digit UTR reference, our team verifies the credit against bank records within 2-4 hours.
        </p>
        <h3 className="text-base font-bold text-white">Refund Guidelines</h3>
        <p className="text-xs leading-relaxed">
          Because digital study materials, past-year papers, and full question sets are unlocked immediately upon pass activation, payments are generally non-refundable once content has been accessed. In case of accidental duplicate transfers with identical UTRs, verified excess funds will be refunded to the source account within 5-7 working days.
        </p>
      </div>
    </div>
  );
};
