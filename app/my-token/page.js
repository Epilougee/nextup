'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ReconnectingPill from '@/components/ReconnectingPill';
import ConfirmModal from '@/components/ConfirmModal';
import { usePolling } from '@/components/usePolling';
import {
  IconCancel,
  IconSpinner,
} from '@/components/Icons';

export default function MyTokenPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/login'); return; }
        const data = await res.json();
        if (data.user.role === 'admin') { router.push('/admin/queue'); return; }
        setCurrentUser(data.user);
      } catch { router.push('/login'); }
    }
    checkAuth();
  }, [router]);

  const fetchActiveToken = async () => {
    const res = await fetch('/api/student/active-token');
    if (!res.ok) throw new Error('Failed to fetch token');
    return res.json();
  };

  const { data, isLoading, isReconnecting, mutate } = usePolling(fetchActiveToken, 4000);
  const token = data?.activeToken;

  useEffect(() => {
    if (!token) { document.title = 'My Token – NextUp'; return; }
    if (token.alertLevel === 'now') {
      document.title = `(!) NOW SERVING ${token.token_code} – NextUp`;
      if (navigator?.vibrate) try { navigator.vibrate([300, 150, 300, 150, 300]); } catch {}
    } else if (token.alertLevel === 'near') {
      document.title = `(!) Near: #${token.position} – NextUp`;
      if (navigator?.vibrate) try { navigator.vibrate([200, 100, 200]); } catch {}
    } else {
      document.title = `Token ${token.token_code} (#${token.position}) – NextUp`;
    }
    return () => { document.title = 'NextUp'; };
  }, [token]);

  const getOrdinal = (n) => {
    if (!n || n <= 0) return '';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleCancelToken = async () => {
    if (!token) return;
    setIsCancelling(true);
    setActionError('');
    try {
      const res = await fetch('/api/student/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: token.id }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to cancel token');
      setShowCancelModal(false);
      await mutate();
    } catch (err) { setActionError(err.message); }
    finally { setIsCancelling(false); }
  };

  return (
    <StudentLayout user={currentUser}>
      <ReconnectingPill show={isReconnecting} />

      {/* Clean Flat Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary-dk)' }}>My Active Token</h1>
          <p className="text-muted text-sm">Live queue status — updates automatically.</p>
        </div>
      </div>

      {actionError && (
        <div style={{
          background: 'var(--red-bg)', border: '1px solid var(--red-bd)',
          color: 'var(--red)', borderRadius: 'var(--r-sm)',
          padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem',
        }}>{actionError}</div>
      )}

      {/* Loading */}
      {isLoading && !data && <div className="card skeleton" style={{ height: '320px' }} />}

      {/* No token */}
      {!isLoading && !token && (
        <div className="card empty-state fade-in">
          <div className="empty-icon"><i className="fa-solid fa-ticket" /></div>
          <div className="empty-title">No active token</div>
          <p className="empty-sub">You are not currently in any queue.</p>
          <button className="btn btn-primary" onClick={() => router.push('/')}>
            <i className="fa-solid fa-arrow-left" /> Go to Offices
          </button>
        </div>
      )}

      {/* Active token */}
      {token && (
        <div className="fade-in">
          {/* Alert banners */}
          {token.alertLevel === 'now' && (
            <div className="alert-now" style={{ marginBottom: '1rem' }}>
              <i className="fa-solid fa-bell" />
              <span><strong>Your turn!</strong> Please approach the {token.service?.name} desk now.</span>
            </div>
          )}
          {token.alertLevel === 'near' && (
            <div className="alert-near" style={{ marginBottom: '1rem' }}>
              <i className="fa-solid fa-clock" />
              <span><strong>Almost your turn.</strong> You are {getOrdinal(token.position)} in line.</span>
            </div>
          )}

          {/* Ticket card */}
          <div className="card" style={{
            textAlign: 'center', padding: '2rem 1.5rem',
            borderTop: `4px solid ${token.status === 'serving' ? 'var(--accent)' : 'var(--primary)'}`,
          }}>
            {/* Office */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{
                background: 'var(--muted-bg)', border: '1px solid var(--border)',
                fontWeight: 800, fontSize: '0.75rem', padding: '0.15rem 0.4rem',
                borderRadius: 'var(--r-sm)',
              }}>{token.service?.prefix}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{token.service?.name}</span>
            </div>

            {/* Token code */}
            <div
              className={`tabular-nums ${token.status === 'serving' ? 'token-hero' : 'token-num'}`}
              style={{ margin: '0.75rem 0' }}
            >
              {token.token_code}
            </div>

            {/* Status */}
            <div style={{
              marginBottom: '1rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: token.status === 'serving' ? 'var(--accent)' : 'var(--blue)',
            }}>
              {token.status === 'serving' ? '● Now Serving' : '● In Line'}
            </div>

            {/* Purpose */}
            {token.purpose && (
              <div style={{
                display: 'inline-block',
                background: 'var(--muted-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)', padding: '0.4rem 0.75rem',
                fontSize: '0.85rem', marginBottom: '1.25rem',
              }}>
                Purpose: <strong>{token.purpose}</strong>
              </div>
            )}

            {/* Waiting stats */}
            {token.status === 'waiting' ? (
              <>
                <div className="inset" style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '1rem', padding: '1.1rem 0.9rem', marginBottom: '1.25rem',
                }}>
                  <div style={{ borderRight: '1px solid var(--border)' }}>
                    <div className="text-xs text-muted" style={{ marginBottom: '0.2rem' }}>Position</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800 }} className="tabular-nums">
                      {getOrdinal(token.position)}
                    </div>
                    <div className="text-muted text-sm" style={{ fontSize: '0.78rem' }}>
                      {token.peopleAhead === 0 ? 'Next up' : `${token.peopleAhead} ahead`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted" style={{ marginBottom: '0.2rem' }}>Est. Wait</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800 }} className="tabular-nums">
                      ~{token.estimatedWaitMinutes}m
                    </div>
                    <div className="text-muted text-sm" style={{ fontSize: '0.78rem' }}>approx.</div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', marginBottom: '0.3rem' }} className="text-muted">
                    <span>Joined</span><span>Desk</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{
                      width: `${Math.max(10, 100 - (token.peopleAhead * 20))}%`,
                      background: token.alertLevel === 'near' ? 'var(--accent)' : 'var(--blue)',
                    }} />
                  </div>
                </div>

                <button className="btn btn-danger-outline btn-block" onClick={() => setShowCancelModal(true)}>
                  <i className="fa-solid fa-xmark" /> Cancel Token
                </button>
              </>
            ) : (
              <div style={{
                padding: '1.25rem', background: '#FFF7F3',
                border: '1px solid #FCDAC8', borderRadius: 'var(--r-sm)', marginTop: '0.5rem',
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.3rem' }}>
                  Please approach the counter now
                </div>
                <p className="text-muted text-sm">Present your college ID when called.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Token?"
        message={`Cancel ${token?.token_code}? You will lose your position (${getOrdinal(token?.position)}) in queue.`}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Spot"
        isDanger={true}
        isLoading={isCancelling}
        onConfirm={handleCancelToken}
        onCancel={() => setShowCancelModal(false)}
      />
    </StudentLayout>
  );
}
