'use client';

// ============================================================================
// app/page.js
// Student Campus Portal: Multi-Department Service & Document Hub
// Supports:
// 1. Digital Documents: Instant online generation & verified credentials (NO OFFICE VISIT)
// 2. Physical Desks: Live queue tokens for in-person requirements
// 3. My Issued Documents: Real-time viewer and printable credentials
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ReconnectingPill from '@/components/ReconnectingPill';
import { usePolling } from '@/components/usePolling';
import { DEPARTMENT_CATALOG } from '@/lib/departmentCatalog';
import {
  IconDocument,
  IconToken,
  IconCheckCircle,
  IconPlus,
  IconSpinner,
  IconDownload,
  IconPrint,
  IconQr,
  IconShield,
  IconClose,
  IconBolt,
  IconWalk,
  IconCheck,
} from '@/components/Icons';

export default function StudentHomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('digital'); // 'digital' | 'physical' | 'my-docs'

  // Digital Doc Application Modal State
  const [selectedDocItem, setSelectedDocItem] = useState(null);
  const [selectedDeptPrefix, setSelectedDeptPrefix] = useState('');
  const [docPurpose, setDocPurpose] = useState('');
  const [rollNo, setRollNo] = useState('NITM-2023-CS-042');
  const [semester, setSemester] = useState('Semester V');
  const [isIssuingDoc, setIsIssuingDoc] = useState(false);
  const [docError, setDocError] = useState('');
  const [issuedSuccessMsg, setIssuedSuccessMsg] = useState('');

  // Physical Token Modal State
  const [selectedPhysicalService, setSelectedPhysicalService] = useState(null);
  const [tokenPurpose, setTokenPurpose] = useState('');
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Digital Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState(null);
  const [myDigitalDocs, setMyDigitalDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // 1. Check logged in user on mount
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

  // 2. Fetch student's issued digital documents
  const loadMyDigitalDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/student/digital-docs');
      if (res.ok) {
        const data = await res.json();
        setMyDigitalDocs(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-docs') {
      loadMyDigitalDocs();
    }
  }, [activeTab]);

  // Initial load of documents
  useEffect(() => {
    loadMyDigitalDocs();
  }, []);

  // 3. Polling for Physical counter services
  const fetchServices = async () => {
    const res = await fetch('/api/student/services');
    if (!res.ok) throw new Error('Failed to load services');
    return res.json();
  };

  const { data: queueData, isLoading: queueLoading, isReconnecting } = usePolling(
    fetchServices,
    4000
  );

  // 4. Handle Digital Document Application Submission
  const handleIssueDigitalDoc = async (e) => {
    e.preventDefault();
    if (!selectedDocItem) return;

    setDocError('');
    setIsIssuingDoc(true);

    try {
      const res = await fetch('/api/student/digital-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: selectedDocItem.id,
          service_prefix: selectedDeptPrefix,
          purpose: docPurpose || 'Official Institutional Academic Use',
          custom_fields: {
            roll_no: rollNo,
            semester: semester,
          },
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to issue digital document');
      }

      setSelectedDocItem(null);
      setIssuedSuccessMsg(`Document "${result.document.doc_title}" successfully generated! Ref: ${result.document.reference_no}`);
      await loadMyDigitalDocs();
      setViewingDoc(result.document); // Immediately open the verified document viewer
    } catch (err) {
      setDocError(err.message);
    } finally {
      setIsIssuingDoc(false);
    }
  };

  // 5. Handle Physical Token Generation
  const handleTakeToken = async (e) => {
    e.preventDefault();
    if (!selectedPhysicalService) return;

    setTokenError('');
    setIsSubmittingToken(true);

    try {
      const res = await fetch('/api/student/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedPhysicalService.id,
          purpose: tokenPurpose.trim() || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to take token');
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch (notifErr) {}
        }
      }

      setSelectedPhysicalService(null);
      setTokenPurpose('');
      router.push('/my-token');
    } catch (err) {
      setTokenError(err.message);
    } finally {
      setIsSubmittingToken(false);
    }
  };

  return (
    <StudentLayout user={currentUser}>
      <ReconnectingPill show={isReconnecting} />

      {/* Header */}
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
        <h1 style={{ fontSize: '1.3rem', marginBottom: '0.25rem', color: 'var(--primary-dark)' }}>Student Desk</h1>
        <p className="text-muted text-sm">
          Get verified digital documents online instantly, or draw a token for counter desk visits.
        </p>
      </div>

      {issuedSuccessMsg && (
        <div
          style={{
            backgroundColor: 'var(--emerald-light)',
            border: '1px solid var(--emerald-border)',
            color: 'var(--emerald)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{issuedSuccessMsg}</span>
          <button
            onClick={() => setIssuedSuccessMsg('')}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Category Switcher Tabs */}
      <div className="portal-tabs">
        <button
          className={`portal-tab-btn ${activeTab === 'digital' ? 'active' : ''}`}
          onClick={() => setActiveTab('digital')}
        >
          <IconBolt style={{ color: activeTab === 'digital' ? '#10B981' : 'inherit' }} />
          <span>Digital Documents (No Office Visit)</span>
        </button>

        <button
          className={`portal-tab-btn ${activeTab === 'physical' ? 'active' : ''}`}
          onClick={() => setActiveTab('physical')}
        >
          <IconWalk style={{ color: activeTab === 'physical' ? '#6366F1' : 'inherit' }} />
          <span>Counter Desks (Live Tokens)</span>
        </button>

        <button
          className={`portal-tab-btn ${activeTab === 'my-docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-docs')}
        >
          <IconDocument />
          <span>My E-Documents ({myDigitalDocs.length})</span>
        </button>
      </div>

      {/* TAB 1: DIGITAL DOCUMENTS (NO OFFICE VISIT REQUIRED) */}
      {activeTab === 'digital' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--emerald-light)',
              border: '1px solid var(--emerald-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--emerald)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <IconShield style={{ fontSize: '1.1rem' }} />
            <div>
              <strong>Instant Digital Delivery Enabled:</strong> Documents applied here are generated instantly with digital registrar verification seals. <em>Physical counter presence is not required.</em>
            </div>
          </div>

          {DEPARTMENT_CATALOG.map((dept) => {
            const digitalDocs = dept.items.filter((i) => i.type === 'digital');
            if (digitalDocs.length === 0) return null;

            return (
              <div key={dept.prefix} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        backgroundColor: '#F1F5F9',
                        color: 'var(--primary-dark)',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                      }}
                      className="tabular-nums"
                    >
                      {dept.prefix}
                    </span>
                    <h3 style={{ fontSize: '1.1rem' }}>{dept.name}</h3>
                  </div>
                  <span className="badge badge-digital" style={{ fontSize: '0.7rem' }}>
                    <span className="status-dot"></span>
                    Instant Online
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {digitalDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="inset-box"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
                          {doc.title}
                        </div>
                        <div className="text-muted text-sm" style={{ lineHeight: 1.4 }}>
                          {doc.description}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                          <span className="text-xs" style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                            {doc.deliveryText}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-emerald btn-sm"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={() => {
                          setSelectedDocItem(doc);
                          setSelectedDeptPrefix(dept.prefix);
                          setDocPurpose('');
                          setDocError('');
                        }}
                      >
                        <IconBolt />
                        <span>Issue Digitally</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PHYSICAL COUNTER DESKS & QUEUE TOKENS */}
      {activeTab === 'physical' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--indigo-light)',
              border: '1px solid var(--indigo-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: 'var(--indigo)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <IconWalk style={{ fontSize: '1.1rem' }} />
            <div>
              <strong>In-Person Physical Visit Required:</strong> Services below require physical inspection, original signature, cash counter, or collection. Take a token to hold your spot in line.
            </div>
          </div>

          {queueLoading && !queueData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="card skeleton" style={{ height: '140px' }} />
              ))}
            </div>
          )}

          {queueData?.services?.map((svc) => {
            const isOpen = svc.is_open;
            const canTake = svc.canTake?.ok;
            const rejectReason = svc.canTake?.reason;

            // Physical service items for this department
            const deptDef = DEPARTMENT_CATALOG.find((d) => d.prefix === svc.prefix);
            const physicalItems = deptDef?.items.filter((i) => i.type === 'physical') || [];

            return (
              <div
                key={svc.id}
                className="card"
                style={{
                  borderLeft: isOpen ? '4px solid var(--indigo)' : '4px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span
                        style={{
                          backgroundColor: '#F1F5F9',
                          color: 'var(--primary-dark)',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                        }}
                        className="tabular-nums"
                      >
                        {svc.prefix}
                      </span>
                      <h3 style={{ fontSize: '1.1rem' }}>{svc.name}</h3>
                    </div>
                    <div className="text-muted text-sm">
                      Hours: {svc.open_time.slice(0, 5)} - {svc.close_time.slice(0, 5)} IST
                    </div>
                  </div>

                  <span className={`badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
                    <span className="status-dot"></span>
                    <span>{isOpen ? 'Open' : 'Closed'}</span>
                  </span>
                </div>

                {/* Queue Stats Bar */}
                <div
                  className="inset-box"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '0.85rem',
                    textAlign: 'center',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <div>
                    <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.15rem' }}>
                      Now Serving
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        color: svc.servingTokenCode ? 'var(--accent)' : 'var(--muted)',
                      }}
                      className="tabular-nums"
                    >
                      {svc.servingTokenCode || 'None'}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                    <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.15rem' }}>
                      In Line
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem' }} className="tabular-nums">
                      {svc.waitingCount}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.15rem' }}>
                      Est. Wait
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem' }} className="tabular-nums">
                      ~{svc.estimatedWaitMinutes}m
                    </div>
                  </div>
                </div>

                {/* Physical matters handled */}
                {physicalItems.length > 0 && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div className="text-xs" style={{ color: 'var(--muted)', marginBottom: '0.35rem' }}>
                      Physical Matters Handled At This Counter:
                    </div>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {physicalItems.map((p) => (
                        <li key={p.id}>{p.title}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action button */}
                {svc.activeToken ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--indigo-light)',
                      border: '1px solid var(--indigo-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span className="text-sm" style={{ color: 'var(--indigo)', fontWeight: 600 }}>
                      Active Token: <strong>{svc.activeToken.token_code}</strong> ({svc.activeToken.status})
                    </span>
                    <button
                      onClick={() => router.push('/my-token')}
                      className="btn btn-indigo btn-sm"
                    >
                      View Live Position
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      className={`btn btn-block ${canTake ? 'btn-primary' : 'btn-outline'}`}
                      disabled={!canTake}
                      onClick={() => {
                        setSelectedPhysicalService(svc);
                        setTokenError('');
                      }}
                    >
                      <IconPlus />
                      <span>Take Token for {svc.prefix} Counter</span>
                    </button>

                    {!canTake && rejectReason && (
                      <div
                        className="text-muted text-sm"
                        style={{ marginTop: '0.4rem', textAlign: 'center', fontSize: '0.78rem' }}
                      >
                        {rejectReason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: MY ISSUED DIGITAL DOCUMENTS */}
      {activeTab === 'my-docs' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingDocs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2].map((n) => (
                <div key={n} className="card skeleton" style={{ height: '100px' }} />
              ))}
            </div>
          ) : myDigitalDocs.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">
                <IconDocument />
              </div>
              <div className="empty-state-title">No Digital Documents Issued Yet</div>
              <p className="empty-state-subtitle">
                You have not generated any digital certificates or receipts. Switch to the Digital Documents tab to apply instantly.
              </p>
              <button
                className="btn btn-emerald"
                onClick={() => setActiveTab('digital')}
              >
                Browse Digital Documents
              </button>
            </div>
          ) : (
            myDigitalDocs.map((doc) => (
              <div key={doc.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="badge badge-digital" style={{ fontSize: '0.7rem' }}>
                        <IconShield />
                        <span>ISSUED & VERIFIED</span>
                      </span>
                      <span className="text-muted text-sm tabular-nums">
                        Ref: <strong>{doc.reference_no}</strong>
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem' }}>{doc.doc_title}</h3>
                    <div className="text-muted text-sm">
                      Department: {doc.service?.name || 'Academic Registrar'} • Purpose: {doc.purpose}
                    </div>
                  </div>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setViewingDoc(doc)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <IconPrint />
                    <span>View / Print</span>
                  </button>
                </div>

                <div
                  className="inset-box"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8125rem',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <span className="text-muted">
                    Issued to: <strong>{doc.metadata?.student_name || currentUser?.name}</strong> ({doc.metadata?.roll_no || 'NITM-2023-CS-042'})
                  </span>
                  <span className="text-xs" style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                    Official Digital Credential
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: Apply & Issue Digital Document Online */}
      {selectedDocItem && (
        <div className="modal-backdrop" onClick={() => setSelectedDocItem(null)}>
          <div
            className="modal-card fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge badge-digital">
                  <IconBolt />
                  <span>Instant E-Issue</span>
                </span>
                <span className="text-muted text-sm">{selectedDeptPrefix}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>{selectedDocItem.title}</h3>
              <p className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>
                This document is verified and issued online immediately. You do NOT have to visit the office.
              </p>
            </div>

            {docError && (
              <div
                style={{
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  color: 'var(--noshow)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                {docError}
              </div>
            )}

            <form onSubmit={handleIssueDigitalDoc}>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-roll">
                  College Roll / Registration Number
                </label>
                <input
                  id="doc-roll"
                  type="text"
                  required
                  className="form-input"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="doc-sem">
                  Semester / Academic Year
                </label>
                <input
                  id="doc-sem"
                  type="text"
                  required
                  className="form-input"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="doc-purpose">
                  Purpose for Applying (e.g. Passport, Bank Loan, Scholarship, Visa)
                </label>
                <input
                  id="doc-purpose"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Education Loan, Passport, Campus Placement"
                  value={docPurpose}
                  onChange={(e) => setDocPurpose(e.target.value)}
                />
              </div>

              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--emerald-light)',
                  border: '1px solid var(--emerald-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  color: 'var(--emerald)',
                  marginBottom: '1rem',
                }}
              >
                ✓ Digitally generated institutional credential with unique verification code.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedDocItem(null)}
                  disabled={isIssuingDoc}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-emerald btn-sm"
                  disabled={isIssuingDoc}
                >
                  {isIssuingDoc ? (
                    <>
                      <IconSpinner />
                      <span>Generating Credential...</span>
                    </>
                  ) : (
                    'Generate & Issue Digitally'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Draw Physical Counter Token */}
      {selectedPhysicalService && (
        <div className="modal-backdrop" onClick={() => setSelectedPhysicalService(null)}>
          <div
            className="modal-card fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge badge-physical">
                  <IconWalk />
                  <span>Physical Desk Token</span>
                </span>
                <span className="text-muted text-sm">{selectedPhysicalService.prefix}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>{selectedPhysicalService.name}</h3>
              <p className="text-muted text-sm">
                Est. wait: ~{selectedPhysicalService.estimatedWaitMinutes} mins ({selectedPhysicalService.waitingCount} in line)
              </p>
            </div>

            {tokenError && (
              <div
                style={{
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  color: 'var(--noshow)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
              >
                {tokenError}
              </div>
            )}

            <form onSubmit={handleTakeToken}>
              <div className="form-group">
                <label className="form-label" htmlFor="purpose">
                  Purpose of Physical Visit (Optional)
                </label>
                <input
                  id="purpose"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Degree collection, Caution deposit cheque, Original return"
                  value={tokenPurpose}
                  onChange={(e) => setTokenPurpose(e.target.value)}
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedPhysicalService(null)}
                  disabled={isSubmittingToken}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-indigo btn-sm"
                  disabled={isSubmittingToken}
                >
                  {isSubmittingToken ? (
                    <>
                      <IconSpinner />
                      <span>Issuing Token...</span>
                    </>
                  ) : (
                    'Confirm & Draw Token'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Verified Digital Document Viewer & Printable Certificate */}
      {viewingDoc && (
        <div className="modal-backdrop" onClick={() => setViewingDoc(null)}>
          <div
            className="modal-card modal-card-large fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-digital">
                <IconShield />
                <span>OFFICIAL VERIFIED E-CREDENTIAL</span>
              </span>
              <button
                onClick={() => setViewingDoc(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Printable Official Paper Layout */}
            <div className="certificate-paper" id="printable-certificate">
              <div className="certificate-header">
                <div style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' }}>
                  National Institute of Technology & Management
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: '0.35rem 0' }}>
                  {viewingDoc.doc_title}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  Registrar Office of Academic Records • Central Campus
                </div>
              </div>

              {/* Document Reference Info */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #CBD5E1',
                  paddingBottom: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <strong>Document Ref No:</strong> {viewingDoc.reference_no}
                </div>
                <div>
                  <strong>Issued On:</strong> {new Date(viewingDoc.issued_at).toLocaleDateString()}
                </div>
              </div>

              {/* Student Metadata Fields */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                <div>
                  <span className="text-muted">Student Name:</span>{' '}
                  <strong>{viewingDoc.metadata?.student_name || currentUser?.name}</strong>
                </div>
                <div>
                  <span className="text-muted">Roll No:</span>{' '}
                  <strong>{viewingDoc.metadata?.roll_no || 'NITM-2023-CS-042'}</strong>
                </div>
                <div>
                  <span className="text-muted">Department / Branch:</span>{' '}
                  <strong>{viewingDoc.metadata?.branch || 'Computer Science & Engineering'}</strong>
                </div>
                <div>
                  <span className="text-muted">Academic Term:</span>{' '}
                  <strong>{viewingDoc.metadata?.semester || 'Semester V'} (AY 2026-27)</strong>
                </div>
              </div>

              {/* Certification Statement */}
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#334155', marginBottom: '1.5rem' }}>
                <p style={{ marginBottom: '0.75rem' }}>
                  This document officially certifies that the student referenced above is registered in full-time regular standing at this institution. All academic dues, attendance requisites, and conduct records for the current term have been reviewed and validated against central university ledgers.
                </p>
                <p>
                  <strong>Declared Purpose:</strong> {viewingDoc.purpose}
                </p>
              </div>

              {/* Institutional Digital Seal & Notice */}
              <div
                style={{
                  borderTop: '2px dashed #CBD5E1',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div className="certificate-seal">
                  <IconShield />
                  <div>
                    <div>DIGITALLY VERIFIED CREDENTIAL</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 500, color: '#047857' }}>
                      Security Hash: {viewingDoc.metadata?.verification_code || 'VRF-98214AC'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Registrar / Authorized Signatory</div>
                  <div>National Institute of Technology & Management</div>
                  <div style={{ fontStyle: 'italic', marginTop: '0.2rem' }}>
                    *Physical in-person office visit is NOT required*
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setViewingDoc(null)}
              >
                Close Viewer
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => window.print()}
              >
                <IconPrint />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
