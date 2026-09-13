import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Course } from '../types';
import { BookOpen, Filter, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface CoursesPageProps {
  navigate: (path: string) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    let url = '/api/courses?';
    if (selectedExam !== 'ALL') url += `exam=${encodeURIComponent(selectedExam)}&`;

    fetch(url)
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data)) setCourses(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const exams = ['ALL', 'MPSC', 'SSC', 'UPSC', 'Police Bharti', 'Banking'];
  const isPaid = user?.membership_status === 'ACTIVE' || user?.role === 'PAID_STUDENT' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Structured Video & Conceptual Curricula</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Government Exam Courses</h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Master the complete syllabus with topic-by-topic video lectures, conceptual notes, and revision checklists taught in Hindi, Marathi, and English.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center space-x-1 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by Exam:</span>
        </span>
        {exams.map(e => (
          <button
            key={e}
            onClick={() => setSelectedExam(e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
              selectedExam === e
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {e === 'ALL' ? 'All Courses' : e}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading course curricula...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          No courses found for this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden hover:border-cyan-500/40 hover:bg-slate-900 transition cursor-pointer flex flex-col group shadow-sm"
            >
              <div className="relative h-48 overflow-hidden bg-slate-800">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-cyan-300 border border-cyan-500/30">
                    {course.exam}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                    course.access_type === 'FREE' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                  }`}>
                    {course.access_type === 'FREE' ? 'FREE' : 'ANNUAL PASS'}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-cyan-300 uppercase">{course.language}</span>
                  <span className="text-cyan-400 font-semibold flex items-center space-x-1">
                    <span>View Curriculum</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
