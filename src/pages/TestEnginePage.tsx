import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TestPaper, Question, SupportedLanguage } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Send,
  Languages,
  ShieldCheck,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TestEngineProps {
  testId: string;
  navigate: (path: string) => void;
}

export const TestEnginePage: React.FC<TestEngineProps> = ({ testId, navigate }) => {
  const { token, user } = useAuth();
  const { language: defaultLang } = useLanguage();

  const [test, setTest] = useState<TestPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [testLang, setTestLang] = useState<SupportedLanguage>(defaultLang);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const timerRef = useRef<any>(null);

  // Load test details & questions
  useEffect(() => {
    setLoading(true);
    fetch(`/api/tests/${testId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to load test');
        }
        return res.json();
      })
      .then(data => {
        setTest(data);
        const totalSecs = (data.duration_minutes || 60) * 60;
        setSecondsRemaining(totalSecs);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [testId, token]);

  // Live countdown timer
  useEffect(() => {
    if (!test || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit(); // Auto-submit on time expire
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [test, isSubmitting]);

  // Mark current question as visited
  useEffect(() => {
    setVisited(prev => new Set(prev).add(currentIndex));
  }, [currentIndex]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (option: 'A' | 'B' | 'C' | 'D') => {
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const handleClearResponse = () => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  };

  const handleToggleMarkReview = () => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting || !test) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const totalTimeTaken = Math.max(1, ((test.duration_minutes || 60) * 60) - secondsRemaining);

    // Map answers by question ID as well as index for 100% accuracy
    const answersPayload: Record<string, string> = {};
    if (test.questions) {
      test.questions.forEach((q, idx) => {
        if (answers[idx] !== undefined) {
          answersPayload[q.id] = answers[idx];
          answersPayload[String(idx)] = answers[idx];
        }
      });
    }

    try {
      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          answers: answersPayload,
          time_taken_seconds: totalTimeTaken,
          language: testLang
        })
      });

      const resultData = await res.json();
      if (resultData.attempt_id) {
        navigate(`/test/${testId}/result?attemptId=${resultData.attempt_id}`);
      } else {
        // Fallback result view
        navigate(`/test/${testId}/result?score=${resultData.score}&total=${resultData.total_marks}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      navigate(`/test/${testId}/result`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Preparing examination paper and verified translations...</p>
      </div>
    );
  }

  if (error || !test || !test.questions || test.questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">{error || 'No questions available for this test'}</h2>
        <p className="text-xs text-slate-400">
          This test might require an active Annual Pass or is currently undergoing syllabus updates.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate('/tests')}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
          >
            Back to Tests
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
          >
            View Annual Pass
          </button>
        </div>
      </div>
    );
  }

  const currentQ = test.questions[currentIndex];
  const translation = currentQ.translations[testLang] || currentQ.translations['en'];

  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const unansweredCount = test.questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Test Engine Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
              {test.exam} • {test.type}
            </span>
            <h1 className="text-sm sm:text-base font-bold text-white mt-0.5 line-clamp-1">
              {test.title}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Language Switcher */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <Languages className="w-3.5 h-3.5 text-cyan-400 ml-1" />
              <button
                onClick={() => setTestLang('en')}
                className={`px-2 py-0.5 rounded font-medium ${testLang === 'en' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => setTestLang('hi')}
                className={`px-2 py-0.5 rounded font-medium ${testLang === 'hi' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setTestLang('mr')}
                className={`px-2 py-0.5 rounded font-medium ${testLang === 'mr' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
              >
                मराठी
              </button>
            </div>

            {/* Timer display */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border ${
              secondsRemaining < 300
                ? 'bg-red-950/40 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-slate-950 text-cyan-300 border-slate-800'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Submit test button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-blue-500 transition shadow-sm"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Canvas */}
      <div className="max-w-7xl mx-auto w-full px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Question Area (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-sm">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400">
                  Question {currentIndex + 1} of {test.questions.length}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentQ.subject}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-emerald-400 font-medium">+{currentQ.marks} Marks</span>
                <span className="text-red-400 font-medium">-{currentQ.negative_marks} Neg</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-white leading-relaxed">
              {translation.question}
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {(['A', 'B', 'C', 'D'] as const).map(optKey => {
                const optText = translation[`opt_${optKey.toLowerCase()}` as keyof typeof translation] as string;
                const isSelected = answers[currentIndex] === optKey;

                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelectAnswer(optKey)}
                    className={`w-full p-4 rounded-xl text-left text-sm font-medium border transition flex items-center space-x-3 ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-inner'
                        : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {optKey}
                    </span>
                    <span className="flex-1">{optText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleMarkReview}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition ${
                  markedForReview.has(currentIndex)
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{markedForReview.has(currentIndex) ? 'Unmark Review' : 'Mark for Review'}</span>
              </button>

              {answers[currentIndex] && (
                <button
                  onClick={handleClearResponse}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Response</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 disabled:opacity-40 text-slate-200 hover:bg-slate-700 transition flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                disabled={currentIndex === test.questions.length - 1}
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 transition flex items-center space-x-1"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Palette
            </h3>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500"></span>
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
                <span>Not Answered ({unansweredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded bg-purple-500"></span>
                <span>Marked ({markedCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-700"></span>
                <span>Not Visited</span>
              </div>
            </div>

            {/* Grid of question buttons */}
            <div className="pt-2 border-t border-slate-800">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-72 overflow-y-auto pr-1">
                {test.questions.map((q, idx) => {
                  const isAnswered = answers[idx] !== undefined;
                  const isMarked = markedForReview.has(idx);
                  const isCurrent = currentIndex === idx;
                  const isVis = visited.has(idx);

                  let bgClass = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (isAnswered) {
                    bgClass = 'bg-emerald-600 text-white font-bold border-emerald-500';
                  } else if (isMarked) {
                    bgClass = 'bg-purple-600 text-white font-bold border-purple-500';
                  } else if (isVis) {
                    bgClass = 'bg-amber-600 text-white font-bold border-amber-500';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-xl text-xs font-mono font-medium border flex items-center justify-center transition relative ${bgClass} ${
                        isCurrent ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10' : ''
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isMarked && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspirant Details */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Student ID:</span>
                <span className="font-mono text-cyan-300 font-bold">{user?.student_id || 'TC-GUEST'}</span>
              </div>
              <div className="flex justify-between">
                <span>Subject:</span>
                <span className="text-white">{test.subject}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Confirm Test Submission</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to submit your test paper? You will not be able to modify your answers once submitted.
            </p>

            <div className="grid grid-cols-3 gap-3 text-center text-xs py-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <div className="text-emerald-400 font-bold text-lg">{answeredCount}</div>
                <div className="text-slate-400 text-[10px]">Answered</div>
              </div>
              <div>
                <div className="text-amber-400 font-bold text-lg">{unansweredCount}</div>
                <div className="text-slate-400 text-[10px]">Not Answered</div>
              </div>
              <div>
                <div className="text-purple-400 font-bold text-lg">{markedCount}</div>
                <div className="text-slate-400 text-[10px]">Marked Review</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Resume Test
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Paper</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
