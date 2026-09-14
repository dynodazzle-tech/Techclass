import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BookmarkItem, NoteItem, NotificationItem } from '../types';
import { apiFetch } from '../lib/api';
import {
  Crown,
  BookOpen,
  FileCheck2,
  Library,
  Flame,
  Clock,
  Award,
  MessageSquare,
  Bookmark,
  FileText,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Plus
} from 'lucide-react';

interface DashboardPageProps {
  navigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { user, token, settings } = useAuth();
  const { t } = useLanguage();

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [testAttempts, setTestAttempts] = useState<any[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    apiFetch<any[]>('/api/student/test-attempts')
      .then(data => Array.isArray(data) && setTestAttempts(data))
      .catch(() => {});

    if (!token) return;

    apiFetch<BookmarkItem[]>('/api/student/bookmarks')
      .then(data => Array.isArray(data) && setBookmarks(data))
      .catch(() => {});

    apiFetch<NoteItem[]>('/api/student/notes')
      .then(data => Array.isArray(data) && setNotes(data))
      .catch(() => {});

    apiFetch<NotificationItem[]>('/api/student/notifications')
      .then(data => Array.isArray(data) && setNotifications(data))
      .catch(() => {});
  }, [token]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newNoteText.trim()) return;

    try {
      const created = await apiFetch<NoteItem>('/api/student/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: newNoteTitle || 'Study Note',
          note_text: newNoteText
        })
      });
      if (created) {
        setNotes(prev => [created, ...prev]);
        setNewNoteTitle('');
        setNewNoteText('');
        setShowNoteForm(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isPaid = user?.membership_status === 'ACTIVE' || user?.role === 'PAID_STUDENT';

  const testsAttemptedCount = testAttempts.length;
  const avgAccuracy = testsAttemptedCount > 0
    ? Math.round(testAttempts.reduce((acc, curr) => acc + (Number(curr.accuracy) || 0), 0) / testsAttemptedCount)
    : 84;

  // Calculate days remaining on annual pass
  let daysRemaining = 365;
  if (user?.expiry_date) {
    const diff = new Date(user.expiry_date).getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Pre-filled WhatsApp support url
  const waPhone = '917770032149';
  const waMessage = encodeURIComponent(
    `Hello TechClass Academic Desk, I am ${user?.full_name || 'Student'} (Student ID: ${user?.student_id || 'TC100002'}). I have a question regarding my exam preparation.`
  );
  const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/60">
              {user?.student_id || 'TC100001'}
            </span>
            {isPaid ? (
              <span className="text-xs font-bold text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 flex items-center space-x-1">
                <Crown className="w-3 h-3 text-emerald-400" />
                <span>ANNUAL PASS ACTIVE</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-800">
                FREE STUDENT TIER
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.full_name || 'Student'}!
          </h1>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Target Exams: <strong className="text-slate-200">{user?.target_exams?.join(', ') || 'MPSC, SSC'}</strong> • Language: <strong className="text-cyan-300 uppercase">{user?.preferred_language || 'EN'}</strong>
          </p>
        </div>

        {/* Action button: WhatsApp for paid, Upgrade for free */}
        <div className="relative z-10">
          {isPaid ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-left sm:text-right text-xs">
                <div className="text-slate-400">Membership Valid Until:</div>
                <div className="font-semibold text-white">{user?.expiry_date || '1 Year Access'}</div>
                <div className="text-emerald-400 text-[11px] font-bold">{daysRemaining} Days Left</div>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Academic Desk</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-left sm:text-right text-xs">
                <div className="text-amber-400 font-bold">Limited Free Tier</div>
                <div className="text-slate-400 text-[11px]">2 Free Tests Remaining</div>
              </div>
              <button
                onClick={() => navigate('/pricing')}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-lg shadow-cyan-500/20"
              >
                <span>Upgrade to Annual Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">{user?.study_streak || 5} <span className="text-xs font-normal text-slate-400">days</span></div>
          <p className="text-[11px] text-amber-400">Consistent study momentum!</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Study Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">{user?.total_study_minutes || 480} <span className="text-xs font-normal text-slate-400">mins</span></div>
          <p className="text-[11px] text-slate-400">Across courses & mock tests</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tests Attempted</span>
            <FileCheck2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">{testsAttemptedCount} <span className="text-xs font-normal text-slate-400">tests</span></div>
          <p className="text-[11px] text-purple-400">Avg Accuracy: {avgAccuracy}%</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Saved Bookmarks</span>
            <Bookmark className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{bookmarks.length || 2} <span className="text-xs font-normal text-slate-400">saved</span></div>
          <p className="text-[11px] text-slate-400">E-Ink notes & questions</p>
        </div>
      </div>

      {/* Main Grid: Quick Resume on Left, Notes & Notifications on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Quick Learning Hub (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Continue Strip */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Continue Where You Left Off
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  COURSE IN PROGRESS
                </span>
                <h4 className="text-sm font-bold text-white">MPSC Rajyaseva GS Comprehensive</h4>
                <p className="text-xs text-slate-400">Module 1 • Maharashtra Geography Basics</p>
                <button
                  onClick={() => navigate('/courses')}
                  className="w-full py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold border border-cyan-800/40 transition flex items-center justify-center space-x-1"
                >
                  <span>Resume Video Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  DIGITAL LIBRARY PDF
                </span>
                <h4 className="text-sm font-bold text-white">Maharashtra GK & Administrative Atlas</h4>
                <p className="text-xs text-slate-400">Bookmarked at Page 1 • E-Ink Mode</p>
                <button
                  onClick={() => navigate('/library')}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center space-x-1"
                >
                  <span>Open E-Ink Reader</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* My Test Records & Official Scorecards */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  <span>My Test Records & Official Scorecards</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {testAttempts.length} Recorded
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Permanent archive saved under Student ID: <strong className="text-cyan-400 font-mono">{user?.student_id || 'TC100001'}</strong>
                </p>
              </div>

              <button
                onClick={() => navigate('/tests')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1 shrink-0 self-start sm:self-auto"
              >
                <span>Take Mock Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {testAttempts.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-300">No Test Attempts Recorded Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Every mock test and topic assessment you complete is permanently cataloged here under your Student ID for review, rank analysis, and syllabus solutions.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/tests')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition"
                >
                  Start Your First Test
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {testAttempts.map(attempt => {
                  const isPassed = (attempt.percentage || 0) >= 50;
                  const isDistinction = (attempt.percentage || 0) >= 75;

                  return (
                    <div
                      key={attempt.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {attempt.exam || 'Competitive Exam'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ID: {attempt.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDistinction
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isPassed
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {isDistinction ? 'Distinction' : isPassed ? 'Qualified' : 'Needs Practice'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white truncate">
                          {attempt.test_title || 'Mock Examination'}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                          <span>
                            Date: <strong className="text-slate-300">{new Date(attempt.created_at || attempt.completed_at).toLocaleDateString()}</strong>
                          </span>
                          <span>
                            Accuracy: <strong className="text-emerald-400">{attempt.accuracy || 0}%</strong>
                          </span>
                          <span>
                            Breakdown: <span className="text-emerald-400 font-semibold">✓{attempt.correct_count}</span>{' '}
                            <span className="text-rose-400 font-semibold">✗{attempt.wrong_count}</span>{' '}
                            <span className="text-slate-500 font-semibold">—{attempt.skipped_count}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                        <div className="text-left sm:text-right">
                          <div className="text-base font-black text-cyan-400">
                            {attempt.score}{' '}
                            <span className="text-xs font-normal text-slate-400">
                              / {attempt.test_total_marks || attempt.total_marks || 100}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {attempt.percentage}% Total Marks
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/test/${attempt.test_id}/result?attemptId=${attempt.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 text-xs font-semibold transition flex items-center space-x-1"
                            title="View Clear Scorecard & Verified Solutions"
                          >
                            <span>View Clear Result</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bookmarks Section */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-cyan-400" />
                <span>Saved Study Bookmarks</span>
              </h3>
              <button
                onClick={() => navigate('/library')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Browse Library
              </button>
            </div>

            {bookmarks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No bookmarks saved yet. Click the bookmark icon in the E-Ink reader to save key pages.</p>
            ) : (
              <div className="space-y-2">
                {bookmarks.map(b => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{b.notes || 'Bookmarked Item'}</div>
                      <div className="text-[10px] text-slate-500">Saved on {new Date(b.created_at).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => navigate(`/reader/${b.item_id}`)}
                      className="px-3 py-1 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 text-xs"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Personal Notes & Notifications (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Notes Tool */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Personal Study Notes</span>
              </h3>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                title="Add New Note"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showNoteForm && (
              <form onSubmit={handleAddNote} className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Note title (e.g. 73rd Amendment Key Articles)"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Type revision formula, mnemonic or important points..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNoteForm(false)}
                    className="px-3 py-1 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-cyan-500 text-slate-950 font-bold rounded-lg"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No notes created yet.</p>
              ) : (
                notes.map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="font-semibold text-white">{n.title}</div>
                    <div className="text-slate-400 whitespace-pre-line text-[11px] leading-relaxed">{n.note_text}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Platform Announcements</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {notifications.length === 0 ? (
                <p className="text-slate-500 py-2 text-center">No new notifications.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-semibold text-cyan-300">{n.title}</div>
                    <div className="text-slate-400 text-[11px]">{n.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
