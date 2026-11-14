'use client';

// ============================================================================
// app/login/page.js
// Institutional College Administration Login Portal.
// Features institutional framing, academic session badges, and 1-click credentials.
// ============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconSpinner, IconUser, IconBuildingColumns, IconClock } from '@/components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      router.push(data.redirectUrl || '/');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Institutional Identity Strip */}
      <div className="campus-header-band">
        <div className="campus-tag">
          <span style={{ fontWeight: 700 }}>NATIONAL INSTITUTE OF TECHNOLOGY & MANAGEMENT</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>ADMINISTRATION DESK</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85 }}>
          <span className="tabular-nums">AY 2026-27</span>
          <span>•</span>
          <span>IST 10:00 - 16:00</span>
        </div>
      </div>

      {/* Main Login Frame */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-pill)',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span className="brand-badge" style={{ fontSize: '0.8rem', padding: '0.2rem 0.45rem' }}>
                QL
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-dark)' }}>
                QueueLess
              </span>
              <span style={{ color: 'var(--border-strong)' }}>|</span>
              <span className="text-muted text-sm" style={{ fontWeight: 500 }}>
                Digital Token Desk
              </span>
            </div>

            <h1 style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>
              Campus Administration Portal
            </h1>
            <p className="text-muted text-sm">
              Sign in to draw a digital token or access the office queue console
            </p>
          </div>

          {/* Login Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            {error && (
              <div
                style={{
                  backgroundColor: '#FDF2F0',
                  border: '1px solid #F6CECA',
                  color: 'var(--noshow)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontWeight: 700 }}>•</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  College Email ID
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder="student1@demo.com or admin@demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <IconSpinner />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  'Sign In to Campus Desk'
                )}
              </button>
            </form>

            {/* Quick Demo Logins Panel */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  Demo Accounts (1-Click Fill)
                </span>
                <span className="badge badge-open" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                  <span className="status-dot"></span>
                  Ready
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-block"
                  style={{
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    height: 'auto',
                    padding: '0.6rem 0.85rem',
                  }}
                  onClick={() => fillCredentials('student1@demo.com', 'demo123')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      Aarav Patel (Student)
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      student1@demo.com • Active Token ACC-005
                    </div>
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      backgroundColor: '#EDF3FA',
                      color: 'var(--waiting)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #D2E0F2',
                    }}
                  >
                    Student
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-block"
                  style={{
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    height: 'auto',
                    padding: '0.6rem 0.85rem',
                  }}
                  onClick={() => fillCredentials('admin@demo.com', 'demo123')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      Dr. Rajesh Sharma (Staff)
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      admin@demo.com • Queue Console & Caller
                    </div>
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      backgroundColor: '#F3F4F6',
                      color: 'var(--primary-dark)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Officer
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Public TV Board Shortcut */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <a
              href="/display"
              target="_blank"
              style={{
                color: 'var(--muted)',
                textDecoration: 'underline',
                fontWeight: 500,
              }}
            >
              Open Public TV Board
            </a>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              Academic Session 2026-27
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
