'use client';

// ============================================================================
// app/admin/services/page.js
// Manage College Administration Offices: Add, Edit, Delete, Toggle Open/Close,
// Operating Hours, Default Service Time, and Daily Quotas.
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ConfirmModal from '@/components/ConfirmModal';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSpinner,
  IconCheck,
} from '@/components/Icons';

export default function AdminServicesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    prefix: '',
    avg_minutes_default: 8,
    open_time: '10:00',
    close_time: '16:00',
    is_open: true,
    max_tokens_per_day: 100,
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        if (userData.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setCurrentUser(userData.user);

        await fetchServices();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  const fetchServices = async () => {
    const res = await fetch('/api/admin/services');
    if (!res.ok) throw new Error('Failed to load services');
    const data = await res.json();
    setServices(data.services || []);
  };

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      prefix: '',
      avg_minutes_default: 8,
      open_time: '10:00',
      close_time: '16:00',
      is_open: true,
      max_tokens_per_day: 100,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (svc) => {
    setEditingService(svc);
    setFormData({
      name: svc.name,
      prefix: svc.prefix,
      avg_minutes_default: svc.avg_minutes_default,
      open_time: svc.open_time.slice(0, 5),
      close_time: svc.close_time.slice(0, 5),
      is_open: svc.is_open,
      max_tokens_per_day: svc.max_tokens_per_day,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleOpen = async (svc) => {
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !svc.is_open }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      await fetchServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : '/api/admin/services';
      const method = editingService ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save service');
      }

      setIsModalOpen(false);
      await fetchServices();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/services/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete service');

      setDeleteTarget(null);
      await fetchServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout user={currentUser}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>Administration Offices</h1>
          <p className="text-muted text-sm">
            Configure office counters, working hours, service targets, and queue limits.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <IconPlus />
          <span>Add New Office</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FDF2F0',
            border: '1px solid #F6CECA',
            color: 'var(--noshow)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card skeleton" style={{ height: '110px' }} />
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Office Name</th>
                <th>Prefix</th>
                <th>Status</th>
                <th>Operating Hours</th>
                <th>Avg Target</th>
                <th>Daily Limit</th>
                <th>Today's Volume</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{svc.name}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        backgroundColor: '#F3F4F6',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      className="tabular-nums"
                    >
                      {svc.prefix}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleOpen(svc)}
                      className={`badge ${svc.is_open ? 'badge-open' : 'badge-closed'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Click to toggle Open/Closed status"
                    >
                      {svc.is_open ? 'Open' : 'Closed'}
                    </button>
                  </td>
                  <td className="tabular-nums">
                    {svc.open_time.slice(0, 5)} - {svc.close_time.slice(0, 5)}
                  </td>
                  <td className="tabular-nums">{svc.avg_minutes_default} min</td>
                  <td className="tabular-nums">{svc.max_tokens_per_day}</td>
                  <td className="text-muted text-sm tabular-nums">
                    {svc.today_total || 0} total ({svc.today_waiting || 0} waiting)
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenEdit(svc)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.3rem 0.6rem', minHeight: '32px' }}
                        title="Edit Office"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(svc)}
                        className="btn btn-danger-outline btn-sm"
                        style={{ padding: '0.3rem 0.6rem', minHeight: '32px' }}
                        title="Delete Office"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Office Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-card fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>{editingService ? 'Edit Office Service' : 'Add New Office Service'}</h3>
              <p className="text-muted text-sm">
                Enter office naming, prefix code, and operating parameters.
              </p>
            </div>

            {formError && (
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
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveService}>
              <div className="form-group">
                <label className="form-label" htmlFor="svc-name">
                  Office Name
                </label>
                <input
                  id="svc-name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Accounts Office, Admissions Cell"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="svc-prefix">
                    Prefix Code
                  </label>
                  <input
                    id="svc-prefix"
                    type="text"
                    required
                    maxLength={6}
                    className="form-input"
                    placeholder="e.g. ACC, EXM"
                    value={formData.prefix}
                    onChange={(e) =>
                      setFormData({ ...formData, prefix: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="svc-avg">
                    Avg Minutes Default
                  </label>
                  <input
                    id="svc-avg"
                    type="number"
                    min={1}
                    max={60}
                    required
                    className="form-input tabular-nums"
                    value={formData.avg_minutes_default}
                    onChange={(e) =>
                      setFormData({ ...formData, avg_minutes_default: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="svc-open">
                    Open Time (IST)
                  </label>
                  <input
                    id="svc-open"
                    type="time"
                    required
                    className="form-input tabular-nums"
                    value={formData.open_time}
                    onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="svc-close">
                    Close Time (IST)
                  </label>
                  <input
                    id="svc-close"
                    type="time"
                    required
                    className="form-input tabular-nums"
                    value={formData.close_time}
                    onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="svc-max">
                    Daily Token Limit
                  </label>
                  <input
                    id="svc-max"
                    type="number"
                    min={1}
                    max={1000}
                    required
                    className="form-input tabular-nums"
                    value={formData.max_tokens_per_day}
                    onChange={(e) =>
                      setFormData({ ...formData, max_tokens_per_day: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="svc-status">
                    Service Status
                  </label>
                  <select
                    id="svc-status"
                    className="form-select"
                    value={formData.is_open ? 'open' : 'closed'}
                    onChange={(e) =>
                      setFormData({ ...formData, is_open: e.target.value === 'open' })
                    }
                  >
                    <option value="open">Open (Accepting Tokens)</option>
                    <option value="closed">Closed (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <IconSpinner />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Office Service?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated tokens for this service will also be removed.`}
        confirmLabel="Yes, Delete Service"
        cancelLabel="Keep Service"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteService}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
