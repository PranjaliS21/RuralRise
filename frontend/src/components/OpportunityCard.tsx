import { Link } from 'react-router-dom';
import { BadgeCheck, Sparkles, Info, MapPin, Clock, IndianRupee } from 'lucide-react';
import type { Opportunity } from '../types';

export const WORK_TYPE_LABELS: Record<string, string> = {
  LOCAL_JOB: 'Local job', REMOTE_JOB: 'Remote job', PART_TIME: 'Part-time',
  APPRENTICESHIP: 'Apprenticeship', INTERNSHIP: 'Internship', FREELANCE: 'Freelance',
  GIG: 'Gig work', SELF_EMPLOYMENT: 'Self-employment', SELL_PRODUCT_SERVICE: 'Sell product/service',
};

export function MatchBadge({ score }: { score: number }) {
  const tone =
    score >= 70 ? 'bg-brand-600 text-white' : score >= 45 ? 'bg-accent-100 text-accent-600' : 'bg-stone-100 text-stone-600';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}>
      <Sparkles className="h-3 w-3" aria-hidden="true" /> {score}% match
    </span>
  );
}

export function DemoTag() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-100 text-accent-600 text-[11px] font-semibold uppercase tracking-wide">
      Demo
    </span>
  );
}

export function VerifiedTag({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> {label}
    </span>
  );
}

export function MatchReasons({ reasons }: { reasons?: { type: string; text: string }[] }) {
  if (!reasons?.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {reasons.slice(0, 3).map((r, i) => (
        <li key={i} className={`text-xs flex items-start gap-1.5 ${r.type === 'improve' ? 'text-accent-600' : 'text-brand-600'}`}>
          <span aria-hidden="true">{r.type === 'improve' ? '↑' : '✓'}</span>
          <span>{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <Link
      to={`/opportunities/${opp.slug}`}
      className="block bg-white rounded-2xl shadow-card hover:shadow-lifted transition p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
          {WORK_TYPE_LABELS[opp.workType] ?? opp.workType}
        </span>
        {opp.match && <MatchBadge score={opp.match.score} />}
      </div>
      <h3 className="font-semibold text-stone-900 leading-snug mb-1">{opp.title}</h3>
      <p className="text-sm text-stone-500 line-clamp-2 mb-3">{opp.description}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mb-3">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{opp.isRemote ? 'Remote' : opp.district || 'Local'}</span>
        {(opp.compensationMin != null || opp.compensationMax != null) && (
          <span className="inline-flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5" />
            {opp.compensationMin?.toLocaleString('en-IN')}{opp.compensationMax ? `–${opp.compensationMax.toLocaleString('en-IN')}` : '+'}
            {opp.paymentBasis === 'monthly' ? '/mo (example)' : ''}
          </span>
        )}
        {opp.timeCommitment && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{opp.timeCommitment}</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {opp.verification === 'VERIFIED' && <VerifiedTag />}
        {opp.isDemo && <DemoTag />}
        <span className="text-xs text-stone-400 ml-auto">{opp.category.name}</span>
      </div>
      {opp.match && <MatchReasons reasons={opp.match.reasons} />}
    </Link>
  );
}

export function NoticeBox({ children, tone = 'accent' }: { children: React.ReactNode; tone?: 'accent' | 'brand' }) {
  const tones = {
    accent: 'bg-accent-50 border-accent-300 text-accent-600',
    brand: 'bg-brand-50 border-brand-200 text-brand-700',
  };
  return (
    <div className={`flex gap-2 border rounded-xl px-4 py-3 text-sm ${tones[tone]}`}>
      <Info className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
