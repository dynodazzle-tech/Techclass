import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PdfDocument, PdfPage } from '../types';
import { apiFetch } from '../lib/api';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
  ShieldCheck,
  Eye,
  Sun,
  Moon,
  Coffee,
  AlertTriangle,
  ArrowLeft,
  Lock,
  Maximize2,
  FileText,
  Crown
} from 'lucide-react';

interface ReaderPageProps {
  pdfId: string;
  navigate: (path: string) => void;
}

type ReaderTheme = 'EINK' | 'DARK' | 'SEPIA';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export const ReaderPage: React.FC<ReaderPageProps> = ({ pdfId, navigate }) => {
  const { token, user } = useAuth();
  const { t } = useLanguage();

  const [doc, setDoc] = useState<PdfDocument | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<ReaderTheme>('EINK');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [zoom, setZoom] = useState(100);
  const [tabWarning, setTabWarning] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);

  // Fetch document & page content
  useEffect(() => {
    setLoading(true);
    apiFetch<PdfDocument & { pages?: PdfPage[] }>(`/api/library/items/${pdfId}`)
      .then(data => {
        setDoc(data);
        if (data.pages && Array.isArray(data.pages)) {
          setPages(data.pages);
          setTotalPages(data.pages.length);
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to open document');
      })
      .finally(() => setLoading(false));
  }, [pdfId, token]);

  // Tab switch & screenshot deterrence
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarning(true);
      } else {
        setTimeout(() => setTabWarning(false), 2500);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept print (Ctrl+P or Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setSecurityToast('Printing is restricted for protected digital study materials.');
        setTimeout(() => setSecurityToast(null), 3000);
      }
      // Intercept save (Ctrl+S or Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setSecurityToast('Direct download is protected. Use the online reader to study.');
        setTimeout(() => setSecurityToast(null), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleBookmark = async () => {
    if (!token) {
      setSecurityToast('Please login to save bookmarks.');
      setTimeout(() => setSecurityToast(null), 2500);
      return;
    }
    try {
      await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          item_type: 'PDF',
          item_id: pdfId,
          notes: `Page ${currentPage} of ${doc?.title}`
        })
      });
      setBookmarked(true);
      setSecurityToast(`Saved Page ${currentPage} to your Bookmarks!`);
      setTimeout(() => setSecurityToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading protected document and stamping security watermark...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Lock className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">{error || 'Access Restricted'}</h2>
        <p className="text-xs text-slate-400">
          This digital PDF is part of the TechClass Annual Pass catalog.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
          >
            Back to Library
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
          >
            Get Annual Pass (₹2,999)
          </button>
        </div>
      </div>
    );
  }

  const activePageData = pages.find(p => p.page_num === currentPage) || pages[0] || {
    page_num: 1,
    title: doc.title,
    content: doc.description
  };

  // Personalized dynamic watermark string
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.email === 'admin@techclass.in' || user?.email === 'dynodazzle@gmail.com';
  const studentName = user?.full_name || (isAdmin ? 'TechClass Owner & Administrator' : 'Registered Aspirant');
  const studentId = user?.student_id || 'TC100001';
  const watermarkText = isAdmin
    ? `TECHCLASS • APP OWNER & SUPER ADMIN: ${studentName.toUpperCase()} • FULL MASTER ACCESS • DO NOT DISTRIBUTE`
    : `TECHCLASS • LICENSED TO: ${studentName.toUpperCase()} • ID: ${studentId} • DO NOT DISTRIBUTE`;

  // Reader theme styles
  let containerBg = 'bg-[#fcfaf2] text-[#1c1917]'; // E-Ink Paper
  let pageSheetBg = 'bg-[#fffef9] text-[#1c1917] border-[#e7e0d0] shadow-sm';
  let fontFam = 'font-serif';

  if (theme === 'DARK') {
    containerBg = 'bg-slate-950 text-slate-100';
    pageSheetBg = 'bg-slate-900 text-slate-100 border-slate-800 shadow-xl';
    fontFam = 'font-sans';
  } else if (theme === 'SEPIA') {
    containerBg = 'bg-[#f4ecd8] text-[#433422]';
    pageSheetBg = 'bg-[#faf4e6] text-[#433422] border-[#e4d8be] shadow-sm';
    fontFam = 'font-serif';
  }

  const fontSizeClass = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose'
  }[fontSize];

  return (
    <div className={`min-h-screen flex flex-col select-none transition-colors duration-200 ${containerBg}`}>
      {/* Top Toolbar */}
      <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/library')}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
              title="Return to Library"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                {doc.title}
              </h1>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                <span className="text-cyan-400 font-mono">{doc.exam}</span>
                <span>•</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Reading Mode Switcher */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setTheme('EINK')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center space-x-1 transition ${
                  theme === 'EINK' ? 'bg-amber-100 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="E-Ink High Contrast Paper Mode"
              >
                <Sun className="w-3 h-3" />
                <span className="hidden sm:inline">E-Ink</span>
              </button>
              <button
                onClick={() => setTheme('SEPIA')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center space-x-1 transition ${
                  theme === 'SEPIA' ? 'bg-[#d8c3a5] text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Warm Eye Comfort Mode"
              >
                <Coffee className="w-3 h-3" />
                <span className="hidden sm:inline">Eye Care</span>
              </button>
              <button
                onClick={() => setTheme('DARK')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center space-x-1 transition ${
                  theme === 'DARK' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Dark Reading Mode"
              >
                <Moon className="w-3 h-3" />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            {/* Font Size controls */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1 font-bold ${fontSize === 'sm' ? 'text-cyan-400' : ''}`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1 font-bold ${fontSize === 'base' ? 'text-cyan-400' : ''}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1 font-bold ${fontSize === 'lg' ? 'text-cyan-400' : ''}`}
              >
                A+
              </button>
            </div>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg border transition ${
                bookmarked
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Bookmark Page"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Security Toast notification */}
      {securityToast && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-semibold shadow-2xl flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>{securityToast}</span>
        </div>
      )}

      {/* Tab Switch Warning Overlay */}
      {tabWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="text-center space-y-3 max-w-sm">
            <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
            <h3 className="text-base font-bold text-white">Protected Document Secured</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Display resumed. Watermarked exclusively for Student <strong className="text-cyan-300 font-mono">{studentId}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main Document Reading Canvas */}
      <main
        onContextMenu={(e) => e.preventDefault()}
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col justify-between"
      >
        {/* The Paper Sheet */}
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className={`relative rounded-2xl border p-8 sm:p-14 min-h-[75vh] flex flex-col justify-between transition duration-200 overflow-hidden ${pageSheetBg} ${fontFam}`}
        >
          {/* Dynamic Visible Repeating Diagonal Watermark */}
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-around opacity-[0.07] overflow-hidden select-none">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="transform -rotate-12 text-center text-xs sm:text-sm font-mono font-black tracking-widest uppercase whitespace-nowrap"
              >
                {watermarkText} • PAGE {currentPage} OF {totalPages}
              </div>
            ))}
          </div>

          {/* Page Top Header */}
          <div className="relative z-10 flex items-center justify-between pb-6 border-b border-current/10 text-xs opacity-75">
            <span className="font-semibold tracking-wide uppercase">{doc.subject}</span>
            <span className="font-mono">{doc.title}</span>
          </div>

          {/* Page Body Content */}
          <div className={`relative z-10 py-8 space-y-6 ${fontSizeClass}`}>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {activePageData.title}
            </h2>

            <div className="space-y-4 whitespace-pre-line">
              {activePageData.content}
            </div>

            {/* Note box inside document */}
            <div className="p-4 rounded-xl border border-current/20 bg-current/5 text-xs space-y-1 my-4">
              <div className="font-bold flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Examiner's Reference & Key Takeaway</span>
              </div>
              <p className="opacity-80">
                Questions from this section have appeared consistently in MPSC Rajyaseva and Combined examinations from 2021 to 2025.
              </p>
            </div>
          </div>

          {/* Page Footer */}
          <div className="relative z-10 pt-6 border-t border-current/10 flex items-center justify-between text-xs opacity-75">
            <span className="font-mono text-[10px]">
              {isAdmin ? `Super Admin & App Owner: ${studentName} (Full Access)` : `Licensed to: ${studentName} (${studentId})`}
            </span>
            <span className="font-bold">Page {currentPage}</span>
          </div>
        </div>

        {/* Bottom Page Navigation Controls */}
        <div className="mt-8 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm border border-slate-800 text-white rounded-2xl p-4 shadow-xl">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Page</span>
          </button>

          <div className="flex items-center space-x-3 text-xs font-mono text-slate-300">
            <span>Page</span>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-cyan-400 font-bold focus:outline-none"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <span>of {totalPages}</span>
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <span>Next Page</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};
