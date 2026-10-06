import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { get } from '../api/client';
import type { Category, Opportunity, Paginated } from '../types';
import { OpportunityCard } from '../components/OpportunityCard';
import { LoadingBlock, ErrorState, EmptyState, SkeletonCard } from '../components/Feedback';

const WORK_TYPES = [
  { value: '', label: 'All types' },
  { value: 'LOCAL_JOB', label: 'Local jobs' },
  { value: 'REMOTE_JOB', label: 'Remote' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'APPRENTICESHIP', label: 'Apprenticeships' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'GIG', label: 'Gigs' },
  { value: 'SELF_EMPLOYMENT', label: 'Self-employment' },
];

export default function Opportunities() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<Paginated<Opportunity> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const workType = params.get('workType') || '';
  const remote = params.get('remote') === '1';
  const sort = params.get('sort') || 'recent';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    get<{ categories: Category[] }>('/categories').then((d) => setCategories(d.categories)).catch(() => undefined);
  }, []);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (category) sp.set('category', category);
    if (workType) sp.set('workType', workType);
    if (remote) sp.set('remote', '1');
    if (sort) sp.set('sort', sort);
    sp.set('page', String(page));
    try {
      const res = await fetch(`/api/opportunities?${sp}`, { signal, credentials: 'include' });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setData((await res.json()) as Paginated<Opportunity>);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q, category, workType, remote, sort, page]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const activeFilters = [category, workType, remote ? 'remote' : '', sort !== 'recent' ? sort : ''].filter(Boolean).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Browse opportunities</h1>
          <p className="text-sm text-stone-500 mt-1">
            {data ? `${data.total} verified opportunities` : 'Loading…'} — sorted by {sort === 'relevance' ? 'best match for you' : 'newest first'}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => update('sort', e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
            aria-label="Sort"
          >
            <option value="recent">Newest first</option>
            <option value="relevance">Best match for me</option>
          </select>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white hover:bg-stone-50"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters{activeFilters > 0 && <span className="bg-brand-600 text-white text-xs rounded-full px-1.5">{activeFilters}</span>}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <form className="flex rounded-xl border border-stone-300 bg-white overflow-hidden mb-4" onSubmit={(e) => { e.preventDefault(); update('q', (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value); }} role="search">
        <div className="flex items-center pl-3 text-stone-400"><Search className="h-4 w-4" /></div>
        <input name="q" defaultValue={q} className="flex-1 px-3 py-2.5 focus:outline-none" placeholder="Search by title, skill or keyword…" aria-label="Search" />
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-5 text-sm font-medium">Search</button>
      </form>

      {/* Filters */}
      {filtersOpen && (
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="block text-stone-600 mb-1 font-medium">Category</span>
            <select value={category} onChange={(e) => update('category', e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-stone-600 mb-1 font-medium">Work type</span>
            <select value={workType} onChange={(e) => update('workType', e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2">
              {WORK_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
            </select>
          </label>
          <label className="text-sm flex items-end">
            <span className="flex items-center gap-2 w-full border border-stone-300 rounded-lg px-3 py-2.5">
              <input type="checkbox" checked={remote} onChange={(e) => update('remote', e.target.checked ? '1' : '')} />
              <span className="font-medium">Remote only</span>
            </span>
          </label>
        </div>
      )}

      {loading && !data ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(new AbortController().signal)} />
      ) : data && data.items.length === 0 ? (
        <EmptyState title="No opportunities match your filters" body="Try removing some filters or searching for a different skill." />
      ) : data ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((o) => <OpportunityCard key={o.id} opp={o} />)}
          </div>
          {data.pages > 1 && (
            <nav className="flex justify-center items-center gap-2 mt-8" aria-label="Pagination">
              <button disabled={page <= 1} onClick={() => update('page', String(page - 1))} className="px-3 py-1.5 rounded-lg border border-stone-300 text-sm disabled:opacity-40 bg-white">Previous</button>
              <span className="text-sm text-stone-500">Page {page} of {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => update('page', String(page + 1))} className="px-3 py-1.5 rounded-lg border border-stone-300 text-sm disabled:opacity-40 bg-white">Next</button>
            </nav>
          )}
        </>
      ) : null}
    </div>
  );
}
