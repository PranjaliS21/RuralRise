import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'YOUTH', district: '', organizationName: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name, email: form.email, password: form.password, role: form.role,
      };
      if (form.district) payload.district = form.district;
      if (form.role === 'EMPLOYER' && form.organizationName) payload.organizationName = form.organizationName;
      const user = await register(payload);
      toast('success', `Welcome to RuralRise, ${user.name}!`);
      navigate(user.role === 'EMPLOYER' ? '/employer' : '/profile');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Create your free account</h1>
      <p className="text-sm text-stone-500 mb-6">Find work, learn skills, build income — free forever for job seekers.</p>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-card p-6 space-y-4" noValidate>
        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
          {[
            { value: 'YOUTH', label: 'I want work', hint: 'Find jobs & training' },
            { value: 'EMPLOYER', label: 'I want to hire', hint: 'Post opportunities' },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => set('role', o.value)}
              aria-pressed={form.role === o.value}
              className={`text-left p-3 rounded-xl border-2 transition ${form.role === o.value ? 'border-brand-600 bg-brand-50' : 'border-stone-200 hover:border-stone-300'}`}
            >
              <span className="block text-sm font-semibold text-stone-800">{o.label}</span>
              <span className="block text-xs text-stone-500">{o.hint}</span>
            </button>
          ))}
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Full name</span>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Email</span>
          <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Password <span className="text-stone-400 font-normal">(min 8 characters)</span></span>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">District <span className="text-stone-400 font-normal">(helps local matching)</span></span>
          <input value={form.district} onChange={(e) => set('district', e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5" placeholder="e.g. Warangal" />
        </label>
        {form.role === 'EMPLOYER' && (
          <label className="block">
            <span className="block text-sm font-medium text-stone-700 mb-1">Organization / business name</span>
            <input value={form.organizationName} onChange={(e) => set('organizationName', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5" />
          </label>
        )}
        <button disabled={busy} className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-xs text-stone-400">
          We only store your name, email, district and profile details you choose to add. You can delete your account any time from your profile.
        </p>
        <p className="text-sm text-stone-500 text-center">
          Already registered? <Link to="/login" className="text-brand-700 font-medium hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
