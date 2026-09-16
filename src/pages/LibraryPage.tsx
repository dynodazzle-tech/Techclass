import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PdfDocument } from '../types';
import { apiFetch } from '../lib/api';
import {
  Library,
  FileText,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowRight,
  BookOpen,
  Crown,
  CheckCircle2
} from 'lucide-react';

interface LibraryPageProps {
  navigate: (path: string) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ navigate }) => {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [docs, setDocs] = useState<PdfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState('ALL');
  const [selectedAccess, setSelectedAccess] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    let url = '/api/library/items?';
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    if (selectedExam !== 'ALL') url += `exam=${encodeURIComponent(selectedExam)}&`;
    if (selectedAccess !== 'ALL') url += `access_type=${encodeURIComponent(selectedAccess)}&`;

    apiFetch<PdfDocument[]>(url)
      .then(data => {
        if (Array.isArray(data)) setDocs(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [searchQuery, selectedExam, selectedAccess, token]);

  const exams = ['ALL', 'MPSC', 'UPSC', 'SSC', 'General Studies'];
  const accessFilters = ['ALL', 'FREE', 'MEMBERSHIP'];

  const isOwnerOrAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.email === 'admin@techclass.in' || user?.email === 'dynodazzle@gmail.com';
  const isPaid = user?.membership_status === 'ACTIVE' || user?.role === 'PAID_STUDENT' || isOwnerOrAdmin;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <Library className="w-3.5 h-3.5" />
          <span>Protected Study Archive & E-Ink Reader</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">TechClass Digital Library</h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Read curated government exam notes, previous-year question banks, and concise revision summaries protected with your personalized watermark in specialized E-Ink Paper Mode.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by subject, topic or exam..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold">Exam:</span>
            {exams.map(e => (
              <button
                key={e}
                onClick={() => setSelectedExam(e)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedExam === e
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {e === 'ALL' ? 'All Exams' : e}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Access:</span>
            {accessFilters.map(acc => (
              <button
                key={acc}
                onClick={() => setSelectedAccess(acc)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedAccess === acc
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {acc === 'ALL' ? 'All Tiers' : acc === 'FREE' ? 'Free PDFs' : 'Annual Pass'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of PDFs */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading library documents...</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          No documents found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map(doc => {
            const hasAccess = doc.access_type === 'FREE' || isPaid || !!doc.is_unlocked;
            const needsUpgrade = !hasAccess;

            return (
              <div
                key={doc.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 hover:bg-slate-900 transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {doc.exam}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {isOwnerOrAdmin && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center space-x-1">
                          <Crown className="w-2.5 h-2.5 text-purple-400" />
                          <span>Owner Access</span>
                        </span>
                      )}
                      {doc.is_unlocked && !isOwnerOrAdmin && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Purchased</span>
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.access_type === 'FREE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        {doc.access_type === 'FREE' ? 'FREE PDF' : 'ANNUAL PASS'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-2">{doc.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{doc.description}</p>

                  <div className="flex items-center space-x-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{doc.page_count} Pages</span>
                    </span>
                    <span>•</span>
                    <span>{doc.file_size}</span>
                    <span>•</span>
                    <span className="font-mono text-cyan-300 uppercase">{doc.language}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Watermarked</span>
                  </span>

                  {needsUpgrade ? (
                    <button
                      onClick={() => navigate('/pricing')}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center space-x-1"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock Pass</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/reader/${doc.id}`)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5 shadow-md shadow-cyan-500/10"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read Online</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
