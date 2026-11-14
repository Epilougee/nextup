'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconToken, IconSpinner, IconAlert, IconUser, IconBuilding, IconDisplay } from '@/components/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (e, loginEmail, loginPass) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign in failed.');
      router.push(data.redirectUrl || '/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          {/* Header inside the box */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.35rem' }}>
              <span className="brand-badge" style={{ width: '32px', height: '32px', borderRadius: '7px' }}>
                <IconToken />
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dk)', letterSpacing: '-0.02em' }}>
                NextUp
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '.825rem', margin: 0 }}>
              College queue & instant document portal
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.1rem', marginBottom: '1.1rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-dk)' }}>
              Sign in
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bd)', color: 'var(--red)', padding: '.65rem .9rem', borderRadius: 'var(--r-sm)', marginBottom: '1rem', fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: '.45rem' }}>
              <IconAlert /><span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => doLogin(e, email, password)}>
            <div style={{ marginBottom: '.9rem' }}>
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="form-input" placeholder="student1@demo.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>demo: <code style={{ background: 'var(--muted-bg)', padding: '0 .3rem', borderRadius: '3px' }}>demo123</code></span>
              </div>
              <input id="password" type="password" required className="form-input" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ minHeight: '44px' }}>
              {loading ? <><IconSpinner /><span>Signing in…</span></> : 'Sign In'}
            </button>
          </form>

          {/* Quick fills */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '.6rem', fontWeight: 600 }}>Quick access</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
              {[
                { label: 'Student — Aarav Patel', email: 'student1@demo.com', Icon: IconUser },
                { label: 'Staff — Dr. Rajesh Sharma', email: 'admin@demo.com', Icon: IconBuilding },
              ].map(({ label, email: de, Icon }) => (
                <button
                  key={de}
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={loading}
                  style={{ justifyContent: 'space-between', padding: '.55rem .85rem' }}
                  onClick={() => doLogin(null, de, 'demo123')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
                    <Icon style={{ color: 'var(--muted)' }} />
                    <span style={{ fontWeight: 600 }}>{label}</span>
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{de}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <a href="/display" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: 'var(--muted)' }}>
            <IconDisplay /><span style={{ textDecoration: 'underline' }}>Waiting room display</span>
          </a>
        </div>
      </div>
    </div>
  );
}
