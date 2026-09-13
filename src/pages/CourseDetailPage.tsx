import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Course, CourseLesson, CourseModule } from '../types';
import {
  BookOpen,
  PlayCircle,
  Lock,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  FileText,
  Bookmark
} from 'lucide-react';

interface CourseDetailPageProps {
  courseId: string;
  navigate: (path: string) => void;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ courseId, navigate }) => {
  const { token, user } = useAuth();
  const { t } = useLanguage();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const isPaid = user?.membership_status === 'ACTIVE' || user?.role === 'PAID_STUDENT' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    setLoading(true);
    fetch(`/api/courses/${courseId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data || data.error) return;
        setCourse(data);
        // Select first lesson by default
        if (data.modules?.[0]?.lessons?.[0]) {
          setActiveLesson(data.modules[0].lessons[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId, token]);

  const toggleLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Loading course curriculum and syllabus modules...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Course not found</h2>
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const isLessonAccessible = activeLesson?.is_free || isPaid;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header back link */}
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Course Catalog</span>
      </button>

      {/* Main Grid: Player on left, Curriculum on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Player & Lesson Notes (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Lesson Viewport */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            {isLessonAccessible ? (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                      Active Lesson
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                      {activeLesson?.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => activeLesson && toggleLessonComplete(activeLesson.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                      activeLesson && completedLessons.has(activeLesson.id)
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{activeLesson && completedLessons.has(activeLesson.id) ? 'Completed' : 'Mark Complete'}</span>
                  </button>
                </div>

                {/* Video Container Simulation */}
                <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden group">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 cursor-pointer hover:scale-110 transition">
                      <PlayCircle className="w-8 h-8 fill-slate-950" />
                    </div>
                    <p className="text-xs font-medium text-slate-300">
                      Click to Stream High-Definition Lecture
                    </p>
                  </div>
                </div>

                {/* Lesson Study Notes */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Lecture Summary & Key Concepts</span>
                  </h3>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    {activeLesson?.content || 'Study notes for this lecture are provided above.'}
                  </div>
                </div>
              </div>
            ) : (
              /* Locked Lesson Prompt */
              <div className="p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">This Lesson is Locked</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Unlock this entire course along with all mock tests and digital library PDFs with the TechClass Annual Pass.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center space-x-2 mx-auto"
                  >
                    <span>Upgrade to Annual Pass (₹2,999)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Course Curriculum (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Course Curriculum</h3>
            <div className="space-y-4">
              {course.modules?.map((mod, modIdx) => (
                <div key={mod.id} className="space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Module {modIdx + 1}: {mod.title}
                  </div>
                  <div className="space-y-1">
                    {mod.lessons?.map((les, lesIdx) => {
                      const isActive = activeLesson?.id === les.id;
                      const isCompleted = completedLessons.has(les.id);
                      const canOpen = les.is_free || isPaid;

                      return (
                        <button
                          key={les.id}
                          onClick={() => setActiveLesson(les)}
                          className={`w-full p-3 rounded-xl text-left text-xs transition flex items-center justify-between ${
                            isActive
                              ? 'bg-cyan-950/60 border border-cyan-500/60 text-white font-semibold'
                              : 'bg-slate-950/50 hover:bg-slate-800/60 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : canOpen ? (
                              <PlayCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className="line-clamp-1">{les.title}</span>
                          </div>
                          {les.is_free && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              FREE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
