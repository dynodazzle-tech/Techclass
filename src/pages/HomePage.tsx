import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Course, TestPaper, PdfDocument } from '../types';
import { apiFetch } from '../lib/api';
import {
  GraduationCap,
  BookOpen,
  FileCheck2,
  Library,
  Shield,
  Smartphone,
  BarChart3,
  Languages,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  Clock,
  DownloadCloud,
  ChevronRight,
  Zap,
  HelpCircle,
  QrCode,
  Users,
  Eye,
  FileText
} from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { user, settings } = useAuth();
  const { t } = useLanguage();

  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<TestPaper[]>([]);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  useEffect(() => {
    apiFetch<Course[]>('/api/courses')
      .then(data => Array.isArray(data) && setCourses(data.slice(0, 3)))
      .catch(() => {});

    apiFetch<TestPaper[]>('/api/tests')
      .then(data => Array.isArray(data) && setTests(data.slice(0, 3)))
      .catch(() => {});

    apiFetch<PdfDocument[]>('/api/library/items')
      .then(data => Array.isArray(data) && setPdfs(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  const popularExams = [
    { name: 'MPSC Rajyaseva', category: 'State PSC', desc: 'General Studies & CSAT with Maharashtra Special', badge: 'High Demand' },
    { name: 'Maharashtra Police Bharti', category: 'State Police', desc: 'Marathi Grammar, Math & General Knowledge', badge: 'Mission Khaki' },
    { name: 'SSC CGL / CHSL', category: 'Central Govt', desc: 'Speed Math, Reasoning, English & GA', badge: 'Tier 1 & Tier 2' },
    { name: 'UPSC Civil Services', category: 'Central Civil', desc: 'Prelims GS Paper 1 & 2 Conceptual Booster', badge: 'All-India' },
    { name: 'Banking (IBPS & SBI)', category: 'Public Banks', desc: 'Quantitative Aptitude, Puzzles & Banking Awareness', badge: 'Speed Tests' },
    { name: 'Railway (RRB NTPC)', category: 'Central Railways', desc: 'General Science, Math & Reasoning PYQs', badge: 'High Vacancy' }
  ];

  const faqs = [
    {
      q: 'Can I start using TechClass for free before paying?',
      a: 'Yes, absolutely! TechClass offers a generous Free Tier including selected full mock tests, sample course lessons, and digital study PDFs so you can experience the platform quality before subscribing to the Annual Pass.'
    },
    {
      q: 'How does the UPI payment and verification process work?',
      a: 'Click "Get Annual Access" to view our official UPI ID (techclass@upi) and dynamic QR code. Pay ₹2,999 using any UPI app (GPay, PhonePe, Paytm, BHIM) and submit your 12-digit UTR transaction reference number. Our admin verifies and activates your account within 2-4 hours, with email confirmations at every stage.'
    },
    {
      q: 'Are the mock tests available in Marathi and Hindi as well as English?',
      a: 'Yes! Every question includes verified translations in English, हिन्दी, and मराठी. You can even toggle your preferred language on the fly while taking the test.'
    },
    {
      q: 'What is E-Ink Reading Mode in the Digital Library?',
      a: 'E-Ink mode optimizes the document viewer with high-contrast paper-textured reading surfaces, crisp typography, and zero distracting animations, making study comfortable on smartphones and electronic paper devices without eye fatigue.'
    },
    {
      q: 'How do paid students get WhatsApp support?',
      a: 'Active TechClass Annual Pass members have a direct "WhatsApp Support" button in their student dashboard that connects to our dedicated academic support desk at +91 7770032149.'
    }
  ];

  const price = settings?.annual_membership_price || 2999;

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Your Digital Classroom for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                Government Exam Preparation
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Learn, practice and revise with courses, mock tests and digital study material in{' '}
              <strong className="text-white">Hindi, Marathi and English</strong>.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                id="hero-start-free-btn"
                onClick={() => navigate(user ? '/dashboard' : '/register')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition flex items-center justify-center space-x-2"
              >
                <span>Start Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => navigate('/courses')}
                className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-semibold bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 transition flex items-center justify-center space-x-2"
              >
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Explore Courses</span>
              </button>

              <button
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto px-6 py-4 rounded-xl text-base font-semibold text-cyan-300 hover:text-white border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/50 transition flex items-center justify-center space-x-2"
              >
                <span>Annual Pass (₹{price})</span>
              </button>
            </div>

            {/* Trust badges row */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              <div className="flex items-center space-x-2.5 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>MPSC, UPSC & SSC Focused</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Multilingual (MR / HI / EN)</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>E-Ink Paper Reading Mode</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Protected Delivery & Watermarks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR EXAMS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Target Examinations</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Popular Competitive Exams</h2>
            <p className="text-sm text-slate-400 mt-1">Structured syllabus coverage designed by subject specialists.</p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="mt-3 sm:mt-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View All Exams</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularExams.map((exam, i) => (
            <div
              key={i}
              onClick={() => navigate(`/courses?exam=${encodeURIComponent(exam.name.split(' ')[0])}`)}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/90 transition cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{exam.category}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {exam.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition">{exam.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{exam.desc}</p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-300 group-hover:text-cyan-300">
                <span>Access Courses & Tests</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FREE LEARNING SECTION (Try before paying) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-900/50 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span>Free Student Experience</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Experience TechClass Free Before You Upgrade
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                We believe in earning student trust. Every registered free student gets instant access to:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>3 Full Mock Tests</strong> with trilingual questions (EN / HI / MR) & explanations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Maharashtra GK Notes & Atlas</strong> in the protected Digital Library</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>SSC Speed Math & Reasoning</strong> preview lessons</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Student Dashboard & Analytics</strong> to track progress and study streaks</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/register')}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-md shadow-cyan-500/20 flex items-center space-x-2"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Try Instant Sample Test</div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  FREE ACCESS MOCK
                </span>
                <h4 className="text-sm font-bold text-white mt-2">MPSC State Services GS Paper 1 Mock Test 01</h4>
                <p className="text-xs text-slate-400 mt-1">100 Marks • 60 Mins • Trilingual Questions</p>
                <button
                  onClick={() => navigate('/tests')}
                  className="mt-3 w-full py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 text-xs font-semibold transition"
                >
                  Attempt Free Sample
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  FREE DIGITAL PDF
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Maharashtra GK & Administrative Atlas 2026</h4>
                <p className="text-xs text-slate-400 mt-1">12 Pages • E-Ink Reading Mode Ready</p>
                <button
                  onClick={() => navigate('/library')}
                  className="mt-3 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Read Free in Library
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED COURSES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Structured Curricula</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Courses</h2>
            <p className="text-sm text-slate-400 mt-1">Master foundational concepts and advanced exam patterns.</p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="mt-3 sm:mt-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View All Courses</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/course/${c.id}`)}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden hover:border-cyan-500/40 hover:bg-slate-900 transition cursor-pointer flex flex-col group"
            >
              <div className="relative h-44 overflow-hidden bg-slate-800">
                <img
                  src={c.thumbnail}
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-cyan-300 border border-cyan-500/30">
                    {c.exam}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                    c.access_type === 'FREE' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                  }`}>
                    {c.access_type === 'FREE' ? 'FREE' : 'ANNUAL PASS'}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition line-clamp-2">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>{c.modules_count || 2} Modules</span>
                  <span className="text-cyan-400 font-semibold flex items-center space-x-1">
                    <span>View Syllabus</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. MOCK TESTS & TEST SERIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Real Exam Simulation</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Mock Tests & Test Engine</h2>
            <p className="text-sm text-slate-400 mt-1">Practice timed tests with negative marking, bilingual toggle and instant score breakdown.</p>
          </div>
          <button
            onClick={() => navigate('/tests')}
            className="mt-3 sm:mt-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Explore All Tests</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {t.exam}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {t.type}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.access_type === 'FREE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {t.access_type === 'FREE' ? 'FREE TEST' : 'ANNUAL PASS'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{t.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t.description}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs py-3 px-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div>
                    <div className="text-slate-500 text-[10px]">DURATION</div>
                    <div className="text-white font-semibold">{t.duration_minutes} Mins</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">TOTAL MARKS</div>
                    <div className="text-white font-semibold">{t.total_marks}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">LANGUAGES</div>
                    <div className="text-cyan-400 font-semibold">EN / HI / MR</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs text-slate-400">Instant Detailed Solutions</span>
                <button
                  onClick={() => navigate(`/test/${t.id}`)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5"
                >
                  <span>Start Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. DIGITAL LIBRARY & E-INK MODE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Protected Document Viewer</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Digital Library & E-Ink Reader</h2>
            <p className="text-sm text-slate-400 mt-1">Curated study PDFs with dynamic anti-piracy watermarking and eye-comfort modes.</p>
          </div>
          <button
            onClick={() => navigate('/library')}
            className="mt-3 sm:mt-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Browse Library</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pdfs.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/reader/${p.id}`)}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {p.exam}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.access_type === 'FREE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {p.access_type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition line-clamp-2">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
                <div className="flex items-center space-x-3 text-xs text-slate-400 pt-2">
                  <span>{p.page_count} Pages</span>
                  <span>•</span>
                  <span>{p.file_size}</span>
                  <span>•</span>
                  <span className="uppercase text-cyan-400 font-mono">{p.language}</span>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-semibold">
                <span className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open in E-Ink Reader</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. WHY TECHCLASS? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Our Architectural Edge</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Competitive Exam Aspirants Choose TechClass</h2>
          <p className="text-sm text-slate-400">Crafted specifically for Indian competitive exams with zero distractions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">True Trilingual Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Not automated machine translation. Each question is manually translated and verified in Marathi, Hindi, and English so state and central aspirants don't lose precious marks over translation ambiguities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Mobile-First & PWA Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Over 85% of Indian aspirants study on smartphones. TechClass is engineered with tap targets, bottom navigation, minimal bandwidth usage, and installable PWA compliance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Specialized E-Ink Reading Mode</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Read digital notes for hours without eye strain. Warm paper contrast, distraction-free layout, and adjustable typography emulate reading actual physical reference books.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Dynamic Watermark Protection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Private study material is stamped with your personal Student ID and licensing details. Protects authors and ensures a serious, focused student community.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Weak-Topic Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detailed performance metrics after every mock test highlight your strong vs weak subjects (e.g. Maharashtra GK, Quantitative Aptitude) with actionable recommendations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Dedicated WhatsApp Desk</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paid members get direct WhatsApp support (+91 7770032149) for quick resolution of study material questions, test doubts, and account assistance.
            </p>
          </div>
        </div>
      </section>

      {/* 8. HOW TECHCLASS WORKS (10 Visual Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">The Aspirant Roadmap</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How TechClass Works</h2>
          <p className="text-sm text-slate-400">From free onboarding to examination readiness in 10 seamless steps.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Register Free', desc: 'Get your permanent Student ID (e.g. TC100001).' },
            { step: '02', title: 'Explore Free Content', desc: 'Experience 3 mock tests & sample notes.' },
            { step: '03', title: 'Choose Your Exam', desc: 'Select MPSC, UPSC, SSC, Banking or Police Bharti.' },
            { step: '04', title: 'Upgrade to Annual Pass', desc: 'Access full digital classroom at ₹2,999/yr.' },
            { step: '05', title: 'Pay Using UPI', desc: 'Scan official QR with GPay, PhonePe or Paytm.' },
            { step: '06', title: 'Submit UTR', desc: 'Enter your 12-digit transaction reference.' },
            { step: '07', title: 'Admin Verification', desc: 'Our team verifies payment in bank records.' },
            { step: '08', title: 'Confirmation Email', desc: 'Receive official invoice and activation email.' },
            { step: '09', title: 'Premium Unlocked', desc: 'All tests, E-Ink PDFs & WhatsApp support live.' },
            { step: '10', title: 'Study & Crack Exam', desc: 'Track study streak, analyze scores and succeed.' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 relative">
              <div className="text-cyan-400 font-mono text-sm font-bold">{item.step}</div>
              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FREE VS PREMIUM COMPARISON TABLE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Clear Access Matrix</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Free Account vs TechClass Annual Pass</h2>
          <p className="text-sm text-slate-400">Everything you need to prepare with confidence and structure.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="grid grid-cols-3 bg-slate-950 p-4 border-b border-slate-800 text-sm font-bold">
            <div className="text-slate-300">Feature</div>
            <div className="text-center text-slate-300">Free Student</div>
            <div className="text-center text-cyan-400">Annual Pass (₹{price})</div>
          </div>

          {[
            { name: 'Selected Mock Tests', free: '3 Full Tests', paid: 'Unlimited All Year' },
            { name: 'Previous-Year Solved Papers (PYQs)', free: 'Sample Questions', paid: 'Complete 10-Year Archive' },
            { name: 'Full Video Courses & Lessons', free: 'Module Previews', paid: 'Full Access to All Modules' },
            { name: 'Digital Library & Study PDFs', free: 'Selected Free Notes', paid: 'Complete Protected Library' },
            { name: 'E-Ink Reading Mode', free: '✓ Available', paid: '✓ Unlimited with Watermark' },
            { name: 'Multilingual Toggle (EN/HI/MR)', free: '✓ Supported', paid: '✓ Supported' },
            { name: 'Performance Analytics & Ranks', free: 'Basic Scorecard', paid: 'Full Subject & Percentile' },
            { name: 'Personal Bookmarks & Notes', free: 'Limited (5 items)', paid: 'Unlimited' },
            { name: 'Priority WhatsApp Student Support', free: '—', paid: '✓ Dedicated +91 7770032149' }
          ].map((row, i) => (
            <div key={i} className={`grid grid-cols-3 p-4 text-xs border-b border-slate-800/60 items-center ${i % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/60'}`}>
              <div className="font-medium text-slate-200">{row.name}</div>
              <div className="text-center text-slate-400">{row.free}</div>
              <div className="text-center font-semibold text-cyan-300">{row.paid}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. ANNUAL MEMBERSHIP HERO CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-cyan-950 via-slate-900 to-blue-950 border-2 border-cyan-500/50 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            <Zap className="w-3.5 h-3.5" />
            <span>ANNUAL ALL-ACCESS MEMBERSHIP</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            TechClass Annual Pass
          </h2>

          <div className="flex items-baseline justify-center space-x-2">
            <span className="text-5xl sm:text-6xl font-black text-cyan-400">₹{price}</span>
            <span className="text-slate-300 text-base font-semibold">/ year</span>
          </div>

          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            One simple, affordable subscription unlocks all government exam courses, full-length multilingual mock tests, digital library PDFs, and active WhatsApp student support for an entire year.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/pricing')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 transition flex items-center justify-center space-x-2"
            >
              <span>Get Annual Access (UPI + UTR)</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-semibold text-slate-300 hover:text-white border border-slate-700 bg-slate-950/60"
            >
              View UPI Instructions
            </button>
          </div>

          <div className="pt-4 text-xs text-slate-400 flex items-center justify-center space-x-4">
            <span>• Manual UPI Verification</span>
            <span>• Instant Student ID Watermark</span>
            <span>• WhatsApp Support Included</span>
          </div>
        </div>
      </section>

      {/* 11. TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Aspirant Feedback</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Trusted by Candidates Across Maharashtra & India</h2>
          <p className="text-sm text-slate-400">Read what serious aspirants say about the TechClass experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "The Marathi translations in MPSC mock tests are top-notch. Usually other platforms use bad machine translation, but TechClass questions match the exact terminology used by MPSC examiners."
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-cyan-600/30 flex items-center justify-center text-xs font-bold text-cyan-400 font-mono">
                RD
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Rahul Deshmukh</h4>
                <p className="text-[10px] text-slate-400">MPSC Rajyaseva Aspirant • Pune</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "E-Ink reading mode in the digital library is a game changer. I read the Indian Polity revision notes during commute on my smartphone without getting eye fatigue."
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-xs font-bold text-blue-400 font-mono">
                PS
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Pooja Sharma</h4>
                <p className="text-[10px] text-slate-400">UPSC & SSC Candidate • Delhi</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "The manual UPI verification was very transparent. I submitted my UTR number in the morning and by afternoon my account was verified with a proper invoice sent to my email."
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 flex items-center justify-center text-xs font-bold text-emerald-400 font-mono">
                VK
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Vikas Kadam</h4>
                <p className="text-[10px] text-slate-400">Police Bharti Aspirant • Nashik</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Frequently Asked Questions</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Got Questions? We Have Answers.</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden transition"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full p-4 text-left font-semibold text-sm text-slate-200 hover:text-white flex items-center justify-between"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 transform transition ${faqOpen === i ? 'rotate-90 text-cyan-400' : 'text-slate-500'}`} />
              </button>
              {faqOpen === i && (
                <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 13. CONTACT & OFFICIAL SUPPORT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Get in Touch</span>
            <h3 className="text-xl font-bold text-white mt-1">Official Student Helpdesk</h3>
            <p className="text-xs text-slate-400 mt-2">
              Our administration and support desk responds to email and payment inquiries promptly.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-slate-400">Official DynoDazzle Email:</div>
            <a href="mailto:dynodazzle@gmail.com" className="text-sm font-mono font-bold text-cyan-400 hover:underline block">
              dynodazzle@gmail.com
            </a>
            <div className="text-[10px] text-slate-500">For general queries, refunds and inquiries.</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
            <div className="text-[11px] text-slate-400">Paid Member WhatsApp Desk:</div>
            <a href="https://wa.me/917770032149" target="_blank" rel="noreferrer" className="text-sm font-mono font-bold text-emerald-400 hover:underline block">
              +91 7770032149
            </a>
            <div className="text-[10px] text-slate-500">Exclusively for active Annual Pass students.</div>
          </div>
        </div>
      </section>
    </div>
  );
};
