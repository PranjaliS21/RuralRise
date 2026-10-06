import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, IndianRupee, Bookmark, BookmarkCheck, BadgeCheck, ExternalLink } from 'lucide-react';
import { get, post } from '../api/client';
import type { Opportunity } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { LoadingBlock, ErrorState } from '../components/Feedback';
import { NoticeBox, DemoTag, MatchBadge, MatchReasons, WORK_TYPE_LABELS } from '../components/OpportunityCard';

export default function OpportunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    get<{ opportunity: Opportunity }>(`/opportunities/${slug}`)
      .then((d) => setOpp(d.opportunity))
      .catch((e) => setError(e.message));
  }, [slug]);

  const toggleSave = async () => {
    if (!user) { toast('info', 'Log in to save opportunities'); return navigate('/login'); }
    try {
      const res = await post<{ saved: boolean }>(`/opportunities/${opp!.id}/save`);
      setSaved(res.saved);
      toast('success', res.saved ? 'Saved to your list' : 'Removed from your list');
    } catch (e) { toast('error', (e as Error).message); }
  };

  const apply = async () => {
    setApplying(true);
    try {
      await post('/youth/applications', { opportunityId: opp!.id, coverNote: note || undefined, contactPhone: phone || undefined });
      toast('success', 'Application submitted! Track it in your dashboard.');
      setShowForm(false);
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setApplying(false);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!opp) return <LoadingBlock />;

  const isYouth = user?.role === 'YOUTH';
  const deadline = opp.deadline ? new Date(opp.deadline) : null;
  const expired = deadline ? deadline < new Date() : false;

  return (
    <article className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="bg-white rounded-2xl shadow-card p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {WORK_TYPE_LABELS[opp.workType] ?? opp.workType}
            </span>
            <h1 className="text-2xl font-bold text-stone-900 mt-2">{opp.title}</h1>
            <p className="text-sm text-stone-500 mt-1">
              {opp.organization?.name ?? 'Local employer'} {opp.organization?.verified && <BadgeCheck className="inline h-4 w-4 text-brand-600" />}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {opp.match && <MatchBadge score={opp.match.score} />}
            <button onClick={toggleSave} className="flex items-center gap-1.5 text-sm border border-stone-300 rounded-lg px-3 py-1.5 hover:bg-stone-50">
              {saved ? <BookmarkCheck className="h-4 w-4 text-brand-600" /> : <Bookmark className="h-4 w-4" />} {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-stone-600">
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{opp.isRemote ? 'Remote — work from anywhere' : [opp.village, opp.district, opp.state].filter(Boolean).join(', ')}</span>
          {(opp.compensationMin != null || opp.compensationMax != null) && (
            <span className="inline-flex items-center gap-1.5">
              <IndianRupee className="h-4 w-4" />
              {opp.compensationMin?.toLocaleString('en-IN')}{opp.compensationMax ? `–${opp.compensationMax.toLocaleString('en-IN')}` : '+'}
              {opp.paymentBasis ? ` ${opp.paymentBasis === 'monthly' ? '/month' : `per ${opp.paymentBasis.replace('per_', '')}`}` : ''} (indicative)
            </span>
          )}
          {opp.timeCommitment && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{opp.timeCommitment}</span>}
        </div>
        {opp.match && <MatchReasons reasons={opp.match.reasons} />}
      </header>

      {opp.isDemo && (
        <div className="mb-5"><NoticeBox>This is <strong>demo content</strong> included to show how RuralRise works. It is not a live listing.</NoticeBox></div>
      )}

      {expired && (
        <div className="mb-5"><NoticeBox>The deadline for this opportunity has passed. Browse the <Link to="/opportunities" className="underline font-medium">current listings</Link> instead.</NoticeBox></div>
      )}

      <section className="bg-white rounded-2xl shadow-card p-6 mb-5">
        <h2 className="font-semibold text-stone-900 mb-2">About this opportunity</h2>
        <p className="text-stone-600 whitespace-pre-line text-sm leading-relaxed">{opp.description}</p>
        {(opp.eligibility || opp.requiredEducation) && (
          <>
            <h3 className="font-semibold text-stone-900 mt-5 mb-2 text-sm">Who can apply</h3>
            <ul className="list-disc pl-5 text-sm text-stone-600 space-y-1">
              {opp.eligibility && <li>{opp.eligibility}</li>}
              {opp.requiredEducation && <li>Minimum education: {opp.requiredEducation}</li>}
            </ul>
          </>
        )}
        {opp.skills.length > 0 && (
          <>
            <h3 className="font-semibold text-stone-900 mt-5 mb-2 text-sm">Skills used</h3>
            <div className="flex flex-wrap gap-2">
              {opp.skills.map((s) => (
                <span key={s.skill.id} className="text-xs bg-brand-50 text-brand-700 border border-brand-100 rounded-full px-3 py-1">
                  {s.skill.name}{s.required ? '' : ' (nice to have)'}
                </span>
              ))}
            </div>
          </>
        )}
        {deadline && (
          <p className="mt-5 text-sm text-stone-500">Apply before <strong className="text-stone-700">{deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
        )}
      </section>

      {/* Match breakdown */}
      {opp.match && (
        <section className="bg-white rounded-2xl shadow-card p-6 mb-5">
          <h2 className="font-semibold text-stone-900 mb-1">Why this matches you</h2>
          <p className="text-xs text-stone-400 mb-3">Fit score {opp.match.score}% — based on your skills, location and preferences. Not a guarantee of selection.</p>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${opp.match.score}%` }} />
          </div>
          <MatchReasons reasons={opp.match.reasons} />
        </section>
      )}

      {/* Apply */}
      <section className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-semibold text-stone-900 mb-3">Apply</h2>
        {expired ? (
          <p className="text-sm text-stone-500">This listing is closed.</p>
        ) : !isYouth ? (
          <NoticeBox tone="brand">{user ? 'Only youth accounts can apply. Employers can post opportunities from their dashboard.' : <>Log in as a job seeker to apply — it's <Link to="/register" className="underline font-medium">free</Link>.</>}</NoticeBox>
        ) : !showForm ? (
          <button onClick={() => setShowForm(true)} className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700">
            Apply now
          </button>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="block font-medium text-stone-700 mb-1">Short note for the employer (optional)</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1500}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Why are you a good fit? Mention relevant experience." />
            </label>
            <label className="block text-sm">
              <span className="block font-medium text-stone-700 mb-1">Contact phone (optional)</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15}
                className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="+91…" />
            </label>
            <div className="flex gap-2">
              <button onClick={apply} disabled={applying} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60">
                {applying ? 'Submitting…' : 'Submit application'}
              </button>
              <button onClick={() => setShowForm(false)} className="border border-stone-300 px-4 py-2.5 rounded-xl hover:bg-stone-50">Cancel</button>
            </div>
          </div>
        )}
        {opp.sourceUrl && (
          <p className="mt-4 text-xs text-stone-400 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" /> Source: <a href={opp.sourceUrl} target="_blank" rel="noreferrer" className="underline">{opp.sourceLabel || 'original listing'}</a>
          </p>
        )}
        <p className="mt-4 text-xs text-stone-400">RuralRise never charges job seekers any fee. Report suspicious listings.</p>
      </section>
    </article>
  );
}
