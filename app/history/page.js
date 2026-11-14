'use client';

// ============================================================================
// app/history/page.js
// Student Token History: Displays all past tokens with date, office, wait time,
// and completion status.
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import { IconHistory, IconToken, IconClock } from '@/components/Icons';

export default function HistoryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        if (userData.user.role === 'admin') {
          router.push('/admin/queue');
          return;
        }
        setCurrentUser(userData.user);

        const histRes = await fetch('/api/student/history');
        if (!histRes.ok) throw new Error('Failed to load token history');
        const histData = await histRes.json();
        setHistory(histData.history || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  return (
    <StudentLayout user={currentUser}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Token History</h1>
        <p className="text-muted text-sm">
          A record of your previous queue visits and processing times.
        </p>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card skeleton" style={{ height: '90px' }} />
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#FDF2F0',
            border: '1px solid #F6CECA',
            color: 'var(--noshow)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {!isLoading && history.length === 0 && (
        <div className="card empty-state fade-in">
          <div className="empty-icon">
            <IconHistory />
          </div>
          <div className="empty-title">No Past Tokens</div>
          <p className="empty-sub">
            You have not requested any administration tokens yet.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn btn-primary"
          >
            Get Your First Token
          </button>
        </div>
      )}

      {!isLoading && history.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {history.map((t) => {
            let statusLabel = 'Waiting';
            if (t.status === 'completed') statusLabel = 'Completed';
            if (t.status === 'serving') statusLabel = 'Now Serving';
            if (t.status === 'no_show') statusLabel = 'No-Show';
            if (t.status === 'cancelled') statusLabel = 'Cancelled';

            return (
              <div key={t.id} className="card fade-in" style={{ padding: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span
                      style={{ fontSize: '1.2rem', fontWeight: 700 }}
                      className="tabular-nums"
                    >
                      {t.token_code}
                    </span>
                    <span className="text-muted text-sm">{t.service_name}</span>
                  </div>

                  <span className={`badge badge-${t.status}`}>{statusLabel}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8125rem',
                    color: 'var(--muted)',
                  }}
                >
                  <div>Date: {t.date}</div>

                  <div>
                    {t.wait_minutes !== null ? (
                      <span>Wait: ~{t.wait_minutes} min</span>
                    ) : (
                      <span>Wait: --</span>
                    )}
                    {t.service_minutes !== null && (
                      <span style={{ marginLeft: '0.5rem' }}>
                        | Service: {t.service_minutes} min
                      </span>
                    )}
                  </div>
                </div>

                {t.purpose && (
                  <div
                    className="text-sm"
                    style={{
                      marginTop: '0.4rem',
                      paddingTop: '0.4rem',
                      borderTop: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    Purpose: {t.purpose}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}
