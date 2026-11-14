'use client';

// ============================================================================
// app/my-token/page.js
// Student Live Token Monitor: Shows queue position, wait estimate, progress bar,
// vibration alert, dynamic title warning, and token cancellation with confirmation.
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ReconnectingPill from '@/components/ReconnectingPill';
import ConfirmModal from '@/components/ConfirmModal';
import { usePolling } from '@/components/usePolling';
import {
  IconToken,
  IconClock,
  IconAlert,
  IconCancel,
  IconSpinner,
  IconCheck,
  IconBuildingColumns,
} from '@/components/Icons';

export default function MyTokenPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState('');

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user.role === 'admin') {
          router.push('/admin/queue');
          return;
        }
        setCurrentUser(data.user);
      } catch (err) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  // Poll active token every 4 seconds
  const fetchActiveToken = async () => {
    const res = await fetch('/api/student/active-token');
    if (!res.ok) throw new Error('Failed to fetch active token');
    return res.json();
  };

  const { data, isLoading, isReconnecting, mutate } = usePolling(fetchActiveToken, 4000);
  const token = data?.activeToken;

  // Handle document.title update and vibration based on alertLevel
  useEffect(() => {
    if (!token) {
      document.title = 'My Token - QueueLess';
      return;
    }

    if (token.alertLevel === 'now') {
      document.title = `(!) NOW SERVING ${token.token_code} - QueueLess`;
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        try {
          navigator.vibrate([300, 150, 300, 150, 300]);
        } catch (e) {}
      }
    } else if (token.alertLevel === 'near') {
      document.title = `(!) Turn Near: Position ${token.position} - QueueLess`;
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch (e) {}
      }
    } else {
      document.title = `Token ${token.token_code} (${token.position}th) - QueueLess`;
    }

    return () => {
      document.title = 'QueueLess - Digital Queue & Token Management';
    };
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
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to cancel token');
      }

      setShowCancelModal(false);
      await mutate();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <StudentLayout user={currentUser}>
      <ReconnectingPill show={isReconnecting} />

      {/* Header Panel */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.35rem' }}>Active Desk Token</h1>
          <span className="badge badge-waiting" style={{ fontSize: '0.7rem' }}>
            <span className="status-dot"></span>
            LIVE
          </span>
        </div>
        <p className="text-muted text-sm">
          Keep this screen open. Your position automatically updates as students ahead are called.
        </p>
      </div>

      {actionError && (
        <div
          style={{
            backgroundColor: '#FDF2F0',
            border: '1px solid #F6CECA',
            color: 'var(--noshow)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div className="card skeleton" style={{ height: '340px' }} />
      )}

      {/* Empty State when no active token exists */}
      {!isLoading && !token && (
        <div className="card empty-state fade-in">
          <div className="empty-state-icon">
            <IconToken />
          </div>
          <div className="empty-state-title">No Active Token</div>
          <p className="empty-state-subtitle">
            You do not currently have a waiting or active token in line.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn btn-primary"
          >
            View Offices & Get Token
          </button>
        </div>
      )}

      {/* Active Token Card */}
      {token && (
        <div className="fade-in">
          {/* Urgent Notification Banners */}
          {token.alertLevel === 'now' && (
            <div className="alert-banner alert-banner-now">
              <IconAlert />
              <span>
                <strong>Your turn has arrived!</strong> Please approach the {token.service?.name} desk immediately.
              </span>
            </div>
          )}

          {token.alertLevel === 'near' && (
            <div className="alert-banner alert-banner-near">
              <IconClock />
              <span>
                <strong>Your turn is approaching!</strong> You are {getOrdinal(token.position)} in line. Please remain near the office.
              </span>
            </div>
          )}

          {/* Ticket Card */}
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '2rem 1.5rem',
              borderTop: token.status === 'serving' ? '4px solid var(--accent)' : '4px solid var(--primary)',
            }}
          >
            {/* Office Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  backgroundColor: '#F3F4F6',
                  color: 'var(--primary-dark)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                }}
                className="tabular-nums"
              >
                {token.service?.prefix}
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                {token.service?.name}
              </span>
            </div>

            {/* Token Code */}
            <div
              className={`tabular-nums ${token.status === 'serving' ? 'token-number-hero' : 'token-number'}`}
              style={{ margin: '0.75rem 0' }}
            >
              {token.token_code}
            </div>

            {/* Status Pill */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span className={`badge ${token.status === 'serving' ? 'badge-serving' : 'badge-waiting'}`}>
                <span className="status-dot"></span>
                <span>{token.status === 'serving' ? 'Now Serving' : 'Waiting in Queue'}</span>
              </span>
            </div>

            {/* Purpose Tag */}
            {token.purpose && (
              <div
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.85rem',
                  color: 'var(--text)',
                  marginBottom: '1.25rem',
                  display: 'inline-block',
                }}
              >
                Purpose: <strong>{token.purpose}</strong>
              </div>
            )}

            {/* Queue Position and Wait Metrics */}
            {token.status === 'waiting' ? (
              <>
                <div
                  className="inset-box"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    padding: '1.25rem 1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ borderRight: '1px solid var(--border)' }}>
                    <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.25rem' }}>
                      Position in Line
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary-dark)' }} className="tabular-nums">
                      {getOrdinal(token.position)}
                    </div>
                    <div className="text-muted text-sm" style={{ fontSize: '0.78rem' }}>
                      {token.peopleAhead === 0 ? 'Next to be called' : `${token.peopleAhead} student${token.peopleAhead > 1 ? 's' : ''} ahead`}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.25rem' }}>
                      Estimated Wait
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary-dark)' }} className="tabular-nums">
                      ~{token.estimatedWaitMinutes} min
                    </div>
                    <div className="text-muted text-sm" style={{ fontSize: '0.78rem' }}>
                      Based on current desk pace
                    </div>
                  </div>
                </div>

                {/* Line Progress Visualizer */}
                <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }} className="text-muted">
                    <span>Queue Entry</span>
                    <span>Counter Desk</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.max(15, 100 - (token.peopleAhead * 20))}%`,
                        backgroundColor: token.alertLevel === 'near' ? 'var(--accent)' : 'var(--waiting)',
                      }}
                    />
                  </div>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-danger-outline btn-block"
                >
                  <IconCancel />
                  <span>Cancel My Token</span>
                </button>
              </>
            ) : (
              <div
                style={{
                  padding: '1.5rem 1rem',
                  backgroundColor: 'var(--accent-light)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '0.5rem',
                }}
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.35rem' }}>
                  Please approach the counter desk now
                </div>
                <p className="text-muted text-sm" style={{ color: '#8F3200' }}>
                  Your token has been announced by the officer. Please present your college ID card.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Token Cancellation */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Token?"
        message={`Are you sure you want to cancel token ${token?.token_code}? Your current position (${getOrdinal(token?.position)}) in the queue will be surrendered.`}
        confirmLabel="Yes, Cancel Token"
        cancelLabel="Keep My Spot"
        isDanger={true}
        isLoading={isCancelling}
        onConfirm={handleCancelToken}
        onCancel={() => setShowCancelModal(false)}
      />
    </StudentLayout>
  );
}
