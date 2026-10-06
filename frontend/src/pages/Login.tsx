import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password);
      toast('success', `Welcome back, ${user.name}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : user.role === 'EMPLOYER' ? '/employer' : from || '/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-stone-900 mb-1">Welcome back</h1>
      <p className="text-sm text-stone-500 mb-6">Log in to your RuralRise account.</p>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-card p-6 space-y-4" noValidate>
        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-stone-700 mb-1">Password</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>
        <button disabled={busy} className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-sm text-stone-500 text-center">
          New here? <Link to="/register" className="text-brand-700 font-medium hover:underline">Create a free account</Link>
        </p>
      </form>
      <div className="mt-6 bg-stone-100 border border-stone-200 rounded-xl p-4 text-xs text-stone-600">
        <p className="font-semibold mb-1">Demo accounts (password: <code>Password123!</code>)</p>
        <ul className="space-y-0.5">
          <li>Job seeker: <code>youth@demo.ruralrise.in</code></li>
          <li>Employer: <code>employer@demo.ruralrise.in</code></li>
          <li>Admin: <code>admin@demo.ruralrise.in</code></li>
        </ul>
      </div>
    </div>
  );
}
