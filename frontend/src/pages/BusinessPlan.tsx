import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { get, put } from '../api/client';
import type { BusinessPlan, BusinessIdea } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { LoadingBlock, ErrorState } from '../components/Feedback';

interface Milestone { label: string; done: boolean }

export default function BusinessPlan() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [ideas, setIdeas] = useState<BusinessIdea[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [targetCustomers, setTargetCustomers] = useState('');
  const [resources, setResources] = useState('');
  const [startupCost, setStartupCost] = useState('');
  const [pricingNotes, setPricingNotes] = useState('');
  const [marketingPlan, setMarketingPlan] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');

  useEffect(() => {
    Promise.all([
      get<{ items: BusinessPlan[] }>('/business/plans'),
      get<{ items: BusinessIdea[] }>('/business/ideas').catch(() => ({ items: [] })),
    ])
      .then(([p, i]) => {
        setIdeas(i.items);
        const found = p.items.find((x) => x.id === id);
        if (!found) { setError('Plan not found'); return; }
        setPlan(found);
        setTitle(found.title);
        setTargetCustomers(found.targetCustomers || '');
        setResources(found.resources || '');
        setStartupCost(found.startupCost || '');
        setPricingNotes(found.pricingNotes || '');
        setMarketingPlan(found.marketingPlan || '');
        setMilestones(found.milestones || []);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const doneCount = useMemo(() => milestones.filter((m) => m.done).length, [milestones]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await put<{ plan: BusinessPlan }>(`/business/plans/${plan!.id}`, {
        title, targetCustomers, resources, startupCost, pricingNotes, marketingPlan, milestones,
      });
      setPlan(updated.plan);
      toast('success', 'Plan saved');
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones([...milestones, { label: newMilestone.trim(), done: false }]);
    setNewMilestone('');
  };

  if (error) return <ErrorState message={error} />;
  if (!plan) return <LoadingBlock />;
  if (!user) return <ErrorState message="Please log in." />;

  const startIdea = ideas.find((i) => i.id === plan.ideaId);

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/business')} className="text-sm text-stone-500 hover:text-stone-700 mb-4">← Back to entrepreneurship</button>
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Business plan</h1>
      {startIdea && <p className="text-sm text-stone-500 mb-6">Based on idea: <strong>{startIdea.title}</strong></p>}

      <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Plan name</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Who are your customers?</span>
          <textarea value={targetCustomers} onChange={(e) => setTargetCustomers(e.target.value)} rows={2}
            className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="e.g. Hostel students and office-goers within 5 km" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">What local resources do you already have?</span>
          <textarea value={resources} onChange={(e) => setResources(e.target.value)} rows={2}
            className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="e.g. Sewing machine at home, 2 helpers, SHG link" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Estimated startup cost</span>
          <input value={startupCost} onChange={(e) => setStartupCost(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="e.g. Rs. 40,000 (Rs. 25k equipment + Rs. 15k materials)" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Pricing notes</span>
          <textarea value={pricingNotes} onChange={(e) => setPricingNotes(e.target.value)} rows={2}
            className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="e.g. Rs. 60/lunch box; Rs. 5 margin after ingredient cost" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">How will people find out about you?</span>
          <textarea value={marketingPlan} onChange={(e) => setMarketingPlan(e.target.value)} rows={2}
            className="w-full border border-stone-300 rounded-lg px-3 py-2" placeholder="e.g. WhatsApp groups, shandai stall, school notice board" />
        </label>

        {/* Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Milestones</span>
            <span className="text-xs text-stone-500">{doneCount}/{milestones.length} done</span>
          </div>
          <ul className="space-y-2 mb-2">
            {milestones.map((m, i) => (
              <li key={i} className="flex items-center gap-2">
                <input type="checkbox" checked={m.done} onChange={(e) => setMilestones(milestones.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))} />
                <span className={`text-sm ${m.done ? 'line-through text-stone-400' : ''}`}>{m.label}</span>
                <button onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} className="ml-auto text-xs text-stone-400 hover:text-red-600">Remove</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
              className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm" placeholder="Add a milestone…" />
            <button onClick={addMilestone} className="border border-stone-300 px-3 py-2 rounded-lg text-sm hover:bg-stone-50">Add</button>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save plan'}
        </button>
      </div>
      <p className="text-xs text-stone-400 mt-4">
        Need funding help? Check the <Link to="/schemes" className="underline">government schemes</Link> page for MUDRA and PMEGP loans.
      </p>
    </div>
  );
}
