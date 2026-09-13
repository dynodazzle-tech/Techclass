import React from 'react';
import { GraduationCap, Mail, MessageSquare, Shield, ExternalLink, Award } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white">TECH<span className="text-cyan-400">CLASS</span></span>
                <p className="text-xs text-cyan-400/80 font-medium">A DynoDazzle EdTech Initiative</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              India's technology-first digital classroom for government competitive exam preparation. Providing structured courses, multilingual mock tests, and protected digital study material.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Official Email:</span>
                <a href="mailto:dynodazzle@gmail.com" className="text-cyan-400 hover:underline font-mono">
                  dynodazzle@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Paid Student WhatsApp:</span>
                <a
                  href="https://wa.me/917770032149"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline font-mono"
                >
                  +91 7770032149
                </a>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * WhatsApp support is exclusively available for active TechClass Annual Pass members.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold tracking-wider text-xs uppercase text-slate-200">Study Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigate('/courses')} className="hover:text-cyan-400 transition">Online Courses</button></li>
              <li><button onClick={() => navigate('/tests')} className="hover:text-cyan-400 transition">Full Mock Tests</button></li>
              <li><button onClick={() => navigate('/tests?type=PYQ')} className="hover:text-cyan-400 transition">Previous Year Papers</button></li>
              <li><button onClick={() => navigate('/library')} className="hover:text-cyan-400 transition">Digital PDF Library</button></li>
              <li><button onClick={() => navigate('/pricing')} className="hover:text-cyan-400 transition">Annual Pass (₹2,999)</button></li>
            </ul>
          </div>

          {/* Target Exams */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold tracking-wider text-xs uppercase text-slate-200">Exam Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigate('/courses?exam=MPSC')} className="hover:text-cyan-400 transition">MPSC Rajyaseva & Group B/C</button></li>
              <li><button onClick={() => navigate('/courses?exam=UPSC')} className="hover:text-cyan-400 transition">UPSC Civil Services</button></li>
              <li><button onClick={() => navigate('/courses?exam=SSC')} className="hover:text-cyan-400 transition">SSC CGL / CHSL / MTS</button></li>
              <li><button onClick={() => navigate('/courses?exam=Police Bharti')} className="hover:text-cyan-400 transition">Maharashtra Police Bharti</button></li>
              <li><button onClick={() => navigate('/courses?exam=Banking')} className="hover:text-cyan-400 transition">IBPS & SBI Banking Exams</button></li>
              <li><button onClick={() => navigate('/courses?exam=Railway')} className="hover:text-cyan-400 transition">RRB Railway NTPC & Group D</button></li>
            </ul>
          </div>

          {/* Legal & Brand */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold tracking-wider text-xs uppercase text-slate-200">Governance & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigate('/about')} className="hover:text-cyan-400 transition">About TechClass</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-cyan-400 transition">Contact Support</button></li>
              <li><button onClick={() => navigate('/terms')} className="hover:text-cyan-400 transition">Terms & Conditions</button></li>
              <li><button onClick={() => navigate('/privacy')} className="hover:text-cyan-400 transition">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/refund-policy')} className="hover:text-cyan-400 transition">Refund & Payment Policy</button></li>
              <li><a href="https://techclass.dynodazzle.in" target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-cyan-400 hover:underline"><span>techclass.dynodazzle.in</span> <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 TechClass (DynoDazzle). All rights reserved. Built for Indian Competitive Exam Aspirants.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-cyan-500" />
              <span>Protected Delivery & Traceable Watermarking</span>
            </span>
            <span className="hidden md:inline">•</span>
            <span className="font-mono text-slate-400">English | हिन्दी | मराठी</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
