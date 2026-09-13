import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Languages,
  Filter,
  Search,
  Printer,
  FileCheck2,
  HelpCircle,
  BarChart3,
  Calendar,
  UserCheck
} from 'lucide-react';

interface AttemptData {
  id: string;
  user_id: string;
  test_id: string;
  score: number;
  percentage: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  accuracy: number;
  time_taken_seconds: number;
  rank: number;
  percentile: number;
  status: string;
  completed_at: string;
  created_at: string;
  test_title: string;
  exam: string;
  test_type: string;
  total_marks: number;
  duration_minutes: number;
  negative_marking_ratio: number;
  student_name: string;
  student_id: string;
  student_email: string;
}

interface QuestionResultItem {
  id: string;
  test_id: string;
  subject: string;
  marks: number;
  negative_marks: number;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  order_index: number;
  translations: Record<string, {
    question: string;
    opt_a: string;
    opt_b: string;
    opt_c: string;
    opt_d: string;
    explanation: string;
  }>;
  user_answer?: {
    selected_option: 'A' | 'B' | 'C' | 'D' | null;
    is_correct: boolean;
    time_spent_seconds?: number;
  } | null;
}

interface TestResultPageProps {
  testId?: string;
  attemptId?: string;
  navigate: (path: string) => void;
}

export const TestResultPage: React.FC<TestResultPageProps> = ({ testId, attemptId, navigate }) => {
  const { token, user } = useAuth();
  const { language: defaultLang } = useLanguage();

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [questions, setQuestions] = useState<QuestionResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & display preferences
  const [solLang, setSolLang] = useState<SupportedLanguage>(defaultLang);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'SKIPPED'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let activeAttemptId = attemptId;
    if (!activeAttemptId) {
      try {
        const url = new URL(window.location.href);
        activeAttemptId = url.searchParams.get('attemptId') || undefined;
      } catch (e) {}
    }

    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (activeAttemptId) {
      fetch(`/api/student/attempts/${activeAttemptId}`, { headers })
        .then(async res => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to load test attempt record');
          }
          return res.json();
        })
        .then(data => {
          setAttempt(data.attempt);
          setQuestions(data.questions || []);
        })
        .catch(err => {
          console.error(err);
          setError(err.message);
        })
        .finally(() => setLoading(false));
    } else if (testId) {
      // Find latest attempt for this test
      fetch('/api/student/test-attempts', { headers })
        .then(res => (res.ok ? res.json() : []))
        .then(async (attempts: any[]) => {
          const match = attempts.find(a => a.test_id === testId);
          if (match && match.id) {
            const res2 = await fetch(`/api/student/attempts/${match.id}`, { headers });
            const data2 = await res2.json();
            setAttempt(data2.attempt);
            setQuestions(data2.questions || []);
          } else {
            // No attempts recorded yet, fetch raw test to let candidate start
            const resTest = await fetch(`/api/tests/${testId}`, { headers });
            const testData = await resTest.json();
            if (testData && testData.id) {
              setAttempt({
                id: 'unattempted',
                user_id: user?.id || 'demo',
                test_id: testData.id,
                score: 0,
                percentage: 0,
                correct_count: 0,
                wrong_count: 0,
                skipped_count: testData.questions?.length || 0,
                accuracy: 0,
                time_taken_seconds: 0,
                rank: 1,
                percentile: 50,
                status: 'NOT_ATTEMPTED',
                completed_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                test_title: testData.title,
                exam: testData.exam,
                test_type: testData.type,
                total_marks: testData.total_marks || 100,
                duration_minutes: testData.duration_minutes || 60,
                negative_marking_ratio: testData.negative_marking_ratio || 0.25,
                student_name: user?.full_name || 'Student Candidate',
                student_id: user?.student_id || 'TC100001',
                student_email: user?.email || ''
              });
              setQuestions((testData.questions || []).map((q: any) => ({
                ...q,
                user_answer: null
              })));
            } else {
              throw new Error('Test not found');
            }
          }
        })
        .catch(err => {
          setError(err.message);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError('No test attempt specified.');
    }
  }, [attemptId, testId, token, user]);

  // Unique subjects
  const subjects = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, [questions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // Filter by status
      if (filterStatus === 'CORRECT' && (!q.user_answer || !q.user_answer.is_correct)) return false;
      if (filterStatus === 'WRONG' && (!q.user_answer || q.user_answer.is_correct || !q.user_answer.selected_option)) return false;
      if (filterStatus === 'SKIPPED' && (q.user_answer && q.user_answer.selected_option)) return false;

      // Filter by subject
      if (selectedSubject !== 'ALL' && q.subject !== selectedSubject) return false;

      // Search query
      if (searchQuery.trim()) {
        const trans = q.translations[solLang] || q.translations['en'] || Object.values(q.translations)[0];
        const text = (trans?.question || '') + ' ' + (trans?.explanation || '');
        if (!text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }

      return true;
    });
  }, [questions, filterStatus, selectedSubject, searchQuery, solLang]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading student test record and verified solutions...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Record Not Found</h2>
        <p className="text-xs text-slate-400">
          {error || 'We could not locate this test attempt in your student record.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate('/tests')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Browse Tests
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
          >
            My Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const isPassed = attempt.percentage >= 50;
  const isDistinction = attempt.percentage >= 75;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:max-w-none">
      {/* Permanent Student ID & Candidate Verification Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-900/60 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>Permanent Student Record</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Attempt #{attempt.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {attempt.test_title}
            </h1>
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Exam: <strong className="text-slate-200">{attempt.exam}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-slate-200">{attempt.test_type}</strong></span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{new Date(attempt.created_at || attempt.completed_at).toLocaleString()}</span>
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
              title="Print Official Scorecard"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Scorecard</span>
            </button>
            <button
              onClick={() => navigate(`/test/${attempt.test_id}`)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Test</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              Back to Records
            </button>
          </div>
        </div>

        {/* Student ID & Verification Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Candidate Name</div>
              <div className="font-bold text-white text-sm">{attempt.student_name || user?.full_name || 'Registered Candidate'}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Student ID</div>
              <div className="font-mono font-black text-cyan-300 text-sm tracking-wider">{attempt.student_id || user?.student_id || 'TC100001'}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              isDistinction
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isPassed
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Assessment Result</div>
              <div className={`font-bold text-sm ${isDistinction ? 'text-emerald-400' : isPassed ? 'text-blue-400' : 'text-amber-400'}`}>
                {isDistinction ? 'Merit Distinction' : isPassed ? 'Qualified (Pass)' : 'Needs Revision'}
              </div>
            </div>
          </div>
        </div>

        {/* Clear Big Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Total Score */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Marks Scored</div>
            <div className="text-3xl font-black text-cyan-400">
              {attempt.score} <span className="text-xs font-normal text-slate-400">/ {attempt.total_marks}</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-400">
              {attempt.percentage}% Total Score
            </div>
          </div>

          {/* Accuracy */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Answer Accuracy</div>
            <div className="text-3xl font-black text-emerald-400">
              {attempt.accuracy}%
            </div>
            <div className="text-[11px] text-slate-400">
              {attempt.correct_count} of {attempt.correct_count + attempt.wrong_count} attempted
            </div>
          </div>

          {/* Time Taken */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Time Taken</div>
            <div className="text-3xl font-black text-white">
              {formatSeconds(attempt.time_taken_seconds || 0)}
            </div>
            <div className="text-[11px] text-slate-400">
              Limit: {attempt.duration_minutes || 60} mins
            </div>
          </div>

          {/* Estimated Rank & Percentile */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">State Percentile</div>
            <div className="text-3xl font-black text-purple-400">
              {attempt.percentile}%
            </div>
            <div className="text-[11px] text-purple-300 font-semibold">
              Rank #{attempt.rank || 1} Candidate
            </div>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-around gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Correct Answers:</span>
            <strong className="text-emerald-400 font-bold">{attempt.correct_count}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-300">Incorrect Answers:</span>
            <strong className="text-rose-400 font-bold">{attempt.wrong_count}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-300">Unattempted / Skipped:</span>
            <strong className="text-slate-400 font-bold">{attempt.skipped_count}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Negative Penalty:</span>
            <strong className="text-amber-400 font-bold">-{attempt.negative_marking_ratio * 100}% per wrong</strong>
          </div>
        </div>
      </div>

      {/* Solutions & Explanations Review Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-cyan-400" />
              <span>Detailed Question Review & Verified Explanations</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare your selected response against official key with concept explanations.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
            <Languages className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
            <span className="text-[11px] text-slate-400 mr-1">Language:</span>
            <button
              onClick={() => setSolLang('en')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${solLang === 'en' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}
            >
              English
            </button>
            <button
              onClick={() => setSolLang('hi')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${solLang === 'hi' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setSolLang('mr')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${solLang === 'mr' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300'}`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterStatus === 'ALL'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilterStatus('CORRECT')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition ${
                filterStatus === 'CORRECT'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Correct ({attempt.correct_count})</span>
            </button>
            <button
              onClick={() => setFilterStatus('WRONG')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition ${
                filterStatus === 'WRONG'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Incorrect ({attempt.wrong_count})</span>
            </button>
            <button
              onClick={() => setFilterStatus('SKIPPED')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition ${
                filterStatus === 'SKIPPED'
                  ? 'bg-slate-300 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Skipped ({attempt.skipped_count})</span>
            </button>
          </div>

          {/* Subject dropdown & search */}
          <div className="flex items-center gap-2">
            {subjects.length > 1 && (
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search question..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Questions list */}
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
            <p className="text-sm font-semibold text-slate-300">No questions match the selected filter</p>
            <button
              onClick={() => { setFilterStatus('ALL'); setSelectedSubject('ALL'); setSearchQuery(''); }}
              className="text-xs text-cyan-400 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuestions.map((q, idx) => {
              const trans = q.translations[solLang] || q.translations['en'] || Object.values(q.translations)[0];
              const userOpt = q.user_answer?.selected_option || null;
              const isCorrect = q.user_answer?.is_correct || false;
              const isAttempted = Boolean(userOpt);
              const correctOpt = q.correct_answer;

              return (
                <div
                  key={q.id}
                  className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-sm"
                >
                  {/* Question header with status pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white px-2.5 py-0.5 rounded bg-slate-800">
                        Question {q.order_index || idx + 1}
                      </span>
                      <span className="text-cyan-400 font-semibold">{q.subject}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isAttempted ? (
                        isCorrect ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>CORRECT (+{q.marks} Marks)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold flex items-center space-x-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>INCORRECT (-{q.negative_marks} Mark penalty)</span>
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                          NOT ATTEMPTED (0 Marks)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Body */}
                  <p className="text-base font-medium text-white leading-relaxed whitespace-pre-line">
                    {trans?.question || 'Question content'}
                  </p>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                      const optKey = `opt_${opt.toLowerCase()}` as keyof typeof trans;
                      const optText = trans ? (trans[optKey] as string) : '';
                      const isCandidateSelection = userOpt === opt;
                      const isCorrectAnswer = correctOpt === opt;

                      let borderClass = 'border-slate-800 bg-slate-950/60 text-slate-300';
                      let badge = null;

                      if (isCorrectAnswer) {
                        borderClass = 'border-emerald-500 bg-emerald-950/40 text-emerald-100 font-semibold ring-1 ring-emerald-500/40';
                        badge = (
                          <span className="ml-auto text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20">
                            ✓ OFFICIAL KEY
                          </span>
                        );
                      } else if (isCandidateSelection && !isCorrect) {
                        borderClass = 'border-rose-500 bg-rose-950/40 text-rose-200 font-semibold ring-1 ring-rose-500/40';
                        badge = (
                          <span className="ml-auto text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20">
                            ✗ YOUR ANSWER
                          </span>
                        );
                      }

                      return (
                        <div
                          key={opt}
                          className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2.5 transition ${borderClass}`}
                        >
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrectAnswer
                              ? 'bg-emerald-500 text-slate-950'
                              : isCandidateSelection && !isCorrect
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {opt}
                          </span>
                          <span className="flex-1 leading-snug">{optText}</span>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation */}
                  {trans?.explanation && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2 text-xs">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Syllabus Concept & Verified Solution ({solLang.toUpperCase()})</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                        {trans.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Strip */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Scorecard Stored in Student Profile</h3>
          <p className="text-xs text-slate-400">
            This test attempt is permanently indexed under your Student ID (<span className="font-mono text-cyan-400">{attempt.student_id}</span>).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/tests')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Practice More Tests
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/20"
          >
            Go to My Records
          </button>
        </div>
      </div>
    </div>
  );
};
