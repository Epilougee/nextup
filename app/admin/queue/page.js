'use client';

// ============================================================================
// app/admin/queue/page.js
// Staff Queue Console: Service switcher, Now Serving control deck,
// Call Next button, waiting queue table, and real-time summary statistics.
// Polling every 4s, pausing when tab is hidden.
// ============================================================================

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ReconnectingPill from '@/components/ReconnectingPill';
import ConfirmModal from '@/components/ConfirmModal';
import { usePolling } from '@/components/usePolling';
import { formatISTTime } from '@/lib/time';
import {
  IconCall,
  IconCheck,
  IconSkip,
  IconRecall,
  IconUsers,
  IconClock,
  IconCheckCircle,
  IconSpinner,
} from '@/components/Icons';

function AdminQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(
    searchParams.get('service_id') || ''
  );

  const [recallNote, setRecallNote] = useState('');
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // 1. Auth check
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setCurrentUser(data.user);
      } catch (err) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  // 2. Fetch queue console data
  const fetchQueueData = useCallback(async () => {
    const url = selectedServiceId
      ? `/api/admin/queue?service_id=${selectedServiceId}`
      : '/api/admin/queue';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load queue data');
    const data = await res.json();
    if (!selectedServiceId && data.currentService?.id) {
      setSelectedServiceId(data.currentService.id);
    }
    return data;
  }, [selectedServiceId]);

  const { data, isLoading, isReconnecting, mutate } = usePolling(fetchQueueData, 4000);

  const currentService = data?.currentService;
  const nowServing = data?.nowServing;
  const waitingList = data?.waitingList || [];
  const summary = data?.summary || { waitingCount: 0, servedTodayCount: 0, avgServiceMinutes: 0 };
  const services = data?.services || [];

  // Action: Call Next
  const handleCallNext = async () => {
    if (!currentService) return;
    setActionError('');
    setIsActionLoading(true);

    try {
      const res = await fetch('/api/admin/queue/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: currentService.id }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to call next token');
      }

      setRecallNote('');
      await mutate();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Complete
  const handleComplete = async () => {
    if (!nowServing) return;
    setActionError('');
    setIsActionLoading(true);

    try {
      const res = await fetch('/api/admin/queue/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: nowServing.id }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to complete token');
      }

      setRecallNote('');
      await mutate();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Skip as No-Show
  const handleSkip = async () => {
    if (!nowServing) return;
    setActionError('');
    setIsActionLoading(true);

    try {
      const res = await fetch('/api/admin/queue/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: nowServing.id }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to skip token');
      }

      setShowSkipModal(false);
      setRecallNote('');
      await mutate();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Action: Recall
  const handleRecall = async () => {
    if (!nowServing) return;
    setActionError('');
    setIsActionLoading(true);

    try {
      const res = await fetch('/api/admin/queue/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: nowServing.id }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to recall token');
      }

      setRecallNote(`Token ${nowServing.token_code} recalled at ${new Date().toLocaleTimeString()}`);
      await mutate();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AdminLayout user={currentUser}>
      <ReconnectingPill show={isReconnecting} />

      {/* Header & Office Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>Queue Console</h1>
          <p className="text-muted text-sm">
            Live queue operator desk. Call, serve, or skip tokens for today.
          </p>
        </div>

        {/* Office Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label htmlFor="service-select" className="text-sm" style={{ fontWeight: 600 }}>
            Office:
          </label>
          <select
            id="service-select"
            className="form-select"
            style={{ width: 'auto', minWidth: '200px' }}
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.prefix}) {!s.is_open ? '[CLOSED]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError && (
        <div
          style={{
            backgroundColor: '#FDF2F0',
            border: '1px solid #F6CECA',
            color: 'var(--noshow)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Summary Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.35rem' }}>
            Waiting in Queue
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }} className="tabular-nums">
            {summary.waitingCount}
          </div>
          <div className="text-muted text-sm" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
            Students in line
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.35rem' }}>
            Served Today
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--completed)' }} className="tabular-nums">
            {summary.servedTodayCount}
          </div>
          <div className="text-muted text-sm" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
            Completed counter visits
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.35rem' }}>
            Avg Service Time
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }} className="tabular-nums">
            ~{summary.avgServiceMinutes} min
          </div>
          <div className="text-muted text-sm" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
            Rolling 10-token average
          </div>
        </div>
      </div>

      {/* Main Console Deck: Now Serving Card & Call Next */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.3fr) minmax(240px, 0.7fr)',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          alignItems: 'stretch',
        }}
      >
        {/* Big Now Serving Card */}
        <div
          className="card"
          style={{
            borderLeft: nowServing ? '4px solid var(--accent)' : '1px solid var(--border)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="text-muted text-sm" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Counter Desk: {currentService?.name}
            </span>
            <span className={`badge ${nowServing ? 'badge-serving' : 'badge-closed'}`}>
              <span className="status-dot"></span>
              <span>{nowServing ? 'Actively Serving' : 'Idle'}</span>
            </span>
          </div>

          {nowServing ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="token-number-hero">{nowServing.token_code}</div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 600 }}>{nowServing.student_name}</div>
                  <div className="text-muted text-sm">{nowServing.student_email}</div>
                </div>
              </div>

              <div
                className="inset-box"
                style={{
                  margin: '1.25rem 0',
                  fontSize: '0.875rem',
                }}
              >
                <span className="text-xs" style={{ color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Student Purpose of Visit:
                </span>
                <span style={{ fontWeight: 600 }}>{nowServing.purpose}</span>
              </div>

              {recallNote && (
                <div
                  style={{
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    marginBottom: '1rem',
                  }}
                >
                  {recallNote}
                </div>
              )}

              {/* Action Buttons: Complete, Skip, Recall */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleComplete}
                  disabled={isActionLoading}
                >
                  <IconCheck />
                  <span>Complete</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleRecall}
                  disabled={isActionLoading}
                  title="Re-call student name and refresh TV screen"
                >
                  <IconRecall />
                  <span>Recall</span>
                </button>

                <button
                  type="button"
                  className="btn btn-danger-outline"
                  onClick={() => setShowSkipModal(true)}
                  disabled={isActionLoading}
                >
                  <IconSkip />
                  <span>Skip (No-Show)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-title">Desk is Currently Clear</div>
              <p className="empty-state-subtitle">
                No student is currently being served at this counter.
              </p>
            </div>
          )}
        </div>

        {/* Call Next Button Deck */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '1.5rem',
          }}
        >
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
              Next Up in Line
            </div>
            <div className="text-muted text-sm">
              {waitingList.length > 0
                ? `${waitingList.length} student${waitingList.length > 1 ? 's' : ''} waiting`
                : 'Queue is currently empty'}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-accent btn-block"
            style={{
              minHeight: '56px',
              fontSize: '1.05rem',
              fontWeight: 600,
            }}
            onClick={handleCallNext}
            disabled={isActionLoading || Boolean(nowServing) || waitingList.length === 0}
          >
            {isActionLoading ? (
              <>
                <IconSpinner />
                <span>Calling...</span>
              </>
            ) : (
              <>
                <IconCall />
                <span>Call Next Student</span>
              </>
            )}
          </button>

          {nowServing && (
            <div className="text-muted text-sm" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
              Complete or Skip current token to call next.
            </div>
          )}
        </div>
      </div>

      {/* Waiting List Table */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.15rem' }}>Waiting Line ({waitingList.length})</h2>
          <span className="text-muted text-sm">Ordered FIFO by arrival</span>
        </div>

        {waitingList.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-title">No Waiting Tokens</div>
            <p className="empty-state-subtitle">
              All students have been served or no tokens have been taken yet today.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Token</th>
                  <th>Student Name</th>
                  <th>Purpose</th>
                  <th>Arrival Time</th>
                  <th>Est. Wait</th>
                </tr>
              </thead>
              <tbody>
                {waitingList.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700 }} className="tabular-nums">
                      #{t.position}
                    </td>
                    <td>
                      <span
                        style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-dark)' }}
                        className="tabular-nums"
                      >
                        {t.token_code}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.student_name}</div>
                      <div className="text-muted text-sm">{t.student_email}</div>
                    </td>
                    <td>{t.purpose}</td>
                    <td className="text-muted tabular-nums">
                      {formatISTTime(t.created_at)}
                    </td>
                    <td className="tabular-nums">~{t.estimated_wait_minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal before Skip (No-Show) */}
      <ConfirmModal
        isOpen={showSkipModal}
        title="Mark as No-Show?"
        message={`Are you sure you want to skip token ${nowServing?.token_code} (${nowServing?.student_name})? This will mark the token as No-Show and release the counter.`}
        confirmLabel="Yes, Skip as No-Show"
        cancelLabel="Keep Serving"
        isDanger={true}
        isLoading={isActionLoading}
        onConfirm={handleSkip}
        onCancel={() => setShowSkipModal(false)}
      />
    </AdminLayout>
  );
}

export default function AdminQueuePage() {
  return (
    <Suspense fallback={<div className="card skeleton" style={{ height: '350px', margin: '2rem' }} />}>
      <AdminQueueContent />
    </Suspense>
  );
}
