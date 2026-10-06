import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, put, del } from '../api/client';
import type { YouthProfile } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { LoadingBlock } from '../components/Feedback';

const EDUCATION = ['', 'None', '8th', '10th', '12th', 'ITI/Diploma', 'Graduate', 'Postgraduate'];
const AVAILABILITY = ['', 'Full time', 'Part time', 'Weekends only', 'Flexible'];

export default function ProfileEdit() {
  const [profile, setProfile] = useState<YouthProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const { user, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    get<{ user: { profile: YouthProfile | null } }>('/auth/me')
      .then((d) => setProfile(d.user.profile))
      .catch((e) => toast('error', e.message));
  }, []);

  if (!user) return null;
  if (user.role !== 'YOUTH') {
    return <p className="text-center py-20 text-stone-500">Employer and admin accounts are managed from their dashboards.</p>;
  }
  if (!profile) return <LoadingBlock />;

  const p = profile as YouthProfile & Record<string, unknown>;
  const upd = (k: string, v: unknown) => setProfile((cur) => ({ ...(cur as YouthProfile), [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        name: user.name,
        education: p.education || null,
        village: p.village || null,
        district: p.district || null,
        preferredRadiusKm: Number(p.preferredRadiusKm) || 25,
        interests: p.interests || [],
        skills: p.skills || [],
        availability: p.availability || null,
        experience: p.experience || null,
        languages: p.languages || [],
        careerGoals: p.careerGoals || null,
        profileVisible: p.profileVisible,
      };
      await put('/youth/profile', body);
      await refresh();
      toast('success', 'Profile saved');
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account permanently? All applications, saved jobs and plans will be removed. This cannot be undone.')) return;
    try {
      await del('/youth/profile');
      await refresh();
      toast('info', 'Your account has been deleted.');
      navigate('/');
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const listField = (key: 'interests' | 'skills' | 'languages', label: string, hint: string) => (
    <label className="block">
      <span className="block text-sm font-medium text-stone-700 mb-1">{label} <span className="text-stone-400 font-normal">({hint})</span></span>
      <input
        defaultValue={(p[key] as string[]).join(', ')}
        onChange={(e) => upd(key, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        className="w-full border border-stone-300 rounded-lg px-3 py-2.5"
        placeholder={key === 'skills' ? 'Tailoring, Basic English, Mobile repair' : key === 'interests' ? 'handicrafts, digital, farming' : 'Telugu, Hindi'}
      />
    </label>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">My profile</h1>
      <p className="text-sm text-stone-500 mb-6">The more complete your profile, the sharper your match scores.</p>

      <form onSubmit={save} className="bg-white rounded-2xl shadow-card p-6 space-y-5" noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-1">Village</span>
            <input value={p.village || ''} onChange={(e) => upd('village', e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-1">District</span>
            <input value={p.district || ''} onChange={(e) => upd('district', e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2.5" placeholder="e.g. Warangal" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-1">Highest education</span>
            <select value={p.education || ''} onChange={(e) => upd('education', e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white">
              {EDUCATION.map((o) => <option key={o} value={o}>{o || 'Select…'}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-1">Availability</span>
            <select value={p.availability || ''} onChange={(e) => upd('availability', e.target.value)} className="w-full border border-stone-300 rounded-lg px-3 py-2.5 bg-white">
              {AVAILABILITY.map((o) => <option key={o} value={o}>{o || 'Select…'}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Preferred work distance: <strong>{p.preferredRadiusKm} km</strong></span>
          <input type="range" min={1} max={100} value={p.preferredRadiusKm} onChange={(e) => upd('preferredRadiusKm', Number(e.target.value))} className="w-full" />
          <span className="text-xs text-stone-400">Higher = more (and farther) matches shown</span>
        </label>

        {listField('skills', 'My skills', 'comma-separated')}
        {listField('interests', 'Interests', 'what kind of work excites you')}
        {listField('languages', 'Languages I speak', 'comma-separated')}

        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Experience</span>
          <textarea value={p.experience || ''} onChange={(e) => upd('experience', e.target.value)} rows={3}
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5" placeholder="Any work you've done, family business help, farm work…" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Career goals</span>
          <textarea value={p.careerGoals || ''} onChange={(e) => upd('careerGoals', e.target.value)} rows={2}
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5" placeholder="What do you want to be doing in 2 years?" />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={p.profileVisible} onChange={(e) => upd('profileVisible', e.target.checked)} />
          <span>Show my profile to employers when I apply <span className="text-stone-400">(you control visibility)</span></span>
        </label>

        <div className="flex gap-3 pt-2">
          <button disabled={busy} className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save profile'}
          </button>
          <button type="button" onClick={deleteAccount} className="text-sm text-red-600 hover:underline px-3 py-2.5">Delete my account</button>
        </div>
      </form>
    </div>
  );
}
