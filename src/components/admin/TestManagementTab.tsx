import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Search,
  Trash2,
  Edit,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Percent,
  Layers,
  Sparkles
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface TestManagementTabProps {
  token: string | null;
  onActionNotification: (msg: string, isError?: boolean) => void;
}

interface AdminTestItem {
  id: string;
  title: string;
  exam: string;
  subject: string;
  type: 'MOCK' | 'PRACTICE' | 'PYQ';
  duration_minutes: number;
  total_marks: number;
  passing_percentage: number;
  negative_marking: number;
  access_type: 'FREE' | 'MEMBERSHIP' | 'PAID_PURCHASE';
  price: number;
  is_published: boolean;
  question_count?: number;
  attempt_count?: number;
}

export const TestManagementTab: React.FC<TestManagementTabProps> = ({
  token,
  onActionNotification
}) => {
  const [tests, setTests] = useState<AdminTestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTestItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [exam, setExam] = useState('MPSC');
  const [subject, setSubject] = useState('General Studies Paper 1');
  const [type, setType] = useState<'MOCK' | 'PRACTICE' | 'PYQ'>('MOCK');
  const [duration, setDuration] = useState('60');
  const [marks, setMarks] = useState('100');
  const [passingPct, setPassingPct] = useState('50');
  const [negativeMarking, setNegativeMarking] = useState('0.25');
  const [accessType, setAccessType] = useState<'FREE' | 'MEMBERSHIP' | 'PAID_PURCHASE'>('MEMBERSHIP');
  const [price, setPrice] = useState('0');

  // Questions Builder
  const [questions, setQuestions] = useState<Array<{
    question_text: string;
    question_text_mr?: string;
    marks: number;
    negative_marks: number;
    correct_option: 'A' | 'B' | 'C' | 'D';
    options: { A: string; B: string; C: string; D: string };
    explanation?: string;
  }>>([
    {
      question_text: 'Which Article of the Constitution of India guarantees Equality before Law?',
      question_text_mr: 'भारतीय राज्यघटनेचे कोणते कलम कायद्यासमोर समानतेची हमी देते?',
      marks: 2,
      negative_marks: 0.5,
      correct_option: 'B',
      options: {
        A: 'Article 12',
        B: 'Article 14',
        C: 'Article 19',
        D: 'Article 21'
      },
      explanation: 'Article 14 declares that the State shall not deny to any person equality before the law or equal protection of the laws within India.'
    }
  ]);

  const loadTests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load tests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTests(data);
      }
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [token]);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        title,
        exam,
        subject,
        type,
        duration_minutes: parseInt(duration) || 60,
        total_marks: parseInt(marks) || 100,
        passing_percentage: parseInt(passingPct) || 50,
        negative_marking: parseFloat(negativeMarking) || 0.25,
        access_type: accessType,
        price: parseFloat(price) || 0,
        is_published: true,
        questions: questions.map((q, idx) => ({
          question_text: q.question_text,
          order_index: idx + 1,
          marks: q.marks,
          negative_marks: q.negative_marks,
          correct_option: q.correct_option,
          options: q.options,
          explanation: q.explanation,
          translations: q.question_text_mr ? {
            mr: { question_text: q.question_text_mr, explanation: q.explanation }
          } : undefined
        }))
      };

      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create test paper');

      onActionNotification(`Test paper "${title}" created with ${questions.length} questions!`);
      setCreateModalOpen(false);
      resetForm();
      loadTests();
    } catch (err: any) {
      onActionNotification(err.message, true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/tests/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete test');

      onActionNotification(`Test paper "${deleteTarget.title}" permanently removed.`);
      setDeleteTarget(null);
      loadTests();
    } catch (err: any) {
      onActionNotification(err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setQuestions([
      {
        question_text: '',
        marks: 2,
        negative_marks: 0.5,
        correct_option: 'A',
        options: { A: '', B: '', C: '', D: '' },
        explanation: ''
      }
    ]);
  };

  const filteredTests = tests.filter(t => {
    if (examFilter !== 'ALL' && t.exam !== examFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <FileCheck2 className="w-4 h-4" />
            <span>Simulated Exam Engine & Question Bank</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Mock Test Series Management</h2>
          <p className="text-xs text-slate-400">
            Publish timed test papers, configure negative marking penalties, and review candidate performance.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Test Paper</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests by title or exam..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-slate-400">Filter Exam:</span>
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
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

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="grid grid-cols-12 p-3.5 bg-slate-950 text-xs font-bold text-slate-400 border-b border-slate-800">
          <div className="col-span-6 sm:col-span-5">Test Title & Exam</div>
          <div className="col-span-2 hidden sm:block text-center">Duration / Marks</div>
          <div className="col-span-2 text-center">Questions / Tier</div>
          <div className="col-span-1 hidden md:block text-center">Status</div>
          <div className="col-span-4 sm:col-span-3 md:col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading test series...</div>
        ) : filteredTests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <FileCheck2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No tests found.</p>
          </div>
        ) : (
          filteredTests.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-12 p-3.5 text-xs text-slate-300 border-b border-slate-800/60 items-center hover:bg-slate-850/50 transition"
            >
              <div className="col-span-6 sm:col-span-5 space-y-0.5">
                <div className="font-bold text-white truncate">{t.title}</div>
                <div className="text-[11px] text-slate-400">{t.exam} • {t.subject}</div>
                <span className="inline-block px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 uppercase font-mono">
                  {t.type}
                </span>
              </div>

              <div className="col-span-2 hidden sm:block text-center font-mono">
                <div>{t.duration_minutes} Mins</div>
                <div className="text-[10px] text-slate-500">{t.total_marks} Marks (Pass {t.passing_percentage}%)</div>
              </div>

              <div className="col-span-2 text-center">
                <div className="font-bold text-white">{t.question_count || 10} Questions</div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.access_type === 'MEMBERSHIP' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {t.access_type === 'MEMBERSHIP' ? 'Annual Pass' : 'Free Trial'}
                </span>
              </div>

              <div className="col-span-1 hidden md:block text-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.is_published ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {t.is_published ? 'Active' : 'Draft'}
                </span>
              </div>

              <div className="col-span-4 sm:col-span-3 md:col-span-2 text-right flex items-center justify-end space-x-2">
                <button
                  onClick={() => setDeleteTarget(t)}
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60"
                  title="Permanently Delete Test"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE TEST MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full my-8 p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>Create Mock Test & Questions</span>
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Test Paper Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MPSC Full Length Mock Test - 01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Exam</label>
                  <select
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="MPSC">MPSC</option>
                    <option value="UPSC">UPSC</option>
                    <option value="SSC">SSC</option>
                    <option value="Police Bharti">Police Bharti</option>
                    <option value="Banking">Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Test Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="MOCK">Full Mock</option>
                    <option value="PRACTICE">Sectional Practice</option>
                    <option value="PYQ">Previous Year (PYQ)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Negative Mark</label>
                  <input
                    type="number"
                    step="0.05"
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Questions ({questions.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuestions(prev => [
                      ...prev,
                      {
                        question_text: '',
                        marks: 2,
                        negative_marks: 0.5,
                        correct_option: 'A',
                        options: { A: '', B: '', C: '', D: '' }
                      }
                    ])}
                    className="text-emerald-400 hover:text-white font-bold text-xs"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400">Question {idx + 1}</span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <textarea
                        rows={2}
                        required
                        value={q.question_text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, question_text: val } : item));
                        }}
                        placeholder="English Question statement..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />

                      <textarea
                        rows={1}
                        value={q.question_text_mr || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, question_text_mr: val } : item));
                        }}
                        placeholder="Marathi translation (optional)..."
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px]"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        {(['A', 'B', 'C', 'D'] as const).map((optKey) => (
                          <div key={optKey} className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-400 w-4">{optKey}:</span>
                            <input
                              type="text"
                              required
                              value={q.options[optKey]}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQuestions(prev => prev.map((item, i) => i === idx ? {
                                  ...item,
                                  options: { ...item.options, [optKey]: val }
                                } : item));
                              }}
                              placeholder={`Option ${optKey}`}
                              className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white text-[11px]"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center space-x-3 pt-1">
                        <span className="text-slate-400 font-semibold">Correct Option:</span>
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                          <label key={opt} className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`correct_${idx}`}
                              checked={q.correct_option === opt}
                              onChange={() => {
                                setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, correct_option: opt } : item));
                              }}
                              className="text-emerald-500"
                            />
                            <span className="text-white font-bold">{opt}</span>
                          </label>
                        ))}
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
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg"
                >
                  Publish Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Permanently Delete Test Paper?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated questions and candidate attempt records will be removed.`}
        confirmLabel="Yes, Delete Test"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
