'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ReconnectingPill from '@/components/ReconnectingPill';
import { usePolling } from '@/components/usePolling';
import { DEPARTMENT_CATALOG } from '@/lib/departmentCatalog';
import {
  IconDocument,
  IconBolt,
  IconWalk,
  IconPlus,
  IconSpinner,
  IconPrint,
  IconShield,
  IconClose,
  IconCheck,
  IconCancel,
} from '@/components/Icons';

export default function StudentHomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('digital');

  const [selectedDocItem, setSelectedDocItem] = useState(null);
  const [selectedDeptPrefix, setSelectedDeptPrefix] = useState('');
  const [docPurpose, setDocPurpose] = useState('');
  const [rollNo, setRollNo] = useState('NITM-2023-CS-042');
  const [semester, setSemester] = useState('Semester V');
  const [isIssuingDoc, setIsIssuingDoc] = useState(false);
  const [docError, setDocError] = useState('');

  const [selectedPhysicalService, setSelectedPhysicalService] = useState(null);
  const [tokenPurpose, setTokenPurpose] = useState('');
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [viewingDoc, setViewingDoc] = useState(null);
  const [myDigitalDocs, setMyDigitalDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const loadMyDigitalDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/student/digital-docs');
      if (res.ok) { const d = await res.json(); setMyDigitalDocs(d.documents || []); }
    } catch { /* ignore */ } finally { setLoadingDocs(false); }
  };

  useEffect(() => { loadMyDigitalDocs(); }, []);
  useEffect(() => { if (activeTab === 'my-docs') loadMyDigitalDocs(); }, [activeTab]);

  const fetchServices = async () => {
    const res = await fetch('/api/student/services');
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };
  const { data: queueData, isLoading: queueLoading, isReconnecting } = usePolling(fetchServices, 4000);

  const handleIssueDigitalDoc = async (e) => {
    e.preventDefault();
    setDocError('');
    setIsIssuingDoc(true);
    try {
      const res = await fetch('/api/student/digital-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_type: selectedDocItem.id,
          service_prefix: selectedDeptPrefix,
          purpose: docPurpose || 'Official Use',
          custom_fields: { roll_no: rollNo, semester },
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to issue document');
      setSelectedDocItem(null);
      setSuccessMsg(`Issued: ${result.document.doc_title} — Ref ${result.document.reference_no}`);
      await loadMyDigitalDocs();
      setViewingDoc(result.document);
    } catch (err) { setDocError(err.message); }
    finally { setIsIssuingDoc(false); }
  };

  const handleTakeToken = async (e) => {
    e.preventDefault();
    setTokenError('');
    setIsSubmittingToken(true);
    try {
      const res = await fetch('/api/student/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: selectedPhysicalService.id, purpose: tokenPurpose.trim() || null }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to take token');
      setSelectedPhysicalService(null);
      setTokenPurpose('');
      router.push('/my-token');
    } catch (err) { setTokenError(err.message); }
    finally { setIsSubmittingToken(false); }
  };

  return (
    <StudentLayout user={currentUser}>
      <ReconnectingPill show={isReconnecting} />

      {/* Page header */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.2rem' }}>Student Desk</h1>
          {currentUser && (
            <span className="text-muted text-sm">{currentUser.name}</span>
          )}
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div style={{
          background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
          color: 'var(--green)', borderRadius: 'var(--r-sm)', padding: '0.6rem 1rem',
          marginBottom: '1rem', fontSize: '0.85rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span><i className="fa-solid fa-check" style={{ marginRight: '0.5rem' }} />{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button className={`tab-btn${activeTab === 'digital' ? ' active' : ''}`} onClick={() => setActiveTab('digital')}>
          <i className="fa-solid fa-bolt" /> Get Docs
        </button>
        <button className={`tab-btn${activeTab === 'physical' ? ' active' : ''}`} onClick={() => setActiveTab('physical')}>
          <i className="fa-solid fa-person-walking" /> Take Token
        </button>
        <button className={`tab-btn${activeTab === 'my-docs' ? ' active' : ''}`} onClick={() => setActiveTab('my-docs')}>
          <i className="fa-solid fa-file-lines" /> My Docs {myDigitalDocs.length > 0 && `(${myDigitalDocs.length})`}
        </button>
      </div>

      {/* TAB 1: Digital Documents */}
      {activeTab === 'digital' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
            borderRadius: 'var(--r-sm)', padding: '0.6rem 0.9rem',
            fontSize: '0.83rem', color: 'var(--green)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <i className="fa-solid fa-shield-halved" />
            <span>Issued instantly online — no office visit needed.</span>
          </div>

          {DEPARTMENT_CATALOG.map((dept) => {
            const docs = dept.items.filter((i) => i.type === 'digital');
            if (!docs.length) return null;
            return (
              <div key={dept.prefix} className="card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      background: 'var(--muted-bg)', border: '1px solid var(--border)',
                      fontWeight: 800, fontSize: '0.72rem', padding: '0.15rem 0.4rem',
                      borderRadius: 'var(--r-sm)',
                    }}>{dept.prefix}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{dept.name}</h3>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                    <span className="status-dot" /> Online
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {docs.map((doc) => (
                    <div key={doc.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '1rem', padding: '0.75rem 0.9rem',
                      background: 'var(--muted-bg)', borderRadius: 'var(--r-sm)',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{doc.title}</div>
                        <div className="text-muted text-sm" style={{ lineHeight: 1.4 }}>{doc.description}</div>
                      </div>
                      <button
                        className="btn btn-green btn-sm"
                        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={() => {
                          setSelectedDocItem(doc);
                          setSelectedDeptPrefix(dept.prefix);
                          setDocPurpose('');
                          setDocError('');
                        }}
                      >
                        <i className="fa-solid fa-bolt" /> Issue
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Physical Counter */}
      {activeTab === 'physical' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'var(--blue-bg)', border: '1px solid var(--blue-bd)',
            borderRadius: 'var(--r-sm)', padding: '0.6rem 0.9rem',
            fontSize: '0.83rem', color: 'var(--blue)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <i className="fa-solid fa-person-walking" />
            <span>These services require an in-person visit. Take a token to hold your place.</span>
          </div>

          {queueLoading && !queueData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((n) => <div key={n} className="card skeleton" style={{ height: '130px' }} />)}
            </div>
          )}

          {queueData?.services?.map((svc) => {
            const isOpen = svc.is_open;
            const canTake = svc.canTake?.ok;
            const rejectReason = svc.canTake?.reason;

            return (
              <div key={svc.id} className="card" style={{
                padding: '1rem 1.25rem',
                borderLeft: `3px solid ${isOpen ? 'var(--blue)' : 'var(--border)'}`,
              }}>
                {/* Office header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      background: 'var(--muted-bg)', border: '1px solid var(--border)',
                      fontWeight: 800, fontSize: '0.72rem', padding: '0.15rem 0.4rem',
                      borderRadius: 'var(--r-sm)',
                    }}>{svc.prefix}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{svc.name}</span>
                  </div>
                  <span className={`badge ${isOpen ? 'badge-green' : 'badge-red'}`}>
                    <span className="status-dot" /> {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem', marginBottom: '0.85rem', textAlign: 'center',
                }}>
                  {[
                    { label: 'Serving', val: svc.servingTokenCode || '—', accent: !!svc.servingTokenCode },
                    { label: 'In Line', val: svc.waitingCount },
                    { label: 'Wait', val: `~${svc.estimatedWaitMinutes}m` },
                  ].map(({ label, val, accent }) => (
                    <div key={label} className="inset" style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <div className="text-xs text-muted" style={{ marginBottom: '0.2rem' }}>{label}</div>
                      <div className="tabular-nums" style={{
                        fontWeight: 800, fontSize: '1.05rem',
                        color: accent ? 'var(--accent)' : 'var(--primary)',
                      }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {svc.activeToken ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '0.75rem', background: 'var(--blue-bg)',
                    border: '1px solid var(--blue-bd)', borderRadius: 'var(--r-sm)',
                    padding: '0.5rem 0.75rem',
                  }}>
                    <span className="text-sm" style={{ color: 'var(--blue)', fontWeight: 500 }}>
                      Your token: <strong>{svc.activeToken.token_code}</strong>
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => router.push('/my-token')}>
                      Track
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className={`btn btn-block${canTake ? ' btn-primary' : ' btn-outline'}`}
                      disabled={!canTake}
                      onClick={() => { setSelectedPhysicalService(svc); setTokenError(''); }}
                    >
                      <i className="fa-solid fa-plus" />
                      <span>Take Token</span>
                    </button>
                    {!canTake && rejectReason && (
                      <div className="text-muted text-sm" style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.78rem' }}>
                        {rejectReason}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: My Docs */}
      {activeTab === 'my-docs' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingDocs ? (
            [1, 2].map((n) => <div key={n} className="card skeleton" style={{ height: '90px' }} />)
          ) : myDigitalDocs.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon"><i className="fa-solid fa-file-lines" /></div>
              <div className="empty-title">No documents yet</div>
              <p className="empty-sub">Use "Get Docs" to apply for a document online.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('digital')}>
                Get Docs
              </button>
            </div>
          ) : (
            myDigitalDocs.map((doc) => (
              <div key={doc.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                        <i className="fa-solid fa-shield-halved" style={{ marginRight: '0.25rem' }} /> Verified
                      </span>
                      <span className="text-muted text-xs tabular-nums">Ref: <strong>{doc.reference_no}</strong></span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{doc.doc_title}</div>
                    <div className="text-muted text-sm">
                      {doc.service?.name || 'Academic Office'} — {doc.purpose}
                    </div>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => setViewingDoc(doc)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <i className="fa-solid fa-print" /> View
                  </button>
                </div>

                <div className="inset" style={{ marginTop: '0.65rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted">
                    {doc.metadata?.student_name || currentUser?.name} · {doc.metadata?.roll_no || '—'}
                  </span>
                  <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.75rem' }}>E-Credential</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Issue Digital Doc */}
      {selectedDocItem && (
        <div className="modal-backdrop" onClick={() => setSelectedDocItem(null)}>
          <div className="modal-card fade-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-green" style={{ marginBottom: '0.4rem' }}>
                    <i className="fa-solid fa-bolt" style={{ marginRight: '0.3rem' }} /> Instant Issue
                  </span>
                  <h3 style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{selectedDocItem.title}</h3>
                </div>
                <button onClick={() => setSelectedDocItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem', padding: '0.2rem' }}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            {docError && (
              <div style={{
                background: 'var(--red-bg)', border: '1px solid var(--red-bd)',
                color: 'var(--red)', borderRadius: 'var(--r-sm)',
                padding: '0.6rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem',
              }}>{docError}</div>
            )}

            <form onSubmit={handleIssueDigitalDoc}>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-roll">Roll / Registration No.</label>
                <input id="doc-roll" type="text" required className="form-input" value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-sem">Semester</label>
                <input id="doc-sem" type="text" required className="form-input" value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-purpose">Purpose</label>
                <input id="doc-purpose" type="text" required className="form-input" placeholder="e.g. Scholarship, Bank loan, Passport" value={docPurpose} onChange={(e) => setDocPurpose(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedDocItem(null)} disabled={isIssuingDoc}>Cancel</button>
                <button type="submit" className="btn btn-green btn-sm" disabled={isIssuingDoc}>
                  {isIssuingDoc ? <><i className="fa-solid fa-spinner fa-spin" /> Generating…</> : 'Issue Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Take Token */}
      {selectedPhysicalService && (
        <div className="modal-backdrop" onClick={() => setSelectedPhysicalService(null)}>
          <div className="modal-card fade-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-blue" style={{ marginBottom: '0.4rem' }}>
                    <i className="fa-solid fa-ticket" style={{ marginRight: '0.3rem' }} /> Counter Token
                  </span>
                  <h3 style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{selectedPhysicalService.name}</h3>
                  <p className="text-muted text-sm">~{selectedPhysicalService.estimatedWaitMinutes} min wait · {selectedPhysicalService.waitingCount} in line</p>
                </div>
                <button onClick={() => setSelectedPhysicalService(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem', padding: '0.2rem' }}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            {tokenError && (
              <div style={{
                background: 'var(--red-bg)', border: '1px solid var(--red-bd)',
                color: 'var(--red)', borderRadius: 'var(--r-sm)',
                padding: '0.6rem 0.85rem', marginBottom: '1rem', fontSize: '0.85rem',
              }}>{tokenError}</div>
            )}

            <form onSubmit={handleTakeToken}>
              <div className="form-group">
                <label className="form-label" htmlFor="purpose">Purpose (optional)</label>
                <input id="purpose" type="text" className="form-input" placeholder="e.g. Degree collection, Caution deposit" value={tokenPurpose} onChange={(e) => setTokenPurpose(e.target.value)} maxLength={100} autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedPhysicalService(null)} disabled={isSubmittingToken}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingToken}>
                  {isSubmittingToken ? <><i className="fa-solid fa-spinner fa-spin" /> Issuing…</> : 'Confirm Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Document */}
      {viewingDoc && (
        <div className="modal-backdrop" onClick={() => setViewingDoc(null)}>
          <div className="modal-card modal-card-lg fade-in" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-green">
                <i className="fa-solid fa-shield-halved" style={{ marginRight: '0.3rem' }} /> Verified E-Document
              </span>
              <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem' }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="cert-paper" id="printable-certificate">
              <div className="certificate-header">
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', color: '#475569', textTransform: 'uppercase' }}>
                  College Administration
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: '0.3rem 0' }}>
                  {viewingDoc.doc_title}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Office of Academic Records</div>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderBottom: '1px solid #CBD5E1', paddingBottom: '0.65rem',
                marginBottom: '0.9rem', fontSize: '0.8rem',
              }}>
                <span><strong>Ref:</strong> {viewingDoc.reference_no}</span>
                <span><strong>Issued:</strong> {new Date(viewingDoc.issued_at).toLocaleDateString()}</span>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '6px', padding: '0.9rem', marginBottom: '1rem',
                fontSize: '0.85rem',
              }}>
                <div><span className="text-muted">Name: </span><strong>{viewingDoc.metadata?.student_name || currentUser?.name}</strong></div>
                <div><span className="text-muted">Roll No: </span><strong>{viewingDoc.metadata?.roll_no || '—'}</strong></div>
                <div><span className="text-muted">Branch: </span><strong>{viewingDoc.metadata?.branch || 'Computer Science & Engineering'}</strong></div>
                <div><span className="text-muted">Term: </span><strong>{viewingDoc.metadata?.semester || 'Semester V'}</strong></div>
              </div>

              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', marginBottom: '1.25rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  This document certifies that the above-named student is enrolled in full-time regular standing at this institution.
                </p>
                <p><strong>Purpose:</strong> {viewingDoc.purpose}</p>
              </div>

              <div style={{
                borderTop: '2px dashed #CBD5E1', paddingTop: '0.9rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
              }}>
                <div className="certificate-seal">
                  <i className="fa-solid fa-shield-halved" />
                  <div>
                    <div>DIGITALLY VERIFIED</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 500, color: '#047857' }}>
                      Code: {viewingDoc.metadata?.verification_code || 'VRF-98214AC'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748B' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>Registrar / Authorised Signatory</div>
                  <div style={{ fontStyle: 'italic', marginTop: '0.15rem' }}>Digital credential — no office visit required</div>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setViewingDoc(null)}>Close</button>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                <i className="fa-solid fa-print" /> Print / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
