import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api/client';
import type { Opportunity } from '../types';
import { OpportunityCard, MatchBadge } from '../components/OpportunityCard';
import { LoadingBlock, ErrorState, EmptyState } from '../components/Feedback';
import { useAuth } from '../auth/AuthContext';
import { Briefcase, Bookmark, GraduationCap, Target } from 'lucide-react';

interface DashboardData {
  profile: { completion: number; name?: string } | null;
  applications: { id: string; status: string; opportunity: { slug: string; title: string } }[];
  saved: { opportunity: { slug: string; title: string } }[];
  enrollments: { id: string; progress: number; completed?: boolean; trainingProgram: { slug: string; title: string } }[];
  matches: Opportunity[];
  recommendedSkills: { name: string; count: number; trainings: string[] }[];
  stats: { openMatches: number; savedCount: number; applicationCount: number };
}

const STATUS_STEPS = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED'];

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-stone-500 mb-1">
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function YouthDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { user } = useAuth();
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    get<DashboardData>('/youth/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, [reloadKey]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <LoadingBlock label="Loading your dashboard…" />;

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900">Namaste, {firstName} 👋</h1>
        <p className="text-stone-500 mt-1">Here's your opportunity snapshot.</p>
      </header>

      {/* Profile completion */}
      {data.profile && data.profile.completion < 100 && (
        <section className="bg-accent-50 border border-accent-300 rounded-2xl p-5 mb-6">
          <ProgressBar value={data.profile.completion} label="Profile completion" />
          <p className="text-sm text-accent-600 mt-2">A complete profile means sharper match scores. <Link to="/profile" className="underline font-medium">Update your profile →</Link></p>
        </section>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Target className="h-5 w-5" />, label: 'Open opportunities', value: data.stats.openMatches, to: '/opportunities' },
          { icon: <Briefcase className="h-5 w-5" />, label: 'My applications', value: data.stats.applicationCount, to: '/opportunities' },
          { icon: <Bookmark className="h-5 w-5" />, label: 'Saved', value: data.stats.savedCount, to: '/opportunities?saved=1' },
          { icon: <GraduationCap className="h-5 w-5" />, label: 'Trainings tracked', value: data.enrollments.length, to: '/skills' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="bg-white rounded-2xl shadow-card p-5 hover:shadow-lifted transition">
            <div className="text-brand-600 mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </Link>
        ))}
      </section>

      {/* Top matches */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Top matches for you</h2>
            <p className="text-xs text-stone-500">Based on your skills, location and interests — fit score, not a hiring guarantee.</p>
          </div>
          <Link to="/opportunities?sort=relevance" className="text-sm font-medium text-brand-700 hover:underline">See all</Link>
        </div>
        {data.matches.length === 0 ? (
          <EmptyState title="Complete your profile to unlock matches" body="Add your skills, village/district and interests." action={<Link to="/profile" className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-medium">Complete profile</Link>} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.matches.map((o) => <OpportunityCard key={o.id} opp={o} />)}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Applications */}
        <section className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-semibold text-stone-900 mb-4">My applications</h2>
          {data.applications.length === 0 ? (
            <p className="text-sm text-stone-500">No applications yet. <Link to="/opportunities" className="text-brand-700 underline">Browse opportunities →</Link></p>
          ) : (
            <ul className="space-y-4">
              {data.applications.map((a) => {
                const stepIdx = STATUS_STEPS.indexOf(a.status);
                return (
                  <li key={a.id}>
                    <Link to={`/opportunities/${a.opportunity.slug}`} className="text-sm font-medium text-stone-800 hover:text-brand-700">{a.opportunity.title}</Link>
                    <p className="text-xs text-stone-500 mt-1">Status: <strong className="text-stone-700">{a.status.replace('_', ' ').toLowerCase()}</strong></p>
                    {stepIdx >= 0 && (
                      <div className="flex gap-1 mt-2">
                        {STATUS_STEPS.map((s, i) => (
                          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIdx ? 'bg-brand-500' : 'bg-stone-100'}`} title={s} />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Saved */}
        <section className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-semibold text-stone-900 mb-4">Saved opportunities</h2>
          {data.saved.length === 0 ? (
            <p className="text-sm text-stone-500">Nothing saved yet — tap Save on any listing.</p>
          ) : (
            <ul className="space-y-2">
              {data.saved.map((s) => (
                <li key={s.opportunity.slug}>
                  <Link to={`/opportunities/${s.opportunity.slug}`} className="text-sm text-stone-700 hover:text-brand-700">{s.opportunity.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recommended skills */}
        <section className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-semibold text-stone-900 mb-1">Skills that raise your match score</h2>
          <p className="text-xs text-stone-500 mb-4">Most-demanded by nearby employers that you haven't listed yet.</p>
          {data.recommendedSkills.length === 0 ? (
            <p className="text-sm text-stone-500">Your skills already cover the local demand we track. Great!</p>
          ) : (
            <ul className="space-y-3">
              {data.recommendedSkills.map((s) => (
                <li key={s.name} className="flex items-start gap-3">
                  <span className="bg-brand-50 text-brand-700 text-xs font-semibold rounded-full px-2.5 py-1 shrink-0">{s.name}</span>
                  <span className="text-xs text-stone-500">
                    asked for in {s.count} open listing{s.count > 1 ? 's' : ''}
                    {s.trainings.length > 0 && <> · learn it: {s.trainings.join(', ')}</>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Learning */}
        <section className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-semibold text-stone-900 mb-4">My learning</h2>
          {data.enrollments.length === 0 ? (
            <p className="text-sm text-stone-500">Not tracking any program yet. <Link to="/skills" className="text-brand-700 underline">Explore training →</Link></p>
          ) : (
            <ul className="space-y-4">
              {data.enrollments.map((e) => (
                <li key={e.id}>
                  <Link to="/skills" className="text-sm font-medium text-stone-800 hover:text-brand-700">{e.trainingProgram.title}</Link>
                  <div className="mt-1.5"><ProgressBar value={e.progress} label={e.completed ? 'Completed 🎉' : 'Progress'} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
