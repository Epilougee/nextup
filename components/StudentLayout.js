'use client';

// ============================================================================
// components/StudentLayout.js
// Clean, mobile-friendly layout for students with simple topbar and bottom navigation.
// ============================================================================

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconHome, IconToken, IconHistory, IconLogout, IconUser } from './Icons';

export default function StudentLayout({ children, user }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  return (
    <div className="student-shell">
      {/* Top Header */}
      <header className="student-topbar">
        <Link href="/" className="brand-title" style={{ textDecoration: 'none' }}>
          <span className="brand-badge">NU</span>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>NextUp</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <IconUser style={{ fontSize: '0.75rem', color: 'var(--muted)' }} />
              <span>{user.name.split(' ')[0]}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.35rem 0.65rem', minHeight: '34px' }}
            title="Sign out"
          >
            <IconLogout />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="student-container">{children}</main>

      {/* Mobile-First Bottom Navigation */}
      <nav className="bottom-nav">
        <Link
          href="/"
          className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}
        >
          <IconHome />
          <span>Offices</span>
        </Link>
        <Link
          href="/my-token"
          className={`bottom-nav-item ${pathname === '/my-token' ? 'active' : ''}`}
        >
          <IconToken />
          <span>My Token</span>
        </Link>
        <Link
          href="/history"
          className={`bottom-nav-item ${pathname === '/history' ? 'active' : ''}`}
        >
          <IconHistory />
          <span>History</span>
        </Link>
      </nav>
    </div>
  );
}
