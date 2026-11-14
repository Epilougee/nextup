'use client';

// ============================================================================
// components/AdminLayout.js
// Admin console layout: fixed sidebar + topbar, responsive mobile drawer.
// Enhanced with institutional branding and tactile control styling.
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
  IconBuildingColumns,
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
          <div className="brand-title">
            <span className="brand-badge">QL</span>
            <span>QueueLess</span>
          </div>
          <button
            className="hamburger-btn"
            style={{ display: sidebarOpen ? 'block' : 'none' }}
            onClick={() => setSidebarOpen(false)}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-muted)' }}>
          <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.15rem' }}>
            Campus Desk
          </div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
            Staff Administration
          </div>
        </div>

        <nav className="admin-nav">
          <div className="text-xs" style={{ padding: '0.5rem 0.5rem 0.25rem', color: 'var(--muted)' }}>
            Desk Operations
          </div>
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

          <div className="text-xs" style={{ padding: '0 0.5rem 0.25rem', color: 'var(--muted)' }}>
            Lounge Displays
          </div>

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
            <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.875rem' }}>
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
        {/* Top Institutional Identity Strip */}
        <div className="campus-header-band">
          <div className="campus-tag">
            <span style={{ fontWeight: 700 }}>NITM CAMPUS SERVICES</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>CENTRAL REGISTRAR DESK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
            <span>OPERATING HOURS: 10:00 - 16:00 IST</span>
          </div>
        </div>

        <header className="admin-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <IconBars />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-open" style={{ fontSize: '0.7rem' }}>
              <span className="status-dot"></span>
              Console Online
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
