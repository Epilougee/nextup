'use client';

// ============================================================================
// app/display/page.js
// Public TV Display Board (No Login Required)
// High-contrast transit-grade digital signage board for waiting room screens.
// Displays live "NOW SERVING" tokens and next 2 upcoming tokens per open office.
// Auto-polls every 4 seconds.
// ============================================================================

import { useState, useEffect } from 'react';
import ReconnectingPill from '@/components/ReconnectingPill';
import { usePolling } from '@/components/usePolling';

export const dynamic = 'force-dynamic';

export default function PublicDisplayPage() {
  const fetchDisplay = async () => {
    const res = await fetch('/api/public/display');
    if (!res.ok) throw new Error('Failed to load display board');
    return res.json();
  };

  const { data, isLoading, isReconnecting } = usePolling(fetchDisplay, 4000);

  // Live wall clock in IST
  const [clock, setClock] = useState('');
  const [dateDisplay, setDateDisplay] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateDisplay(
        now.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tiles = data?.tiles || [];

  return (
    <div className="display-shell">
      <ReconnectingPill show={isReconnecting} />

      {/* High-Contrast Header */}
      <header className="display-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              backgroundColor: 'var(--primary-dark)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '1.25rem',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              letterSpacing: '-0.02em',
            }}
          >
            NU
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-dark)', letterSpacing: '-0.01em' }}>
              Waiting Room Display
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'right' }}>
          <div>
            <div className="display-clock tabular-nums">{clock || data?.currentTime || '--:--'}</div>
            <div className="text-muted text-sm">{dateDisplay || data?.currentDateTime || 'IST'}</div>
          </div>
        </div>
      </header>

      {/* Grid of Office Tiles */}
      {isLoading && !data && (
        <div className="display-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="display-tile skeleton" style={{ minHeight: '260px' }} />
          ))}
        </div>
      )}

      {!isLoading && tiles.length === 0 && (
        <div className="card empty-state" style={{ margin: 'auto' }}>
          <div className="empty-title">All Administration Desks Currently Closed</div>
          <p className="empty-sub">
            Counter hours resume tomorrow at 10:00 AM IST.
          </p>
        </div>
      )}

      {tiles.length > 0 && (
        <div className="display-grid">
          {tiles.map((tile) => (
            <div
              key={tile.id}
              className={`display-tile ${tile.isServing ? 'display-tile-serving' : ''} fade-in`}
            >
              {/* Office Title */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '0.85rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
                    {tile.name}
                  </div>
                  <div className="text-muted text-sm" style={{ fontSize: '0.78rem' }}>
                    Counter Desk
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: '#F3F4F6',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    border: '1px solid var(--border)',
                  }}
                  className="tabular-nums"
                >
                  {tile.prefix}
                </span>
              </div>

              {/* Now Serving Inset Display */}
              <div
                className="inset"
                style={{
                  textAlign: 'center',
                  margin: '1.25rem 0',
                  padding: '1.5rem 1rem',
                  backgroundColor: tile.isServing ? 'var(--accent-light)' : 'var(--surface-muted)',
                  borderColor: tile.isServing ? 'var(--accent-border)' : 'var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: tile.isServing ? 'var(--accent)' : 'var(--muted)',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  {tile.isServing ? 'Now Serving at Counter' : 'Desk Currently Idle'}
                </div>

                <div
                  className={`tabular-nums ${tile.isServing ? 'token-hero' : 'token-num'}`}
                  style={{
                    fontSize: tile.isServing ? '4.25rem' : '3rem',
                    color: tile.isServing ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {tile.nowServing}
                </div>
              </div>

              {/* Next Waiting Up */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div className="text-muted text-sm" style={{ fontWeight: 600 }}>
                  Next in Queue:
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {tile.nextWaiting && tile.nextWaiting.length > 0 ? (
                    tile.nextWaiting.map((nextCode, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-strong)',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          color: 'var(--primary-dark)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        className="tabular-nums"
                      >
                        {nextCode}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-sm" style={{ fontStyle: 'italic' }}>
                      No students waiting
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
