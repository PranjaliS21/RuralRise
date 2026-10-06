import { Sprout, Users, Target, HeartHandshake } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-brand-900 mb-3">About RuralRise</h1>
      <p className="text-lg text-stone-600 mb-10">Find opportunity. Build income. Stay rooted.</p>

      <div className="bg-white rounded-2xl shadow-card p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center"><Sprout className="h-5 w-5" /></span>
          <h2 className="text-xl font-semibold text-stone-900">Our mission</h2>
        </div>
        <p className="text-stone-600">
          Millions of young people in India's villages migrate to cities not because they want to leave,
          but because they can't see a way to earn where they live. RuralRise exists to make the local
          economy <strong>visible and navigable</strong> — surfacing real jobs, gigs, training and schemes
          that let a young person build a decent income <em>within reach of home</em>.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"><Target className="h-5 w-5" /></span>
          <h2 className="text-xl font-semibold text-stone-900">The problem</h2>
        </div>
        <ul className="list-disc pl-5 space-y-2 text-stone-600">
          <li><strong>Opportunity is invisible.</strong> Work exists — a poultry unit hiring, a tailoring order, a data-entry gig — but nobody posts it where village youth look.</li>
          <li><strong>Information travels by word of mouth.</strong> Government schemes go unused because eligibility and application steps are opaque.</li>
          <li><strong>Skill signals are missing.</strong> A young person may be perfectly suited to a nearby job and never know it, because no one maps skills to local demand.</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center"><HeartHandshake className="h-5 w-5" /></span>
          <h2 className="text-xl font-semibold text-stone-900">Our solution</h2>
        </div>
        <p className="text-stone-600 mb-3">One trusted place that connects four dots:</p>
        <ol className="list-decimal pl-5 space-y-2 text-stone-600">
          <li><strong>Verified opportunities</strong> — local jobs, apprenticeships, gigs, remote work, each reviewed before publishing.</li>
          <li><strong>Skills & training</strong> — a directory of real programs with a skill-gap view that points to what local employers actually ask for.</li>
          <li><strong>Entrepreneurship</strong> — local business ideas with honest startup-cost ranges and a simple planner.</li>
          <li><strong>Government schemes</strong> — plain-language summaries that always link to the official source.</li>
        </ol>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center"><Users className="h-5 w-5" /></span>
          <h2 className="text-xl font-semibold text-stone-900">Intended impact</h2>
        </div>
        <p className="text-stone-600">
          Fewer forced migrations, more first pay-cheques earned at home, and villages that keep their
          young people. We measure ourselves by one number: <strong>incomes built without leaving</strong>.
        </p>
        <p className="mt-4 text-sm text-stone-500">
          This is an early version. Match scores describe fit with your profile — they are not a
          prediction of hiring or earnings, and scheme details must always be verified on official portals.
        </p>
      </div>
    </div>
  );
}
