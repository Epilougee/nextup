'use client';

// ============================================================================
// app/login/page.js
// Simple, clean login portal for NextUp using Font Awesome icons.
// ============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconToken,
  IconUser,
  IconBuilding,
  IconSpinner,
  IconDisplay,
  IconCheck,
  IconAlert,
} from '@/components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (loginEmail, loginPass) => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      router.push(data.redirectUrl || '/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    doLogin(demoEmail, demoPass);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <IconToken />
            </span>
            <span
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: 'var(--primary-dark)',
                letterSpacing: '-0.02em',
              }}
            >
              NextUp
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            College Administration Queue & Token System
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h1
            style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
              color: 'var(--primary-dark)',
            }}
          >
            Sign In
          </h1>

          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="email" style={{ fontSize: '0.85rem' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder="student1@demo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.35rem',
                }}
              >
                <label className="form-label" htmlFor="password" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Password
                </label>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Demo: <code style={{ backgroundColor: 'var(--surface-muted)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>demo123</code>
                </span>
              </div>
              <input
                id="password"
                type="password"
                required
                className="form-input"
                placeholder="demo123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ minHeight: '44px' }}
            >
              {loading ? (
                <>
                  <IconSpinner />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Logins */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--muted)',
                marginBottom: '0.75rem',
              }}
            >
              Quick Demo Logins (1-Click):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-block"
                style={{
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  minHeight: 'auto',
                }}
                disabled={loading}
                onClick={() => handleQuickLogin('student1@demo.com', 'demo123')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconUser style={{ color: 'var(--muted)' }} />
                  <span style={{ fontWeight: 600 }}>Student: Aarav Patel</span>
                </div>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  student1@demo.com
                </span>
              </button>

              <button
                type="button"
                className="btn btn-outline btn-block"
                style={{
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  minHeight: 'auto',
                }}
                disabled={loading}
                onClick={() => handleQuickLogin('admin@demo.com', 'demo123')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconBuilding style={{ color: 'var(--muted)' }} />
                  <span style={{ fontWeight: 600 }}>Staff: Dr. Rajesh Sharma</span>
                </div>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  admin@demo.com
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Public TV Board link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: 'var(--muted)',
              textDecoration: 'none',
            }}
          >
            <IconDisplay />
            <span style={{ textDecoration: 'underline' }}>View Public Waiting Room Board</span>
          </a>
        </div>
      </div>
    </div>
  );
}
