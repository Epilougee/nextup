'use client';

// ============================================================================
// components/AdminLayout.js
// Admin console layout: fixed sidebar + topbar, clean and functional.
// ============================================================================

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconQueue,
  IconServices,
  IconAnalytics,
  IconDisplay,
  IconLogout,
  IconBars,
  IconClose,
} from './Icons';

export default function AdminLayout({ children, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  };

  const navLinks = [
    { href: '/admin/queue', label: 'Queue Console', icon: <IconQueue /> },
    { href: '/admin/services', label: 'Offices & Hours', icon: <IconServices /> },
    { href: '/admin/analytics', label: 'Analytics', icon: <IconAnalytics /> },
  ];

  return (
    <div className="admin-shell">
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Fixed Left Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link href="/admin/queue" className="brand-title" style={{ textDecoration: 'none' }}>
            <span className="brand-badge">NU</span>
            <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>NextUp Staff</span>
          </Link>
          <button
            className="hamburger-btn"
            style={{ display: sidebarOpen ? 'block' : 'none' }}
            onClick={() => setSidebarOpen(false)}
          >
            <IconClose />
          </button>
        </div>

        <nav className="admin-nav" style={{ padding: '1rem 0' }}>
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border)' }} />

          <Link
            href="/display"
            target="_blank"
            className="admin-nav-item"
            title="Open Waiting Room Display Board in new window"
          >
            <IconDisplay />
            <span>Public TV Board</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '0.875rem' }}>
              {user?.name || 'Administrative Staff'}
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {user?.email || 'admin@demo.com'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline btn-block btn-sm"
          >
            <IconLogout />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Administrative Content */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <IconBars />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-open" style={{ fontSize: '0.75rem' }}>
              <span className="status-dot"></span>
              Staff Console
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/display"
              target="_blank"
              className="btn btn-outline btn-sm"
            >
              <IconDisplay />
              <span>Public TV Board</span>
            </Link>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
