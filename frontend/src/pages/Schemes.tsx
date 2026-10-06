import { useEffect, useState, useMemo } from 'react';
import { ExternalLink, Landmark, Search } from 'lucide-react';
import { get } from '../api/client';
import type { Scheme } from '../types';
import { LoadingBlock, ErrorState, EmptyState } from '../components/Feedback';
import { NoticeBox } from '../components/OpportunityCard';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'livelihood', label: 'Livelihood' },
  { value: 'skilling', label: 'Skilling' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'employment', label: 'Employment' },
  { value: 'health', label: 'Health' },
];

export default function Schemes() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    get<{ items: Scheme[] }>('/schemes')
      .then((d) => setSchemes(d.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return schemes.filter(
      (s) =>
        (!needle || `${s.title} ${s.description} ${s.ministry || ''}`.toLowerCase().includes(needle)) &&
        (!cat || s.category === cat),
    );
  }, [schemes, q, cat]);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Government schemes & support</h1>
      <p className="text-stone-500 mt-1 mb-6">Plain-language summaries of programs you may be eligible for — always linking to the official source.</p>

      <NoticeBox tone="accent">
        Eligibility rules, deadlines and benefits <strong>change often</strong>. RuralRise summarizes publicly available
        information and links to official portals — but you must <strong>verify every detail on the official website</strong>
        (or with your block/panchayat office) before relying on it.
      </NoticeBox>

      <div className="flex gap-2 mt-6 mb-6 flex-wrap">
        <form className="flex flex-1 min-w-56 rounded-xl border border-stone-300 bg-white overflow-hidden max-w-md" onSubmit={(e) => e.preventDefault()} role="search">
          <div className="flex items-center pl-3 text-stone-400"><Search className="h-4 w-4" /></div>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 px-3 py-2.5 focus:outline-none" placeholder="Search schemes…" aria-label="Search schemes" />
        </form>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="border border-stone-300 rounded-lg px-3 py-2 bg-white text-sm" aria-label="Filter by category">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? <LoadingBlock /> : error ? <ErrorState message={error} onRetry={() => window.location.reload()} /> : filtered.length === 0 ? (
        <EmptyState icon={<Landmark />} title="No schemes match your search" />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((s) => (
            <article key={s.id} className="bg-white rounded-2xl shadow-card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-stone-900 leading-snug">{s.title}</h2>
                {s.isDemo && <span className="text-[10px] font-bold text-accent-600 bg-accent-50 border border-accent-300 rounded px-1.5 py-0.5 shrink-0">DEMO</span>}
              </div>
              {s.ministry && <p className="text-xs text-stone-400 mb-2">{s.ministry}</p>}
              <p className="text-sm text-stone-600 mb-3">{s.description}</p>
              {s.eligibility && (
                <p className="text-xs text-stone-600 mb-1"><strong className="text-stone-700">Eligibility:</strong> {s.eligibility}</p>
              )}
              {s.benefits && <p className="text-xs text-stone-600 mb-3"><strong className="text-stone-700">Benefits:</strong> {s.benefits}</p>}
              {s.applySteps?.length > 0 && (
                <details className="text-xs text-stone-600 mb-3">
                  <summary className="cursor-pointer font-medium text-brand-700">How to apply ({s.applySteps.length} steps)</summary>
                  <ol className="list-decimal pl-4 mt-2 space-y-1">{s.applySteps.map((step, i) => <li key={i}>{step}</li>)}</ol>
                </details>
              )}
              <div className="mt-auto pt-2 border-t border-stone-100">
                {s.officialLink ? (
                  <a href={s.officialLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
                    <ExternalLink className="h-4 w-4" /> Official source
                  </a>
                ) : (
                  <span className="text-xs text-stone-400">No official link configured — verify at your block office</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
