import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Store, IndianRupee } from 'lucide-react';
import { get } from '../api/client';
import type { BusinessIdea, BusinessPlan as Plan, MarketplaceListing } from '../types';
import { LoadingBlock, ErrorState } from '../components/Feedback';
import { NoticeBox, DemoTag } from '../components/OpportunityCard';
import { useAuth } from '../auth/AuthContext';

export default function Business() {
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      get<{ ideas: BusinessIdea[] }>('/business/ideas'),
      get<{ listings: MarketplaceListing[] }>('/marketplace'),
      user ? get<{ plans: Plan[] }>('/business/plans').catch(() => ({ plans: [] })) : Promise.resolve({ plans: [] as Plan[] }),
    ])
      .then(([i, m, p]) => { setIdeas(i.ideas); setListings(m.listings); setPlans(p.plans); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Entrepreneurship & Local Markets</h1>
      <p className="text-stone-500 mt-1 mb-6">Business ideas that work in villages — with honest cost ranges and a simple planner.</p>

      {error && <ErrorState message={error} />}

      {loading ? <LoadingBlock /> : (
        <>
          <NoticeBox tone="accent">Cost and income figures are <strong>illustrative examples only</strong>, not promises. Actual results depend on your location, effort and market.</NoticeBox>

          {/* My plans */}
          {plans.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-bold text-stone-900 mb-3">My business plans</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {plans.map((p) => (
                  <Link key={p.id} to={`/business/plans/${p.id}`} className="bg-white rounded-2xl shadow-card p-5 hover:shadow-lifted transition">
                    <h3 className="font-semibold text-stone-900">{p.title}</h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {p.milestones.filter((m) => m.done).length}/{p.milestones.length} milestones complete
                    </p>
                    <div className="h-1.5 bg-stone-100 rounded-full mt-3">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${p.milestones.length ? (p.milestones.filter((m) => m.done).length / p.milestones.length) * 100 : 0}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Ideas */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-stone-900 mb-1 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-accent-500" /> Business ideas</h2>
            <p className="text-sm text-stone-500 mb-4">Matched to skills common in rural districts.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ideas.map((idea) => (
                <article key={idea.id} className="bg-white rounded-2xl shadow-card p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-stone-900">{idea.title}</h3>
                    {idea.isDemo && <DemoTag />}
                  </div>
                  <p className="text-sm text-stone-500 line-clamp-3 mb-3">{idea.description}</p>
                  {idea.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {idea.skills.slice(0, 3).map((s) => <span key={s} className="text-[11px] bg-brand-50 text-brand-700 rounded-full px-2 py-0.5">{s}</span>)}
                    </div>
                  )}
                  <p className="mt-auto text-xs text-stone-500 flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Startup ~ {idea.startupCostMin?.toLocaleString('en-IN')}–{idea.startupCostMax?.toLocaleString('en-IN')}
                    {' · '}Income (example) {idea.monthlyIncomeMin?.toLocaleString('en-IN')}–{idea.monthlyIncomeMax?.toLocaleString('en-IN')}/mo
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Marketplace */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-stone-900 mb-1 flex items-center gap-2"><Store className="h-5 w-5 text-brand-600" /> Local marketplace</h2>
            <p className="text-sm text-stone-500 mb-4">Products and services from sellers near you. Contact sellers directly — RuralRise handles no payments.</p>
            {listings.length === 0 ? (
              <p className="text-sm text-stone-500">No listings yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((l) => (
                  <article key={l.id} className="bg-white rounded-2xl shadow-card p-5">
                    <h3 className="font-semibold text-stone-900 mb-1">{l.title}</h3>
                    <p className="text-sm text-stone-500 line-clamp-2 mb-2">{l.description}</p>
                    <p className="text-sm font-medium text-stone-800">{l.price}</p>
                    <p className="text-xs text-stone-500 mt-1">{[l.village, l.district].filter(Boolean).join(', ')}</p>
                    {l.contactValue && <p className="text-xs text-stone-500 mt-1">Contact: {l.contactValue}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
