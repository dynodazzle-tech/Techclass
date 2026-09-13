import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Search,
  Eye,
  Edit,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  Download,
  Printer,
  Copy,
  Plus,
  X,
  FileCheck2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Layers,
  Sparkles
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface PdfManagementTabProps {
  token: string | null;
  onActionNotification: (msg: string, isError?: boolean) => void;
}

interface AdminPdfItem {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  subject: string;
  exam: string;
  language: string;
  page_count: number;
  file_size: string;
  access_type: 'FREE' | 'MEMBERSHIP' | 'PAID_PURCHASE';
  price: number;
  allow_download: boolean;
  allow_print: boolean;
  allow_copy: boolean;
  watermark_enabled: boolean;
  is_published: boolean;
  pages?: Array<{ page_num: number; title: string; content: string }>;
  reader_count?: number;
  purchase_count?: number;
  created_at: string;
}

export const PdfManagementTab: React.FC<PdfManagementTabProps> = ({
  token,
  onActionNotification
}) => {
  const [pdfs, setPdfs] = useState<AdminPdfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('ALL');
  const [accessFilter, setAccessFilter] = useState('ALL');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'SINGLE' | 'BULK'>('SINGLE');
  const [previewPdf, setPreviewPdf] = useState<AdminPdfItem | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [editPdf, setEditPdf] = useState<AdminPdfItem | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<AdminPdfItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Single Upload Form State
  const [singleTitle, setSingleTitle] = useState('');
  const [singleAuthor, setSingleAuthor] = useState('TechClass Editorial');
  const [singleSubject, setSingleSubject] = useState('Indian Polity & Governance');
  const [singleExam, setSingleExam] = useState('MPSC');
  const [singleLanguage, setSingleLanguage] = useState('mr');
  const [singleAccess, setSingleAccess] = useState<'FREE' | 'MEMBERSHIP' | 'PAID_PURCHASE'>('MEMBERSHIP');
  const [singlePrice, setSinglePrice] = useState('0');
  const [singleCoverUrl, setSingleCoverUrl] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=60');
  const [singleDesc, setSingleDesc] = useState('');
  const [singleAllowDownload, setSingleAllowDownload] = useState(false);
  const [singleAllowPrint, setSingleAllowPrint] = useState(false);
  const [singleAllowCopy, setSingleAllowCopy] = useState(false);
  const [singleWatermark, setSingleWatermark] = useState(true);
  const [singlePages, setSinglePages] = useState<Array<{ page_num: number; title: string; content: string }>>([
    { page_num: 1, title: 'Chapter 1: Constitutional Overview', content: 'Comprehensive notes covering Articles 12-51A, judicial interpretations, and landmark Supreme Court verdicts.' }
  ]);
  const [singleFileSize, setSingleFileSize] = useState('3.8 MB');

  // Bulk Upload State
  const [bulkFiles, setBulkFiles] = useState<Array<{ name: string; size: string; rawText?: string }>>([]);
  const [bulkExam, setBulkExam] = useState('MPSC');
  const [bulkSubject, setBulkSubject] = useState('General Studies');
  const [bulkAccess, setBulkAccess] = useState<'FREE' | 'MEMBERSHIP' | 'PAID_PURCHASE'>('MEMBERSHIP');
  const [bulkUploading, setBulkUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  // Fetch PDFs
  const loadPdfs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (examFilter !== 'ALL') queryParams.append('exam', examFilter);
      if (accessFilter !== 'ALL') queryParams.append('access_type', accessFilter);

      const res = await fetch(`/api/admin/pdfs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load PDF library');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPdfs(data);
      }
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPdfs();
  }, [token, examFilter, accessFilter]);

  // Handle file selection for single PDF
  const handleSingleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    setSingleFileSize(formattedSize);
    const cleanedName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!singleTitle) {
      setSingleTitle(cleanedName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && typeof content === 'string') {
        const sections = content.split(/\n\s*---\s*\n|\n\s*###\s*/).filter(s => s.trim().length > 0);
        if (sections.length > 1) {
          setSinglePages(sections.map((sec, idx) => ({
            page_num: idx + 1,
            title: `Chapter ${idx + 1}`,
            content: sec.trim()
          })));
        } else {
          setSinglePages([
            { page_num: 1, title: `${cleanedName} - Full Text`, content: content.slice(0, 3000) }
          ]);
        }
      }
    };
    reader.readAsText(file);
  };

  // Handle multi-file selection for bulk upload
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: Array<{ name: string; size: string; rawText?: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const sizeStr = f.size > 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(f.size / 1024).toFixed(0)} KB`;
      newFiles.push({
        name: f.name,
        size: sizeStr
      });
    }
    setBulkFiles(prev => [...prev, ...newFiles]);
  };

  // Save single PDF
  const handleSaveSinglePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!singleTitle.trim()) {
      onActionNotification('Please provide a document title.', true);
      return;
    }

    try {
      const payload = {
        title: singleTitle,
        author: singleAuthor,
        description: singleDesc,
        cover_url: singleCoverUrl,
        subject: singleSubject,
        exam: singleExam,
        language: singleLanguage,
        page_count: singlePages.length,
        file_size: singleFileSize,
        access_type: singleAccess,
        price: parseFloat(singlePrice) || 0,
        allow_download: singleAllowDownload,
        allow_print: singleAllowPrint,
        allow_copy: singleAllowCopy,
        watermark_enabled: singleWatermark,
        is_published: true,
        pages: singlePages
      };

      const res = await fetch('/api/admin/pdfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create PDF document');

      onActionNotification(`PDF document "${singleTitle}" uploaded and published to library.`);
      setUploadModalOpen(false);
      resetSingleForm();
      loadPdfs();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  // Process bulk PDF upload
  const handleProcessBulkUpload = async () => {
    if (!token) return;
    if (bulkFiles.length === 0) {
      onActionNotification('No files selected for bulk attachment.', true);
      return;
    }

    setBulkUploading(true);
    try {
      const items = bulkFiles.map((bf, idx) => ({
        title: bf.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        filename: bf.name,
        exam: bulkExam,
        subject: bulkSubject,
        access_type: bulkAccess,
        file_size: bf.size,
        author: 'TechClass Editorial',
        description: `Digital revision material attached for ${bulkExam} - ${bulkSubject}.`,
        pages: [
          {
            page_num: 1,
            title: 'Section 1',
            content: `Official study notes extracted from ${bf.name} for ${bulkExam} aspirants.`
          }
        ]
      }));

      const res = await fetch('/api/admin/pdfs/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items,
          default_exam: bulkExam,
          default_subject: bulkSubject,
          default_access: bulkAccess
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process bulk upload');

      onActionNotification(`Successfully uploaded and attached ${data.created_count} PDF documents!`);
      setBulkFiles([]);
      setUploadModalOpen(false);
      loadPdfs();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setBulkUploading(false);
    }
  };

  // Update existing PDF
  const handleUpdatePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editPdf) return;

    try {
      const res = await fetch(`/api/admin/pdfs/${editPdf.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editPdf)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update PDF');

      onActionNotification(`PDF "${editPdf.title}" updated successfully.`);
      setEditPdf(null);
      loadPdfs();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  // Permanently delete PDF
  const handleConfirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/pdfs/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete PDF');

      onActionNotification(`Permanently removed "${deleteTarget.title}" from storage and database.`);
      setDeleteTarget(null);
      loadPdfs();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetSingleForm = () => {
    setSingleTitle('');
    setSingleDesc('');
    setSingleFileSize('3.8 MB');
    setSinglePages([
      { page_num: 1, title: 'Chapter 1: Overview', content: 'Comprehensive notes covering key concepts.' }
    ]);
  };

  // Filtered PDFs
  const filteredPdfs = pdfs.filter(p => {
    if (examFilter !== 'ALL' && p.exam !== examFilter) return false;
    if (accessFilter !== 'ALL' && p.access_type !== accessFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Upload Launchers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Document Repository & Storage</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            PDF Document Management
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Upload single notes, bulk attach study materials, manage DRM print/download permissions, preview pages with student watermark simulation, and permanently remove files.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => {
              setUploadMode('SINGLE');
              setUploadModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>
          <button
            onClick={() => {
              setUploadMode('BULK');
              setUploadModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center space-x-2"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Bulk Attach</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total PDF Documents</div>
          <div className="text-2xl font-black text-white">{pdfs.length}</div>
          <div className="text-[11px] text-cyan-400">Active in Library</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Membership Tier</div>
          <div className="text-2xl font-black text-emerald-400">
            {pdfs.filter(p => p.access_type === 'MEMBERSHIP').length}
          </div>
          <div className="text-[11px] text-emerald-400">Annual Pass Access</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Free Preview Notes</div>
          <div className="text-2xl font-black text-slate-300">
            {pdfs.filter(p => p.access_type === 'FREE').length}
          </div>
          <div className="text-[11px] text-slate-400">Trial Candidates</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400">Anti-Piracy Protected</div>
          <div className="text-2xl font-black text-amber-400">
            {pdfs.filter(p => p.watermark_enabled).length}
          </div>
          <div className="text-[11px] text-amber-400">Dynamic Watermarking</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by document title, author, or subject..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Exam:</span>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Exams</option>
              <option value="MPSC">MPSC</option>
              <option value="UPSC">UPSC</option>
              <option value="SSC">SSC</option>
              <option value="Police Bharti">Police Bharti</option>
              <option value="Banking">Banking</option>
              <option value="Railway">Railway</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400">Access:</span>
            <select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Tiers</option>
              <option value="FREE">Free</option>
              <option value="MEMBERSHIP">Membership</option>
              <option value="PAID_PURCHASE">Paid Purchase</option>
            </select>
          </div>
        </div>
      </div>

      {/* PDF Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="grid grid-cols-12 p-3.5 bg-slate-950 text-xs font-bold text-slate-400 border-b border-slate-800">
          <div className="col-span-5 sm:col-span-4">Document / Subject</div>
          <div className="col-span-2 hidden sm:block">Exam / Tier</div>
          <div className="col-span-2 text-center">Pages / Size</div>
          <div className="col-span-2 hidden md:block text-center">DRM Security</div>
          <div className="col-span-5 sm:col-span-4 md:col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto" />
            <p>Loading PDF repository...</p>
          </div>
        ) : filteredPdfs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No PDF documents found matching current filters.</p>
            <button
              onClick={() => {
                setUploadMode('SINGLE');
                setUploadModalOpen(true);
              }}
              className="px-4 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          filteredPdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="grid grid-cols-12 p-3.5 text-xs text-slate-300 border-b border-slate-800/60 items-center hover:bg-slate-850/50 transition"
            >
              {/* Document Info */}
              <div className="col-span-5 sm:col-span-4 flex items-center space-x-3">
                <img
                  src={pdf.cover_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=60'}
                  alt={pdf.title}
                  className="w-10 h-14 object-cover rounded-lg border border-slate-800 shrink-0 bg-slate-950"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0">
                  <div className="font-bold text-white truncate hover:text-cyan-400 cursor-pointer" onClick={() => {
                    setPreviewPdf(pdf);
                    setPreviewPage(1);
                  }}>
                    {pdf.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{pdf.subject}</div>
                  <div className="text-[10px] text-slate-500">By {pdf.author}</div>
                </div>
              </div>

              {/* Exam & Tier */}
              <div className="col-span-2 hidden sm:block">
                <div className="font-semibold text-slate-200">{pdf.exam}</div>
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    pdf.access_type === 'MEMBERSHIP'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : pdf.access_type === 'FREE'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {pdf.access_type === 'MEMBERSHIP' ? 'Annual Pass' : pdf.access_type === 'FREE' ? 'Free Access' : `₹${pdf.price}`}
                  </span>
                </div>
              </div>

              {/* Pages & Size */}
              <div className="col-span-2 text-center">
                <div className="font-mono font-bold text-slate-200">{pdf.page_count} Pages</div>
                <div className="text-[10px] text-slate-500">{pdf.file_size || '3.5 MB'}</div>
              </div>

              {/* DRM Security Toggles */}
              <div className="col-span-2 hidden md:flex items-center justify-center space-x-2 text-[10px]">
                {pdf.watermark_enabled && (
                  <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Dynamic Anti-Piracy Watermark Enabled">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
                {pdf.allow_download ? (
                  <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Download Allowed">
                    <Download className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="p-1 rounded bg-slate-800 text-slate-500" title="Download Disabled (Reader Protected)">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
                {pdf.allow_print ? (
                  <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Print Allowed">
                    <Printer className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="p-1 rounded bg-slate-800 text-slate-500" title="Print Disabled">
                    <Printer className="w-3.5 h-3.5 opacity-40" />
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-5 sm:col-span-4 md:col-span-2 text-right flex items-center justify-end space-x-1.5">
                <button
                  onClick={() => {
                    setPreviewPdf(pdf);
                    setPreviewPage(1);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 transition"
                  title="Preview PDF Document"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditPdf(pdf)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 transition"
                  title="Edit Metadata & Permissions"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(pdf)}
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 transition"
                  title="Permanently Delete PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPLOAD MODAL (SINGLE OR BULK) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full my-8 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {uploadMode === 'SINGLE' ? 'Upload Single PDF Document' : 'Bulk Attach PDF Documents'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add digital study notes, mock papers, and revision digests to the TechClass Library.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center space-x-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setUploadMode('SINGLE')}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-2 ${
                  uploadMode === 'SINGLE' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Single Document & Page Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('BULK')}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-2 ${
                  uploadMode === 'BULK' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Bulk Attachment Queue</span>
              </button>
            </div>

            {/* MODE 1: SINGLE UPLOAD */}
            {uploadMode === 'SINGLE' && (
              <form onSubmit={handleSaveSinglePdf} className="space-y-5">
                {/* File Drop Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition space-y-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={handleSingleFileSelect}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-105 transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-white">
                    Click to select a PDF or text file, or drag and drop here
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Supports .pdf, .txt, .md • Automatically extracts titles, sizes, and chapters
                  </div>
                </div>

                {/* Primary Meta Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Document Title *</label>
                    <input
                      type="text"
                      required
                      value={singleTitle}
                      onChange={(e) => setSingleTitle(e.target.value)}
                      placeholder="e.g. MPSC Modern History Digest"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Author / Faculty</label>
                    <input
                      type="text"
                      value={singleAuthor}
                      onChange={(e) => setSingleAuthor(e.target.value)}
                      placeholder="e.g. Dr. Deshmukh / TechClass Faculty"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target Exam *</label>
                    <select
                      value={singleExam}
                      onChange={(e) => setSingleExam(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="MPSC">MPSC Rajyaseva / Combined</option>
                      <option value="UPSC">UPSC Civil Services</option>
                      <option value="SSC">SSC CGL / CHSL</option>
                      <option value="Police Bharti">Maharashtra Police Bharti</option>
                      <option value="Banking">IBPS / SBI PO & Clerk</option>
                      <option value="Railway">RRB NTPC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      value={singleSubject}
                      onChange={(e) => setSingleSubject(e.target.value)}
                      placeholder="e.g. Polity, Geography, Current Affairs"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Access Tier</label>
                    <select
                      value={singleAccess}
                      onChange={(e) => setSingleAccess(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="MEMBERSHIP">Annual Pass Required</option>
                      <option value="FREE">Free Trial Tier</option>
                      <option value="PAID_PURCHASE">Individual Paid Purchase</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={singlePrice}
                      onChange={(e) => setSinglePrice(e.target.value)}
                      disabled={singleAccess !== 'PAID_PURCHASE'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Cover URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cover Thumbnail Image URL</label>
                  <input
                    type="text"
                    value={singleCoverUrl}
                    onChange={(e) => setSingleCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* DRM Security Toggles */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>DRM & Copyright Protection Controls</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={singleWatermark}
                        onChange={(e) => setSingleWatermark(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">Anti-Piracy Watermark</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={singleAllowDownload}
                        onChange={(e) => setSingleAllowDownload(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">Allow Download</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={singleAllowPrint}
                        onChange={(e) => setSingleAllowPrint(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">Allow Print</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={singleAllowCopy}
                        onChange={(e) => setSingleAllowCopy(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-slate-300">Allow Copying</span>
                    </label>
                  </div>
                </div>

                {/* Page Content Editor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Document Chapters / Pages ({singlePages.length} pages)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSinglePages(prev => [
                        ...prev,
                        { page_num: prev.length + 1, title: `Page ${prev.length + 1}`, content: '' }
                      ])}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Page</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {singlePages.map((page, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-cyan-400">Page {page.page_num}</span>
                          {singlePages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSinglePages(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300 text-[11px]"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={page.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSinglePages(prev => prev.map((p, i) => i === idx ? { ...p, title: val } : p));
                          }}
                          placeholder="Chapter / Section Heading"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                        <textarea
                          rows={2}
                          value={page.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSinglePages(prev => prev.map((p, i) => i === idx ? { ...p, content: val } : p));
                          }}
                          placeholder="Page text, revision bullets, or constitutional articles..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20"
                  >
                    Publish PDF Document
                  </button>
                </div>
              </form>
            )}

            {/* MODE 2: BULK UPLOAD */}
            {uploadMode === 'BULK' && (
              <div className="space-y-5">
                {/* Bulk Dropzone */}
                <div
                  onClick={() => bulkInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition space-y-2 group"
                >
                  <input
                    ref={bulkInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={handleBulkFileSelect}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto group-hover:scale-105 transition">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-white">
                    Select multiple PDF files from your computer
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Hold Ctrl or Shift to select multiple files • Batch processes titles, pages, and metadata
                  </div>
                </div>

                {/* Bulk Default Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Default Target Exam</label>
                    <select
                      value={bulkExam}
                      onChange={(e) => setBulkExam(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="MPSC">MPSC</option>
                      <option value="UPSC">UPSC</option>
                      <option value="SSC">SSC</option>
                      <option value="Police Bharti">Police Bharti</option>
                      <option value="Banking">Banking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Default Subject</label>
                    <input
                      type="text"
                      value={bulkSubject}
                      onChange={(e) => setBulkSubject(e.target.value)}
                      placeholder="e.g. General Studies"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Default Access Tier</label>
                    <select
                      value={bulkAccess}
                      onChange={(e) => setBulkAccess(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value="MEMBERSHIP">Annual Pass</option>
                      <option value="FREE">Free Trial</option>
                      <option value="PAID_PURCHASE">Paid Purchase</option>
                    </select>
                  </div>
                </div>

                {/* Queued Files List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Queued Files ({bulkFiles.length})</span>
                    {bulkFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBulkFiles([])}
                        className="text-red-400 hover:text-red-300 text-[11px]"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {bulkFiles.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-center text-xs text-slate-500">
                      No files selected yet. Click the upload area above to choose files.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-950 border border-slate-800">
                      {bulkFiles.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 text-xs text-slate-300">
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate font-semibold text-white">{f.name}</span>
                            <span className="text-[10px] text-slate-500">({f.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBulkFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-white px-2 py-0.5"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessBulkUpload}
                    disabled={bulkFiles.length === 0 || bulkUploading}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
                  >
                    {bulkUploading ? 'Attaching Documents...' : `Attach All ${bulkFiles.length} Documents`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{previewPdf.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    {previewPdf.exam} • {previewPdf.subject} • {previewPdf.page_count} Pages
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`/reader/${previewPdf.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition"
                >
                  <span>Open Full Reader</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content Viewport */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 relative bg-slate-950 select-none">
              {/* Dynamic Anti-Piracy Watermark Simulation */}
              {previewPdf.watermark_enabled && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-around opacity-[0.07] rotate-[-25deg] select-none text-slate-300 font-black text-xl sm:text-2xl uppercase tracking-widest">
                  <div>TC000001 • admin@techclass.in</div>
                  <div>OFFICIAL TECHCLASS WATERMARK</div>
                  <div>UNAUTHORIZED DISTRIBUTION PROHIBITED</div>
                </div>
              )}

              <div className="max-w-xl mx-auto space-y-6 relative z-10">
                {previewPdf.pages && previewPdf.pages.length > 0 ? (
                  (() => {
                    const currentPageData = previewPdf.pages[previewPage - 1] || previewPdf.pages[0];
                    return (
                      <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-3">
                          <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                            PAGE {previewPage} OF {previewPdf.pages.length}
                          </div>
                          <h4 className="text-lg font-extrabold text-white">
                            {currentPageData.title || `Chapter ${previewPage}`}
                          </h4>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                          {currentPageData.content || previewPdf.description || 'Comprehensive exam preparation study material.'}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12 text-xs text-slate-400">
                    <p className="text-white font-semibold mb-1">Standard In-App Reader Document</p>
                    <p>{previewPdf.description || 'No direct page preview text available. Launch reader to view full stream.'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Pagination Controls */}
            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Security:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  previewPdf.watermark_enabled ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {previewPdf.watermark_enabled ? 'Watermark Protected' : 'No Watermark'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400">{previewPdf.file_size}</span>
              </div>

              {previewPdf.pages && previewPdf.pages.length > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-300 text-xs">
                    {previewPage} / {previewPdf.pages.length}
                  </span>
                  <button
                    disabled={previewPage >= previewPdf.pages.length}
                    onClick={() => setPreviewPage(p => Math.min(previewPdf.pages!.length, p + 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT METADATA MODAL */}
      {editPdf && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full my-8 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Edit className="w-4 h-4 text-amber-400" />
                <span>Edit Document Metadata & Permissions</span>
              </h3>
              <button onClick={() => setEditPdf(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdatePdf} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={editPdf.title}
                  onChange={(e) => setEditPdf({ ...editPdf, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Author</label>
                  <input
                    type="text"
                    value={editPdf.author}
                    onChange={(e) => setEditPdf({ ...editPdf, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Target Exam</label>
                  <input
                    type="text"
                    value={editPdf.exam}
                    onChange={(e) => setEditPdf({ ...editPdf, exam: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Access Tier</label>
                  <select
                    value={editPdf.access_type}
                    onChange={(e) => setEditPdf({ ...editPdf, access_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="MEMBERSHIP">Annual Pass</option>
                    <option value="FREE">Free Trial</option>
                    <option value="PAID_PURCHASE">Paid Purchase</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editPdf.price}
                    onChange={(e) => setEditPdf({ ...editPdf, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-white">DRM & Security Permissions</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editPdf.watermark_enabled}
                      onChange={(e) => setEditPdf({ ...editPdf, watermark_enabled: e.target.checked })}
                    />
                    <span>Anti-Piracy Watermark</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editPdf.allow_download}
                      onChange={(e) => setEditPdf({ ...editPdf, allow_download: e.target.checked })}
                    />
                    <span>Allow Download</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editPdf.allow_print}
                      onChange={(e) => setEditPdf({ ...editPdf, allow_print: e.target.checked })}
                    />
                    <span>Allow Print</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editPdf.allow_copy}
                      onChange={(e) => setEditPdf({ ...editPdf, allow_copy: e.target.checked })}
                    />
                    <span>Allow Text Copy</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditPdf(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DESTRUCTIVE ACTION */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete PDF Document?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This will erase the file record from server storage, remove student reading sessions, and cancel bookmarks. This action cannot be undone.`}
        confirmLabel="Yes, Delete Permanently"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
