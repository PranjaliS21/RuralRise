import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Bell, LogOut, Sprout, Briefcase, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { get } from '../api/client';
import { useEffect } from 'react';
import type { Notification } from '../types';

const navLinks = [
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/skills', label: 'Skills & Training' },
  { to: '/business', label: 'Entrepreneurship' },
  { to: '/schemes', label: 'Govt Schemes' },
  { to: '/about', label: 'About' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <span className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
        <Sprout className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className="block font-bold text-brand-900 text-lg">RuralRise</span>
        <span className="block text-[10px] text-stone-500 -mt-0.5">Find opportunity. Build income. Stay rooted.</span>
      </span>
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    get<{ items: Notification[]; unread: number }>('/notifications')
      .then((d) => setNotifs(d.items))
      .catch(() => undefined);
  }, [user]);

  const unread = notifs.filter((n) => !n.read).length;

  const dashHref = user
    ? user.role === 'YOUTH' ? '/dashboard' : user.role === 'EMPLOYER' ? '/employer' : '/admin'
    : '/login';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/95 backdrop-blur border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Logo />
          <nav className="hidden lg:flex items-center gap-1 ml-6" aria-label="Main">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative p-2 rounded-lg hover:bg-stone-100 text-stone-600"
                  aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
                >
                  <Bell className="h-5 w-5" />
                  {unread > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-500" />}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lifted border border-stone-200 p-2 z-50">
                    {notifs.length === 0 ? (
                      <p className="text-sm text-stone-500 p-3">No notifications yet.</p>
                    ) : (
                      notifs.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { setNotifOpen(false); if (n.link) navigate(n.link); }}
                          className="block w-full text-left p-3 rounded-lg hover:bg-stone-50"
                        >
                          <p className="text-sm font-medium text-stone-800">{n.title}</p>
                          {n.body && <p className="text-xs text-stone-500">{n.body}</p>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {user ? (
              <>
                <Link
                  to={dashHref}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
                >
                  {user.role === 'ADMIN' ? <ShieldCheck className="h-4 w-4" /> : user.role === 'EMPLOYER' ? <Briefcase className="h-4 w-4" /> : null}
                  Dashboard
                </Link>
                <button
                  onClick={async () => { await logout(); navigate('/'); }}
                  className="p-2 rounded-lg hover:bg-stone-100 text-stone-600"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg">Log in</Link>
                <Link to="/register" className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">Sign up</Link>
              </>
            )}
            <button className="lg:hidden p-2 rounded-lg hover:bg-stone-100 text-stone-700" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="lg:hidden border-t border-stone-200 bg-white px-4 py-2" aria-label="Mobile">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600'}`}>
                {l.label}
              </NavLink>
            ))}
            {user && (
              <NavLink to={dashHref} onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-brand-700">
                My dashboard
              </NavLink>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-brand-900 text-brand-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Sprout className="h-4 w-4 text-white" />
              </span>
              <span className="font-bold text-white text-lg">RuralRise</span>
            </div>
            <p className="text-sm text-brand-200">Find opportunity. Build income. Stay rooted.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Explore</h3>
            <ul className="space-y-2 text-sm">
              {navLinks.map((l) => (
                <li key={l.to}><Link to={l.to} className="hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white">Log in</Link></li>
              <li><Link to="/register" className="hover:text-white">Create account</Link></li>
              <li><Link to="/about" className="hover:text-white">About RuralRise</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-800">
          <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-brand-300">
            Local Opportunity, Local Prosperity · Match scores show profile fit only and are not a guarantee of selection or earnings · Scheme details must be verified on official sources
          </p>
        </div>
      </footer>
    </div>
  );
}
