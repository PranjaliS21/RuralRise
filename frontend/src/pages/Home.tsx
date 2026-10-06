import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Search, MapPin, Sprout, BookOpen, Landmark, ChevronRight, ShieldCheck } from 'lucide-react';
import { get } from '../api/client';
import type { Opportunity, Paginated } from '../types';
import { OpportunityCard } from '../components/OpportunityCard';
import { useAuth } from '../auth/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<Opportunity[]>([]);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    get<Paginated<Opportunity>>('/opportunities?limit=3&sort=recent')
      .then((d) => { setRecent(d.items); setCount(d.total); })
      .catch(() => undefined);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white rounded-3xl px-6 py-14 md:py-20 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-brand-900 leading-tight max-w-3xl mx-auto">
          Local opportunity, local prosperity.
        </h1>
        <p className="mt-4 text-stone-600 max-w-2xl mx-auto text-lg">
          RuralRise brings together <strong>verified jobs, gigs and self-employment</strong> near you —
          plus skills, business ideas and government schemes. Built for village life, not just city careers.
        </p>
        <form
          className="mt-8 max-w-xl mx-auto flex shadow-lifted rounded-xl overflow-hidden bg-white"
          onSubmit={(e) => { e.preventDefault(); window.location.href = `/opportunities?q=${encodeURIComponent(q)}`; }}
          role="search"
        >
          <div className="flex items-center pl-4 text-stone-400"><Search className="h-5 w-5" /></div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 px-3 py-3.5 text-stone-800 focus:outline-none"
            placeholder="Search tailoring, poultry, data entry…"
            aria-label="Search opportunities"
          />
          <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 font-medium" type="submit">Search</button>
        </form>
        <p className="mt-4 text-sm text-stone-500">
          {count !== null ? `${count} live opportunities in the directory` : 'Loading live opportunities…'} · Free for every job seeker, always.
        </p>
      </section>

      {/* How it helps */}
      <section className="grid md:grid-cols-3 gap-5 mt-10">
        {[
          { icon: <Sprout className="h-6 w-6" />, title: 'Work near home', body: 'Local jobs, apprenticeships, gigs and remote work — matched to your skills and your village.' },
          { icon: <BookOpen className="h-6 w-6" />, title: 'Learn and level up', body: 'Find free and subsidized training near you, and close the exact skills local employers ask for.' },
          { icon: <Landmark className="h-6 w-6" />, title: 'Get what you\'re owed', body: 'Government schemes explained in plain language, with the official source always one click away.' },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl shadow-card p-6">
            <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-4">{f.icon}</div>
            <h2 className="font-semibold text-lg text-stone-900 mb-1">{f.title}</h2>
            <p className="text-sm text-stone-500">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Trust line */}
      <section className="mt-8 bg-brand-900 text-brand-100 rounded-2xl px-6 py-5 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-brand-300 shrink-0" />
        <p className="text-sm">
          Every listing is <strong className="text-white">manually reviewed</strong> before it goes live. Sample content is clearly
          marked <strong className="text-white">Demo</strong>. Match scores show profile fit — never a promise of selection.
        </p>
      </section>

      {/* Recent opportunities */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Fresh opportunities</h2>
            <p className="text-sm text-stone-500">Newly verified listings from the directory</p>
          </div>
          <Link to="/opportunities" className="text-brand-700 font-medium text-sm inline-flex items-center hover:underline">
            Browse all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {recent.map((o) => <OpportunityCard key={o.id} opp={o} />)}
          {recent.length === 0 && (
            <p className="text-sm text-stone-500 md:col-span-3">No opportunities yet — the backend may still be starting up.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-12 bg-white rounded-2xl shadow-card p-8 md:p-10 text-center">
        <h2 className="text-2xl font-bold text-stone-900">Your skills are worth more here.</h2>
        <p className="mt-2 text-stone-600 max-w-xl mx-auto text-sm md:text-base">
          {user ? 'Complete your profile to sharpen your match scores.' : 'Create a free profile — we\'ll match you to work near home and show you exactly how to close your skill gaps.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {user ? (
            <Link to="/profile" className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700">Complete my profile</Link>
          ) : (
            <>
              <Link to="/register" className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700">Join free</Link>
              <Link to="/opportunities" className="border border-stone-300 px-6 py-3 rounded-xl font-medium hover:bg-stone-50">Just browsing</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
