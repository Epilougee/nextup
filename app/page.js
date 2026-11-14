'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ReconnectingPill from '@/components/ReconnectingPill';
import { usePolling } from '@/components/usePolling';
import { DEPARTMENT_CATALOG } from '@/lib/departmentCatalog';

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
      setSuccessMsg(`Issued: ${result.document.doc_title} (Ref: ${result.document.reference_no})`);
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

      {/* Clean Flat Header — no outer card box */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary-dk)' }}>Student Services</h1>
          <p className="text-muted text-sm">Issue verified documents online or take in-person counter tokens.</p>
        </div>
        {currentUser && (
          <span className="text-muted text-sm tabular-nums">{currentUser.name}</span>
        )}
      </div>

      {/* Success notification */}
      {successMsg && (
        <div style={{
          background: 'var(--green-bg)', border: '1px solid var(--green-bd)',
          color: 'var(--green)', borderRadius: 'var(--r-sm)', padding: '0.65rem 1rem',
          marginBottom: '1rem', fontSize: '0.85rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span><i className="fa-solid fa-check" style={{ marginRight: '0.5rem' }} />{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Underline Tabs */}
      <div className="tabs">
        <button className={`tab-btn${activeTab === 'digital' ? ' active' : ''}`} onClick={() => setActiveTab('digital')}>
          Digital Documents
        </button>
        <button className={`tab-btn${activeTab === 'physical' ? ' active' : ''}`} onClick={() => setActiveTab('physical')}>
          Counter Desks
        </button>
        <button className={`tab-btn${activeTab === 'my-docs' ? ' active' : ''}`} onClick={() => setActiveTab('my-docs')}>
          My Documents {myDigitalDocs.length > 0 && `(${myDigitalDocs.length})`}
        </button>
      </div>

      {/* TAB 1: Digital Documents — Clean Section Cards, no nested grey boxes, no capsules */}
      {activeTab === 'digital' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {DEPARTMENT_CATALOG.map((dept) => {
            const docs = dept.items.filter((i) => i.type === 'digital');
            if (!docs.length) return null;
            return (
              <div key={dept.prefix} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Department Section Header */}
                <div style={{
                  padding: '0.75rem 1.25rem',
                  background: 'var(--muted-bg)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                    letterSpacing: '0.04em',
                  }}>{dept.prefix}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary-dk)' }}>{dept.name}</span>
                </div>

                {/* Document List Rows */}
                <div>
                  {docs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1.5rem',
                        padding: '1rem 1.25rem',
                        borderBottom: idx === docs.length - 1 ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--primary-dk)', marginBottom: '0.2rem' }}>
                          {doc.title}
                        </div>
                        <div className="text-muted text-sm" style={{ lineHeight: 1.45 }}>
                          {doc.description}
                        </div>
                      </div>

                      {/* Consistently Sized Issue Button */}
                      <button
                        className="btn btn-primary btn-sm"
                        style={{
                          flexShrink: 0,
                          minWidth: '78px',
                          height: '35px',
                          padding: '0 0.9rem',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                        onClick={() => {
                          setSelectedDocItem(doc);
                          setSelectedDeptPrefix(dept.prefix);
                          setDocPurpose('');
                          setDocError('');
                        }}
                      >
                        Issue
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Physical Counter Desks */}
      {activeTab === 'physical' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {queueLoading && !queueData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((n) => <div key={n} className="card skeleton" style={{ height: '120px' }} />)}
            </div>
          )}

          {queueData?.services?.map((svc) => {
            const isOpen = svc.is_open;
            const canTake = svc.canTake?.ok;
            const rejectReason = svc.canTake?.reason;

            return (
              <div key={svc.id} className="card" style={{ padding: '1.15rem 1.25rem' }}>
                {/* Office Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--muted)' }}>{svc.prefix}</span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-dk)' }}>{svc.name}</h3>
                    </div>
                    <div className="text-muted text-sm">
                      Hours: {svc.open_time?.slice(0, 5)} – {svc.close_time?.slice(0, 5)} IST
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isOpen ? 'var(--green)' : 'var(--muted)',
                  }}>
                    {isOpen ? '● Open' : 'Closed'}
                  </span>
                </div>

                {/* Inline Stats Row — no 3 heavy nested grey boxes */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--muted-bg)',
                  borderRadius: 'var(--r-sm)',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <span className="text-muted">Now Serving: </span>
                    <strong className="tabular-nums" style={{ color: svc.servingTokenCode ? 'var(--accent)' : 'inherit' }}>
                      {svc.servingTokenCode || 'None'}
                    </strong>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
                    <span className="text-muted">In Line: </span>
                    <strong className="tabular-nums">{svc.waitingCount}</strong>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
                    <span className="text-muted">Est. Wait: </span>
                    <strong className="tabular-nums">~{svc.estimatedWaitMinutes}m</strong>
                  </div>
                </div>

                {/* Action button */}
                {svc.activeToken ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <span className="text-sm">
                      Active token: <strong>{svc.activeToken.token_code}</strong>
                    </span>
                    <button className="btn btn-outline btn-sm" onClick={() => router.push('/my-token')}>
                      View Live Position
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      className="btn btn-primary btn-block"
                      disabled={!canTake}
                      onClick={() => { setSelectedPhysicalService(svc); setTokenError(''); }}
                    >
                      Take Token
                    </button>
                    {!canTake && rejectReason && (
                      <div className="text-muted text-sm" style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.78rem' }}>
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

      {/* TAB 3: My Documents */}
      {activeTab === 'my-docs' && (
        <div className="fade-in">
          {loadingDocs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2].map((n) => <div key={n} className="card skeleton" style={{ height: '80px' }} />)}
            </div>
          ) : myDigitalDocs.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon"><i className="fa-solid fa-file-lines" /></div>
              <div className="empty-title">No documents issued yet</div>
              <p className="empty-sub">Switch to the Digital Documents tab to apply online.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('digital')}>
                Browse Documents
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {myDigitalDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    padding: '1rem 1.25rem',
                    borderBottom: idx === myDigitalDocs.length - 1 ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--primary-dk)' }}>
                      {doc.doc_title}
                    </div>
                    <div className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>
                      Ref: <strong className="tabular-nums">{doc.reference_no}</strong> · {doc.service?.name || 'Academic Office'} · {doc.purpose}
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flexShrink: 0, minWidth: '78px', height: '35px' }}
                    onClick={() => setViewingDoc(doc)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
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
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{selectedDocItem.title}</h3>
                  <p className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>
                    {selectedDeptPrefix} · Online Document Issuance
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDocItem(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem', padding: '0.2rem' }}
                >
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
                <label className="form-label" htmlFor="doc-sem">Semester / Academic Term</label>
                <input id="doc-sem" type="text" required className="form-input" value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-purpose">Purpose</label>
                <input id="doc-purpose" type="text" required className="form-input" placeholder="e.g. Scholarship, Bank loan, Passport" value={docPurpose} onChange={(e) => setDocPurpose(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedDocItem(null)} disabled={isIssuingDoc}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isIssuingDoc}>
                  {isIssuingDoc ? <><i className="fa-solid fa-spinner fa-spin" /> Issuing…</> : 'Issue Document'}
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
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{selectedPhysicalService.name}</h3>
                  <p className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>
                    Counter Desk · ~{selectedPhysicalService.estimatedWaitMinutes} min wait ({selectedPhysicalService.waitingCount} in line)
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPhysicalService(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.1rem', padding: '0.2rem' }}
                >
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
                <label className="form-label" htmlFor="purpose">Purpose of Visit (optional)</label>
                <input id="purpose" type="text" className="form-input" placeholder="e.g. Degree collection, Original return" value={tokenPurpose} onChange={(e) => setTokenPurpose(e.target.value)} maxLength={100} autoFocus />
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
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--green)' }}>
                <i className="fa-solid fa-check" style={{ marginRight: '0.35rem' }} /> Verified E-Document
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
                  <div style={{ fontStyle: 'italic', marginTop: '0.15rem' }}>Digital credential — physical visit not required</div>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setViewingDoc(null)}>Close</button>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                <i className="fa-solid fa-print" style={{ marginRight: '0.35rem' }} /> Print / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
