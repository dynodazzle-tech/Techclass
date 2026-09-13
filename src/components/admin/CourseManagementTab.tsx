import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Video,
  FileText,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface CourseManagementTabProps {
  token: string | null;
  onActionNotification: (msg: string, isError?: boolean) => void;
}

interface AdminCourseItem {
  id: string;
  title: string;
  slug: string;
  exam: string;
  subject: string;
  description: string;
  thumbnail_url: string;
  language: string;
  access_type: 'FREE' | 'MEMBERSHIP' | 'PAID_PURCHASE';
  price: number;
  is_published: boolean;
  module_count?: number;
  lesson_count?: number;
  enrolled_count?: number;
  modules?: Array<{
    id?: string;
    title: string;
    order_index: number;
    lessons: Array<{
      id?: string;
      title: string;
      duration_minutes: number;
      is_free_preview: boolean;
      video_url?: string;
      content?: string;
    }>;
  }>;
}

export const CourseManagementTab: React.FC<CourseManagementTabProps> = ({
  token,
  onActionNotification
}) => {
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('ALL');

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<AdminCourseItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCourseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State for Creation
  const [title, setTitle] = useState('');
  const [exam, setExam] = useState('MPSC');
  const [subject, setSubject] = useState('General Studies');
  const [desc, setDesc] = useState('');
  const [language, setLanguage] = useState('mr');
  const [accessType, setAccessType] = useState<'FREE' | 'MEMBERSHIP' | 'PAID_PURCHASE'>('MEMBERSHIP');
  const [price, setPrice] = useState('1999');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=60');

  // Modules & Lessons Builder
  const [modules, setModules] = useState<Array<{
    title: string;
    lessons: Array<{ title: string; duration_minutes: number; is_free_preview: boolean; video_url: string }>;
  }>>([
    {
      title: 'Module 1: Orientation & Foundations',
      lessons: [
        { title: 'Syllabus Breakdown & Strategy', duration_minutes: 25, is_free_preview: true, video_url: '' },
        { title: 'Core Concepts Masterclass', duration_minutes: 45, is_free_preview: false, video_url: '' }
      ]
    }
  ]);

  const loadCourses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load courses');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCourses(data);
      }
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [token]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        title,
        slug,
        exam,
        subject,
        description: desc,
        thumbnail_url: thumbnail,
        language,
        access_type: accessType,
        price: parseFloat(price) || 0,
        is_published: true,
        modules: modules.map((m, mIdx) => ({
          title: m.title,
          order_index: mIdx + 1,
          lessons: m.lessons.map((l, lIdx) => ({
            title: l.title,
            duration_minutes: l.duration_minutes,
            is_free_preview: l.is_free_preview,
            video_url: l.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            content: 'Comprehensive lesson notes and revision reference materials.',
            order_index: lIdx + 1
          }))
        }))
      };

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');

      onActionNotification(`Course "${title}" created successfully with ${modules.length} modules!`);
      setCreateModalOpen(false);
      resetForm();
      loadCourses();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleTogglePublish = async (course: AdminCourseItem) => {
    if (!token) return;
    try {
      const updatedStatus = !course.is_published;
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_published: updatedStatus })
      });
      if (!res.ok) throw new Error('Failed to toggle status');

      onActionNotification(`Course "${course.title}" is now ${updatedStatus ? 'Published' : 'Draft'}.`);
      loadCourses();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete course');

      onActionNotification(`Permanently deleted course "${deleteTarget.title}".`);
      setDeleteTarget(null);
      loadCourses();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setModules([
      {
        title: 'Module 1: Foundations',
        lessons: [{ title: 'Overview & Strategy', duration_minutes: 20, is_free_preview: true, video_url: '' }]
      }
    ]);
  };

  const filteredCourses = courses.filter(c => {
    if (examFilter !== 'ALL' && c.exam !== examFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Academic Syllabus & Video Classes</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Course Management</h2>
          <p className="text-xs text-slate-400">
            Publish comprehensive video lectures, organize syllabus modules, and configure enrollment pricing.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-indigo-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by title or subject..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-slate-400">Filter Exam:</span>
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Exams</option>
            <option value="MPSC">MPSC</option>
            <option value="UPSC">UPSC</option>
            <option value="SSC">SSC</option>
            <option value="Police Bharti">Police Bharti</option>
            <option value="Banking">Banking</option>
          </select>
        </div>
      </div>

      {/* Courses Grid / Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="grid grid-cols-12 p-3.5 bg-slate-950 text-xs font-bold text-slate-400 border-b border-slate-800">
          <div className="col-span-6 sm:col-span-5">Course Title & Exam</div>
          <div className="col-span-2 hidden sm:block text-center">Modules / Lessons</div>
          <div className="col-span-2 text-center">Access / Fee</div>
          <div className="col-span-1 hidden md:block text-center">Status</div>
          <div className="col-span-4 sm:col-span-3 md:col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No courses found.</p>
          </div>
        ) : (
          filteredCourses.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-12 p-3.5 text-xs text-slate-300 border-b border-slate-800/60 items-center hover:bg-slate-850/50 transition"
            >
              <div className="col-span-6 sm:col-span-5 flex items-center space-x-3">
                <img
                  src={c.thumbnail_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=100&auto=format&fit=crop&q=60'}
                  alt={c.title}
                  className="w-12 h-10 object-cover rounded-lg border border-slate-800 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{c.title}</div>
                  <div className="text-[11px] text-slate-400 truncate">{c.exam} • {c.subject}</div>
                </div>
              </div>

              <div className="col-span-2 hidden sm:block text-center font-mono">
                <div>{c.module_count || (c.modules?.length || 0)} Modules</div>
                <div className="text-[10px] text-slate-500">{c.lesson_count || 0} Lessons</div>
              </div>

              <div className="col-span-2 text-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  c.access_type === 'MEMBERSHIP'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : c.access_type === 'FREE'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {c.access_type === 'MEMBERSHIP' ? 'Pass Included' : c.access_type === 'FREE' ? 'Free' : `₹${c.price}`}
                </span>
              </div>

              <div className="col-span-1 hidden md:block text-center">
                <button
                  onClick={() => handleTogglePublish(c)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {c.is_published ? 'Active' : 'Draft'}
                </button>
              </div>

              <div className="col-span-4 sm:col-span-3 md:col-span-2 text-right flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleTogglePublish(c)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Toggle active status"
                >
                  {c.is_published ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                </button>
                <button
                  onClick={() => setDeleteTarget(c)}
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60"
                  title="Delete Course Permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE COURSE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full my-8 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Create New Video Course & Syllabus</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MPSC Rajyaseva GS Comprehensive Batch"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Target Exam</label>
                  <select
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="MPSC">MPSC</option>
                    <option value="UPSC">UPSC</option>
                    <option value="SSC">SSC</option>
                    <option value="Police Bharti">Police Bharti</option>
                    <option value="Banking">Banking</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. History & Polity"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Access Tier</label>
                  <select
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="MEMBERSHIP">Annual Pass Included</option>
                    <option value="FREE">Free Trial</option>
                    <option value="PAID_PURCHASE">Paid Purchase</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Standalone Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Thumbnail URL</label>
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              {/* Modules Builder */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Modules & Lesson Structure ({modules.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setModules(prev => [
                      ...prev,
                      {
                        title: `Module ${prev.length + 1}: Topic Coverage`,
                        lessons: [{ title: 'Lesson 1', duration_minutes: 30, is_free_preview: false, video_url: '' }]
                      }
                    ])}
                    className="text-indigo-400 hover:text-white font-bold text-xs"
                  >
                    + Add Module
                  </button>
                </div>

                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {modules.map((mod, mIdx) => (
                    <div key={mIdx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModules(prev => prev.map((m, idx) => idx === mIdx ? { ...m, title: val } : m));
                          }}
                          className="font-bold text-white bg-transparent border-b border-slate-700 pb-0.5 focus:outline-none text-xs w-2/3"
                        />
                        {modules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setModules(prev => prev.filter((_, idx) => idx !== mIdx))}
                            className="text-red-400 hover:text-red-300 text-[11px]"
                          >
                            Remove Module
                          </button>
                        )}
                      </div>

                      {/* Lessons in this module */}
                      <div className="space-y-1.5 pl-2 border-l border-slate-800">
                        {mod.lessons.map((les, lIdx) => (
                          <div key={lIdx} className="flex items-center space-x-2 text-[11px]">
                            <Video className="w-3 h-3 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              value={les.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModules(prev => prev.map((m, idx) => {
                                  if (idx !== mIdx) return m;
                                  const updatedLessons = m.lessons.map((l, i) => i === lIdx ? { ...l, title: val } : l);
                                  return { ...m, lessons: updatedLessons };
                                }));
                              }}
                              placeholder="Lesson Title"
                              className="flex-1 bg-slate-950 px-2 py-1 rounded text-white border border-slate-800"
                            />
                            <input
                              type="number"
                              value={les.duration_minutes}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 10;
                                setModules(prev => prev.map((m, idx) => {
                                  if (idx !== mIdx) return m;
                                  const updatedLessons = m.lessons.map((l, i) => i === lIdx ? { ...l, duration_minutes: val } : l);
                                  return { ...m, lessons: updatedLessons };
                                }));
                              }}
                              className="w-14 bg-slate-950 px-1.5 py-1 rounded text-white border border-slate-800 text-center"
                              title="Minutes"
                            />
                            <span className="text-slate-500">min</span>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setModules(prev => prev.map((m, idx) => {
                              if (idx !== mIdx) return m;
                              return {
                                ...m,
                                lessons: [...m.lessons, { title: `Lesson ${m.lessons.length + 1}`, duration_minutes: 30, is_free_preview: false, video_url: '' }]
                              };
                            }));
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                        >
                          + Add Lesson
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-lg"
                >
                  Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete Course?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated modules, lessons, and student progress records will be removed.`}
        confirmLabel="Yes, Delete Course"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
