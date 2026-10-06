import { useEffect, useState } from 'react';
import { GraduationCap, Search, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { get, post } from '../api/client';
import type { TrainingProgram } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { LoadingBlock, ErrorState, EmptyState } from '../components/Feedback';
import { NoticeBox } from '../components/OpportunityCard';

export default function Skills() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const toast = useToast();

  const load = (query = '') => {
    setLoading(true);
    get<{ items: TrainingProgram[] }>(`/training${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      .then((d) => setPrograms(d.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (user) {
      get<{ items: { trainingProgram: { id: string } }[] }>('/youth/enrollments')
        .then((d) => setEnrolled(new Set(d.items.map((e) => e.trainingProgram.id))))
        .catch(() => undefined);
    }
  }, [user]);

  const enroll = async (program: TrainingProgram) => {
    if (!user) { toast('info', 'Log in to track your training'); return; }
    try {
      await post('/training/enroll', { trainingProgramId: program.id });
      setEnrolled((s) => new Set(s).add(program.id));
      toast('success', `Enrolled: ${program.title}`);
    } catch (e) {
      toast('error', (e as Error).message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Skills & Training</h1>
      <p className="text-stone-500 mt-1 mb-6">Find free and subsidized programs near you — and track what you've started.</p>

      <form className="flex rounded-xl border border-stone-300 bg-white overflow-hidden mb-6 max-w-xl" onSubmit={(e) => { e.preventDefault(); load(q); }} role="search">
        <div className="flex items-center pl-3 text-stone-400"><Search className="h-4 w-4" /></div>
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 px-3 py-2.5 focus:outline-none" placeholder="Search programs or skills…" aria-label="Search training" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-5 text-sm font-medium">Search</button>
      </form>

      <div className="mb-6"><NoticeBox tone="brand">Programs marked <strong>Demo</strong> are sample listings. Before enrolling in any program, verify the provider and fees on the official website linked in each card.</NoticeBox></div>

      {loading ? <LoadingBlock /> : error ? <ErrorState message={error} onRetry={() => load(q)} /> : programs.length === 0 ? (
        <EmptyState icon={<GraduationCap />} title="No programs found" body="Try a different search term." />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {programs.map((p) => (
            <article key={p.id} className="bg-white rounded-2xl shadow-card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-semibold text-stone-900">{p.title}</h2>
                {p.isDemo && <span className="text-[10px] font-bold text-accent-600 bg-accent-50 border border-accent-300 rounded px-1.5 py-0.5 shrink-0">DEMO</span>}
              </div>
              <p className="text-sm text-stone-500 line-clamp-2 mb-3">{p.description}</p>
              <dl className="text-xs text-stone-600 grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                <div><dt className="inline font-medium">Provider:</dt> <dd className="inline">{p.providerName}</dd></div>
                <div><dt className="inline font-medium">Duration:</dt> <dd className="inline">{p.duration || '—'}</dd></div>
                <div><dt className="inline font-medium">Mode:</dt> <dd className="inline capitalize">{p.mode || '—'}</dd></div>
                <div><dt className="inline font-medium">Fee:</dt> <dd className="inline">{p.fee || '—'}</dd></div>
              </dl>
              {p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.skills.slice(0, 4).map((s) => (
                    <span key={s.skill.id} className="text-[11px] bg-brand-50 text-brand-700 rounded-full px-2 py-0.5">{s.skill.name}</span>
                  ))}
                </div>
              )}
              <div className="mt-auto flex items-center gap-2">
                {user && (enrolled.has(p.id) ? (
                  <span className="flex items-center gap-1 text-sm text-brand-700 font-medium"><CheckCircle2 className="h-4 w-4" /> Enrolled</span>
                ) : (
                  <button onClick={() => enroll(p)} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-700">Track this program</button>
                ))}
                {p.link && (
                  <a href={p.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-stone-600 hover:text-brand-700 border border-stone-300 px-3 py-2 rounded-lg">
                    Official site <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
                {p.certification && <span className="ml-auto text-[11px] text-stone-500">Certificate</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
