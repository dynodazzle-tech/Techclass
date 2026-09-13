import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TestPaper } from '../types';
import { FileCheck2, Clock, Award, Filter, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface TestsPageProps {
  navigate: (path: string) => void;
}

export const TestsPage: React.FC<TestsPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tests, setTests] = useState<TestPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [userAttempts, setUserAttempts] = useState<Record<string, any>>({});

  useEffect(() => {
    // Fetch user's previous attempts to link results
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/student/test-attempts', { headers })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data)) {
          const map: Record<string, any> = {};
          data.forEach(att => {
            if (!map[att.test_id]) {
              map[att.test_id] = att;
            }
          });
          setUserAttempts(map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = '/api/tests?';
    if (selectedExam !== 'ALL') url += `exam=${encodeURIComponent(selectedExam)}&`;
    if (selectedType !== 'ALL') url += `type=${encodeURIComponent(selectedType)}&`;

    fetch(url)
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (Array.isArray(data)) setTests(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedExam, selectedType]);

  const exams = ['ALL', 'MPSC', 'SSC', 'UPSC', 'Police Bharti', 'Banking'];
  const types = ['ALL', 'MOCK', 'PRACTICE', 'PYQ'];

  const isPaid = user?.membership_status === 'ACTIVE' || user?.role === 'PAID_STUDENT' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Real Exam Simulation Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Government Exam Mock Tests</h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Practice high-yield full-length tests and topic quizzes designed to match recent MPSC, SSC, and central government question trends with tri-lingual translations (English, हिन्दी, मराठी).
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Exam:</span>
          </span>
          {exams.map(e => (
            <button
              key={e}
              onClick={() => setSelectedExam(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
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
          <span className="text-xs font-semibold text-slate-400">Type:</span>
          {types.map(tType => (
            <button
              key={tType}
              onClick={() => setSelectedType(tType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedType === tType
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tType === 'ALL' ? 'All Types' : tType}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading test series...</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          No mock tests found matching current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map(test => {
            const needsUpgrade = test.access_type === 'MEMBERSHIP' && !isPaid;

            return (
              <div
                key={test.id}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 hover:bg-slate-900 transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {test.exam}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      test.access_type === 'FREE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {test.access_type === 'FREE' ? 'FREE TEST' : 'ANNUAL PASS'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug line-clamp-2">{test.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{test.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-3 px-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="text-slate-500 text-[10px]">TIME</div>
                      <div className="text-white font-semibold">{test.duration_minutes}m</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">MARKS</div>
                      <div className="text-white font-semibold">{test.total_marks}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">NEGATIVE</div>
                      <div className="text-red-400 font-semibold">{test.negative_marking_ratio * 100}%</div>
                    </div>
                  </div>

                  {userAttempts[test.id] && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-slate-300 text-[11px]">Recorded:</span>
                        <strong className="text-cyan-400 font-bold text-xs">
                          {userAttempts[test.id].score} / {test.total_marks} ({userAttempts[test.id].percentage}%)
                        </strong>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {userAttempts[test.id].accuracy}% acc
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-cyan-400">EN | हिन्दी | मराठी</span>
                  {needsUpgrade ? (
                    <button
                      onClick={() => navigate('/pricing')}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center space-x-1"
                    >
                      <span>Unlock Pass</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : userAttempts[test.id] ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/test/${test.id}/result?attemptId=${userAttempts[test.id].id}`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold text-xs transition flex items-center space-x-1"
                      >
                        <span>View Result</span>
                      </button>
                      <button
                        onClick={() => navigate(`/test/${test.id}`)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1 shadow-sm"
                      >
                        <span>Retake</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(`/test/${test.id}`)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1 shadow-md shadow-cyan-500/10"
                    >
                      <span>Start Test</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
