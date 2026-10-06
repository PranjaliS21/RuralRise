import { useEffect, useState, useCallback } from 'react';
import { get, post } from '../api/client';
import { useToast } from '../components/Toast';
import { LoadingBlock, ErrorState } from '../components/Feedback';

interface Overview { users: number; youth: number; employers: number; opportunities: number; pendingOpportunities: number; applications: number; pendingListings: number; enrollments: number }
interface QueueOpp { id: string; title: string; slug: string; description: string; verification: string; category?: { name: string }; organization?: { name: string } | null }
interface QueueListing { id: string; title: string; description: string; verification: string; seller?: { name: string } }
interface AuditLog { id: string; action: string; createdAt: string; user?: { name: string; email: string } | null }

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [opps, setOpps] = useState<QueueOpp[]>([]);
  const [listings, setListings] = useState<QueueListing[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, q, a] = await Promise.all([
        get<Overview>('/admin/overview'),
        get<{ opportunities: QueueOpp[]; listings: QueueListing[] }>('/admin/review-queue'),
        get<{ items: AuditLog[] }>('/admin/audit-logs'),
      ]);
      setOverview(o);
      setOpps(q.opportunities);
      setListings(q.listings);
      setLogs(a.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (entityType: string, entityId: string, action: 'VERIFIED' | 'REJECTED') => {
    const reason = action === 'REJECTED' ? window.prompt('Reason for rejection (shown in audit log):') || undefined : undefined;
    try {
      await post('/admin/review', { entityType, entityId, action, reason });
      toast('success', `Item ${action === 'VERIFIED' ? 'approved' : 'rejected'}`);
      load();
    } catch (e) {
      toast('error', (e as Error).message);
    }
  };

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const stats = [
    { label: 'Users', value: overview!.users },
    { label: 'Youth', value: overview!.youth },
    { label: 'Employers', value: overview!.employers },
    { label: 'Opportunities', value: overview!.opportunities },
    { label: 'Pending review', value: overview!.pendingOpportunities + overview!.pendingListings },
    { label: 'Applications', value: overview!.applications },
    { label: 'Enrollments', value: overview!.enrollments },
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-6">Admin dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-card p-4">
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-stone-900 mb-1">Review queue</h2>
        <p className="text-sm text-stone-500 mb-4">New listings stay hidden until you approve them.</p>

        <h3 className="font-semibold text-stone-800 mb-3 text-sm uppercase tracking-wide">Opportunities ({opps.length})</h3>
        {opps.length === 0 ? <p className="text-sm text-stone-500 mb-6">Queue is clear ✓</p> : (
          <div className="space-y-3 mb-6">
            {opps.map((o) => (
              <div key={o.id} className="bg-white rounded-xl shadow-card p-4 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-64">
                  <p className="font-medium text-stone-900">{o.title} <span className="text-stone-400 text-sm">· {o.category?.name} · {o.organization?.name || 'no org'}</span></p>
                  <p className="text-sm text-stone-500 line-clamp-2">{o.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decide('OPPORTUNITY', o.id, 'VERIFIED')} className="bg-brand-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-brand-700">Approve</button>
                  <button onClick={() => decide('OPPORTUNITY', o.id, 'REJECTED')} className="border border-red-200 text-red-600 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 className="font-semibold text-stone-800 mb-3 text-sm uppercase tracking-wide">Marketplace listings ({listings.length})</h3>
        {listings.length === 0 ? <p className="text-sm text-stone-500">Queue is clear ✓</p> : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="bg-white rounded-xl shadow-card p-4 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-64">
                  <p className="font-medium text-stone-900">{l.title} <span className="text-stone-400 text-sm">· {l.seller?.name}</span></p>
                  <p className="text-sm text-stone-500 line-clamp-2">{l.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decide('MARKETPLACE', l.id, 'VERIFIED')} className="bg-brand-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-brand-700">Approve</button>
                  <button onClick={() => decide('MARKETPLACE', l.id, 'REJECTED')} className="border border-red-200 text-red-600 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-stone-900 mb-3">Recent audit log</h2>
        <div className="bg-white rounded-xl shadow-card divide-y divide-stone-100">
          {logs.length === 0 ? <p className="p-4 text-sm text-stone-500">No activity yet.</p> : logs.slice(0, 15).map((l) => (
            <div key={l.id} className="p-3 flex items-center gap-3 text-sm">
              <span className="font-mono text-xs text-stone-400">{new Date(l.createdAt).toLocaleString('en-IN')}</span>
              <span className="font-medium text-stone-700">{l.action}</span>
              {l.user && <span className="text-stone-500">by {l.user.name}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
