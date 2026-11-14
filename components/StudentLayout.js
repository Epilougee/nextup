'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconHome, IconToken, IconHistory, IconLogout, IconUser, IconDisplay } from './Icons';

export default function StudentLayout({ children, user }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Offices', icon: <IconHome /> },
    { href: '/my-token', label: 'My Token', icon: <IconToken /> },
    { href: '/history', label: 'History', icon: <IconHistory /> },
  ];

  return (
    <div className="student-shell">
      <header className="student-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/" className="brand-title">
            <span className="brand-badge">NU</span>
            <span>NextUp</span>
          </Link>
          {/* Desktop nav links */}
          <nav className="desktop-nav">
            {navLinks.map(n => (
              <Link key={n.href} href={n.href} className={`desktop-nav-link ${pathname === n.href ? 'active' : ''}`}>
                {n.icon}<span>{n.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <Link href="/display" target="_blank" className="btn btn-ghost btn-sm desktop-only" style={{ gap: '.4rem' }}>
            <IconDisplay /><span>TV Board</span>
          </Link>
          {user && (
            <span style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <IconUser style={{ fontSize: '.75rem' }} />
              {user.name.split(' ')[0]}
            </span>
          )}
          <button onClick={logout} className="btn btn-ghost btn-sm" title="Sign out" style={{ padding: '.35rem .6rem', minHeight: '34px' }}>
            <IconLogout />
          </button>
        </div>
      </header>

      <main className="student-main">{children}</main>

      {/* Phone bottom nav */}
      <nav className="bottom-nav">
        {navLinks.map(n => (
          <Link key={n.href} href={n.href} className={`bottom-nav-item ${pathname === n.href ? 'active' : ''}`}>
            {n.icon}<span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
