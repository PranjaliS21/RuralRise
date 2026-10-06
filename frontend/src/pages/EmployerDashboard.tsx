import { useEffect, useState, FormEvent, useCallback } from 'react';
import { get, post, put } from '../api/client';
import type { Category, Opportunity } from '../types';
import { useToast } from '../components/Toast';
import { LoadingBlock, ErrorState, EmptyState } from '../components/Feedback';

interface MyOpp extends Opportunity { status: string; _count?: { applications: number } }
interface AppItem {
  id: string; status: string; coverNote?: string | null; contactPhone?: string | null; createdAt: string;
  opportunity: { title: string; slug: string };
  candidate: { name: string; district?: string | null; phone?: string | null };
  user: { profile?: { skills?: unknown; education?: string | null } | null };
}
interface Org { id: string; name: string; about?: string | null; district?: string | null; verified: boolean }

const WORK_TYPES = ['LOCAL_JOB', 'REMOTE_JOB', 'PART_TIME', 'APPRENTICESHIP', 'INTERNSHIP', 'FREELANCE', 'GIG', 'SELF_EMPLOYMENT', 'SELL_PRODUCT_SERVICE'];
const STATUSES = ['UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];

const emptyForm = {
  title: '', description: '', categorySlug: '', workType: 'LOCAL_JOB', isRemote: false,
  village: '', district: '', compensationMin: '', compensationMax: '', paymentBasis: 'monthly',
  eligibility: '', requiredEducation: '', timeCommitment: '', applicationInstructions: '',
  skillNames: '', deadline: '',
};

export default function EmployerDashboard() {
  const [tab, setTab] = useState<'listings' | 'applications' | 'post'>('listings');
  const [opps, setOpps] = useState<MyOpp[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, a, c] = await Promise.all([
        get<{ items: MyOpp[] }>('/employer/opportunities'),
        get<{ items: AppItem[] }>('/employer/applications'),
        get<{ categories: Category[] }>('/categories'),
      ]);
      setOpps(o.items); setApps(a.items); setCats(c.categories);
      setForm((f) => ({ ...f, categorySlug: f.categorySlug || c.categories[0]?.slug || '' }));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitListing = async (e: FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      await post('/employer/opportunities', {
        title: form.title,
        description: form.description,
        categorySlug: form.categorySlug,
        workType: form.workType,
        isRemote: form.isRemote,
        village: form.village || undefined,
        district: form.district || undefined,
        compensationMin: form.compensationMin ? Number(form.compensationMin) : undefined,
        compensationMax: form.compensationMax ? Number(form.compensationMax) : undefined,
        paymentBasis: form.paymentBasis,
        eligibility: form.eligibility || undefined,
        requiredEducation: form.requiredEducation || undefined,
        timeCommitment: form.timeCommitment || undefined,
        applicationInstructions: form.applicationInstructions || undefined,
        skillNames: form.skillNames.split(',').map((s) => s.trim()).filter(Boolean),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      });
      toast('success', 'Listing submitted — it will appear after admin verification.');
      setForm(emptyForm);
      setTab('listings');
      load();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const setStatus = async (applicationId: string, status: string) => {
    try {
      await put('/employer/applications/status', { applicationId, status });
      toast('success', `Application marked ${status.toLowerCase().replace('_', ' ')}`);
      load();
    } catch (e) {
      toast('error', (e as Error).message);
    }
  };

  const togglePause = async (o: MyOpp) => {
    try {
      await put(`/employer/opportunities/${o.id}`, { status: o.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' });
      load();
    } catch (e) { toast('error', (e as Error).message); }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-6">Employer dashboard</h1>

      <div className="flex gap-2 mb-6 border-b border-stone-200" role="tablist">
        {(['listings', 'applications', 'post'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}>
            {t === 'listings' ? `My listings (${opps.length})` : t === 'applications' ? `Applications (${apps.length})` : 'Post opportunity'}
          </button>
        ))}
      </div>

      {tab === 'listings' && (
        opps.length === 0 ? (
          <EmptyState title="No listings yet" body="Post your first opportunity to start receiving applications."
            action={<button onClick={() => setTab('post')} className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium">Post opportunity</button>} />
        ) : (
          <div className="space-y-4">
            {opps.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl shadow-card p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-60">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900">{o.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'ACTIVE' ? 'bg-brand-100 text-brand-700' : 'bg-stone-100 text-stone-500'}`}>{o.status}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.verification === 'VERIFIED' ? 'bg-brand-50 text-brand-600' : o.verification === 'PENDING' ? 'bg-accent-50 text-accent-600' : 'bg-red-50 text-red-600'}`}>
                      {o.verification}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 mt-1">{o.category.name} · {o.isRemote ? 'Remote' : o.district}</p>
                </div>
                <p className="text-sm text-stone-600">{o._count?.applications ?? 0} application(s)</p>
                <button onClick={() => togglePause(o)} className="text-sm border border-stone-300 px-3 py-1.5 rounded-lg hover:bg-stone-50">
                  {o.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'applications' && (
        apps.length === 0 ? (
          <EmptyState title="No applications yet" body="Applications appear here as candidates apply to your listings." />
        ) : (
          <div className="space-y-4">
            {apps.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl shadow-card p-5">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div>
                    <p className="font-medium text-stone-900">{a.candidate.name} <span className="text-stone-400 text-sm">· {a.candidate.district || '—'}</span></p>
                    <p className="text-sm text-stone-600">applied for <strong>{a.opportunity.title}</strong></p>
                    <p className="text-xs text-stone-500 mt-1">Status: {a.status.replace('_', ' ').toLowerCase()}{a.contactPhone ? ` · ${a.contactPhone}` : ''}</p>
                    {a.user.profile && Array.isArray(a.user.profile.skills) && (a.user.profile.skills as string[]).length > 0 && (
                      <p className="text-xs text-stone-500 mt-1">Skills: {(a.user.profile.skills as string[]).join(', ')}{a.user.profile.education ? ` · Education: ${a.user.profile.education}` : ''}</p>
                    )}
                    {a.coverNote && <p className="text-sm text-stone-600 mt-2 border-l-2 border-stone-200 pl-3">{a.coverNote}</p>}
                  </div>
                  <select
                    aria-label={`Update status for ${a.candidate.name}`}
                    value={STATUSES.includes(a.status) ? a.status : 'UNDER_REVIEW'}
                    onChange={(e) => setStatus(a.id, e.target.value)}
                    className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'post' && (
        <form onSubmit={submitListing} className="bg-white rounded-2xl shadow-card p-6 max-w-2xl space-y-4" noValidate>
          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-1">Title *</span>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-1">Description * <span className="text-stone-400 font-normal">(min 20 chars)</span></span>
            <textarea required minLength={20} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Category *</span>
              <select required value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white">
                {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Work type *</span>
              <select value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white">
                {WORK_TYPES.map((w) => <option key={w} value={w}>{w.replace(/_/g, ' ').toLowerCase()}</option>)}
              </select>
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Village</span>
              <input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">District</span>
              <input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
            </label>
            <label className="block flex items-end">
              <span className="flex items-center gap-2 w-full py-2.5">
                <input type="checkbox" checked={form.isRemote} onChange={(e) => setForm({ ...form, isRemote: e.target.checked })} />
                <span className="text-sm font-medium text-stone-700">Remote work</span>
              </span>
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Pay from (₹, indicative)</span>
              <input type="number" min="0" value={form.compensationMin} onChange={(e) => setForm({ ...form, compensationMin: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Pay up to (₹)</span>
              <input type="number" min="0" value={form.compensationMax} onChange={(e) => setForm({ ...form, compensationMax: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Payment basis</span>
              <select value={form.paymentBasis} onChange={(e) => setForm({ ...form, paymentBasis: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white">
                {['monthly', 'weekly', 'per_task', 'per_day', 'commission'].map((b) => <option key={b} value={b}>{b.replace('_', ' ')}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-1">Required skills <span className="text-stone-400 font-normal">(comma-separated)</span></span>
            <input value={form.skillNames} onChange={(e) => setForm({ ...form, skillNames: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" placeholder="Tailoring, Customer Service" />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Eligibility notes</span>
              <input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Minimum education</span>
              <input value={form.requiredEducation} onChange={(e) => setForm({ ...form, requiredEducation: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" placeholder="e.g. 10th" />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Time commitment</span>
              <input value={form.timeCommitment} onChange={(e) => setForm({ ...form, timeCommitment: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" placeholder="e.g. Full time" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-stone-700 mb-1">Application deadline</span>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
            </label>
          </div>
          <button disabled={posting} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60">
            {posting ? 'Submitting…' : 'Submit for review'}
          </button>
          <p className="text-xs text-stone-400">All new listings go through admin verification before becoming public.</p>
        </form>
      )}
    </div>
  );
}
