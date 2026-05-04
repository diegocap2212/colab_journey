'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ClipboardList, Zap, Users, Settings, ChevronLeft, ChevronRight, LogOut, Target, RefreshCw } from 'lucide-react';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'gestor' | 'user';
}

const UserContext = createContext<User | null>(null);
export const useUser = () => useContext(UserContext);

const NAV = [
  { href: '/dashboard', label: 'Início', icon: Home, roles: ['admin', 'gestor', 'user'] },
  { href: '/dashboard/feedbacks', label: 'Feedbacks', icon: ClipboardList, roles: ['admin', 'gestor', 'user'] },
  { href: '/dashboard/matrix', label: 'Minhas Competências', icon: Zap, roles: ['admin', 'gestor', 'user'] },
  { href: '/dashboard/pdi', label: 'Meu PDI', icon: Target, roles: ['admin', 'gestor', 'user'] },
  { href: '/dashboard/cycles', label: 'Ciclos', icon: RefreshCw, roles: ['admin', 'gestor'] },
  { href: '/dashboard/team', label: 'Time', icon: Users, roles: ['admin', 'gestor'] },
  { href: '/dashboard/users', label: 'Usuários', icon: Settings, roles: ['admin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) { router.push('/'); return null; }
      return r.json();
    }).then(data => {
      if (data) setUser(data);
      setLoading(false);
    });
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const visibleNav = NAV.filter(n => n.roles.includes(user?.role || ''));
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <UserContext.Provider value={user}>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? '240px' : '64px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease',
          flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden',
        }}>
          {/* Brand */}
          <div style={{
            padding: '20px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: '12px',
            minHeight: '64px',
          }}>
            <div style={{
              width: '32px', height: '32px', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} color="#fff" />
            </div>
            {sidebarOpen && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>Ótmow People</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>Performance & Feedback</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {visibleNav.map(item => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 10px',
                    borderRadius: '8px',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    background: isActive ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <span style={{ flexShrink: 0, display: 'flex' }}><item.icon size={18} /></span>
                  {sidebarOpen && item.label}
                </Link>
              );
            })}
          </nav>

          {/* User footer */}
          <div style={{
            padding: '12px 8px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '8px 10px',
                borderRadius: '8px', border: 'none', background: 'transparent',
                color: 'var(--text-tertiary)', cursor: 'pointer',
                fontSize: '0.875rem', marginBottom: '4px',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}>
                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </span>
              {sidebarOpen && 'Recolher'}
            </button>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: '8px',
              background: 'var(--bg-elevated)',
            }}>
              <div style={{
                width: '28px', height: '28px', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6875rem', fontWeight: 700, color: '#fff',
              }}>{initials}</div>
              {sidebarOpen && (
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{user?.role}</div>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '8px 10px', marginTop: '4px',
                  borderRadius: '8px', border: 'none', background: 'transparent',
                  color: 'var(--red)', cursor: 'pointer',
                  fontSize: '0.8125rem', transition: 'background 0.15s',
                }}
              >
                <LogOut size={16} /> Sair
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '32px', minWidth: 0, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </UserContext.Provider>
  );
}
