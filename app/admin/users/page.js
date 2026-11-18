'use client';

// ============================================================================
// app/admin/users/page.js
// Faculty & Students Management Panel
// Allows administrators to add new faculty and students with their email and password,
// manage existing accounts, and test logins immediately.
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ConfirmModal from '@/components/ConfirmModal';
import {
  IconUsers,
  IconUser,
  IconBuilding,
  IconPlus,
  IconTrash,
  IconSpinner,
  IconCheck,
  IconAlert,
  IconCheckCircle,
} from '@/components/Icons';

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'student'

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student', // 'admin' (Faculty/Staff) or 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recentSuccess, setRecentSuccess] = useState(null);

  // Delete User Modal State
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
        if (userData?.user?.role !== 'admin') {
          router.push('/');
          return;
        }
        setCurrentUser(userData.user);

        await fetchUsers();
      } catch (err) {
        setError(err.message || 'Failed to load user session.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed to load user accounts.');
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
    });
    setFormError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user account.');
      }

      setRecentSuccess({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role === 'admin' ? 'Faculty / Staff' : 'Student',
        name: data.user?.name || formData.name,
      });

      setIsModalOpen(false);
      await fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user.');
      }
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole =
        roleFilter === 'all' ? true : u.role === roleFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchQuery]);

  // Counts
  const facultyCount = users.filter((u) => u.role === 'admin').length;
  const studentCount = users.filter((u) => u.role === 'student').length;

  return (
    <AdminLayout user={currentUser}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <span className="brand-badge" style={{ width: '28px', height: '28px', borderRadius: '6px' }}>
                <IconUsers />
              </span>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--primary-dark)' }}>
                Faculty & Students Management
              </h1>
            </div>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Add new faculty and students with their email and password so they can log in immediately.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ fontWeight: 600, boxShadow: 'var(--sh-sm)' }}
          >
            <IconPlus />
            <span>Add Faculty or Student</span>
          </button>
        </div>

        {/* Recent Account Creation Banner */}
        {recentSuccess && (
          <div
            className="fade-in"
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--r-sm)',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <IconCheckCircle style={{ color: '#16A34A', fontSize: '1.25rem', marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#15803D', fontSize: '0.95rem' }}>
                  Account Created Successfully!
                </div>
                <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '0.25rem' }}>
                  <strong>{recentSuccess.name}</strong> ({recentSuccess.role}) can now sign in at the{' '}
                  <a href="/login" target="_blank" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                    Login Page
                  </a>{' '}
                  using:
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    marginTop: '0.5rem',
                    fontSize: '0.825rem',
                    background: '#FFFFFF',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #DCFCE7',
                    display: 'inline-flex',
                  }}
                >
                  <span>
                    Email: <code style={{ fontWeight: 700 }}>{recentSuccess.email}</code>
                  </span>
                  <span>
                    Password: <code style={{ fontWeight: 700 }}>{recentSuccess.password}</code>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setRecentSuccess(null)}
              className="btn btn-sm"
              style={{ background: 'transparent', color: '#15803D', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div className="card" style={{ padding: '1.1rem 1.25rem' }}>
            <div className="text-muted text-xs" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Total Accounts
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '0.25rem' }}>
              {users.length}
            </div>
            <div className="text-muted text-xs" style={{ marginTop: '0.25rem' }}>
              Registered in institution directory
            </div>
          </div>

          <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted text-xs" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Faculty & Staff
              </span>
              <IconBuilding style={{ color: 'var(--primary)', fontSize: '0.9rem' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
              {facultyCount}
            </div>
            <div className="text-muted text-xs" style={{ marginTop: '0.25rem' }}>
              Staff console & counter privileges
            </div>
          </div>

          <div className="card" style={{ padding: '1.1rem 1.25rem', borderLeft: '4px solid #16A34A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted text-xs" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Students
              </span>
              <IconUser style={{ color: '#16A34A', fontSize: '0.9rem' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A', marginTop: '0.25rem' }}>
              {studentCount}
            </div>
            <div className="text-muted text-xs" style={{ marginTop: '0.25rem' }}>
              Queue tokens & instant digital docs
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          className="card"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { id: 'all', label: `All Users (${users.length})` },
              { id: 'admin', label: `Faculty / Staff (${facultyCount})` },
              { id: 'student', label: `Students (${studentCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className="btn btn-sm"
                style={{
                  background: roleFilter === tab.id ? 'var(--primary)' : 'transparent',
                  color: roleFilter === tab.id ? '#FFFFFF' : 'var(--muted)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  borderRadius: 'var(--r-sm)',
                  padding: '0.4rem 0.75rem',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ minWidth: '240px', flex: '1', maxWidth: '340px' }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <IconSpinner style={{ fontSize: '1.75rem', color: 'var(--primary)' }} />
              <div className="text-muted text-sm" style={{ marginTop: '0.75rem' }}>
                Loading user directory...
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>No users found</div>
              <div className="text-muted text-sm" style={{ marginTop: '0.25rem' }}>
                {searchQuery
                  ? `No accounts matching "${searchQuery}".`
                  : 'No accounts registered under this filter.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      User
                    </th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Email Address
                    </th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Role & Access
                    </th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Registered Date
                    </th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isFaculty = u.role === 'admin';
                    const isSelf = currentUser?.id === u.id;

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 100ms ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FBFBFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Name + Avatar */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isFaculty ? '#FFF3EC' : '#F0FDF4',
                                color: isFaculty ? 'var(--primary)' : '#16A34A',
                                border: `1px solid ${isFaculty ? 'var(--accent)' : '#86EFAC'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                flexShrink: 0,
                              }}
                            >
                              {u.name?.slice(0, 1).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                                {u.name}
                                {isSelf && (
                                  <span
                                    style={{
                                      marginLeft: '0.45rem',
                                      fontSize: '0.68rem',
                                      background: 'var(--bg-muted)',
                                      padding: '0.1rem 0.35rem',
                                      borderRadius: '3px',
                                      color: 'var(--muted)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <code style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{u.email}</code>
                        </td>

                        {/* Role Badge */}
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {isFaculty ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                background: '#FFF3EC',
                                color: 'var(--primary)',
                                border: '1px solid #FED7AA',
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--r-pill)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              <IconBuilding style={{ fontSize: '0.7rem' }} />
                              <span>Faculty / Staff (Admin)</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                background: '#F0FDF4',
                                color: '#16A34A',
                                border: '1px solid #BBF7D0',
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--r-pill)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              <IconUser style={{ fontSize: '0.7rem' }} />
                              <span>Student</span>
                            </span>
                          )}
                        </td>

                        {/* Registered Date */}
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Seed'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {isSelf ? (
                            <span className="text-muted text-xs" style={{ fontStyle: 'italic' }}>
                              Active Session
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="btn btn-outline btn-sm"
                              title="Delete user account"
                              style={{
                                padding: '0.3rem 0.6rem',
                                color: 'var(--red)',
                                borderColor: 'var(--border)',
                              }}
                            >
                              <IconTrash style={{ fontSize: '0.75rem' }} />
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {isModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
            <div
              className="modal-card fade-in"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{ maxWidth: '480px' }}
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <span className="brand-badge" style={{ width: '26px', height: '26px', borderRadius: '5px' }}>
                    <IconPlus />
                  </span>
                  <h3 style={{ margin: 0 }}>Add New Faculty or Student</h3>
                </div>
                <p className="text-muted text-sm" style={{ margin: 0 }}>
                  Enter the credentials. The user will be able to log in immediately.
                </p>
              </div>

              {formError && (
                <div
                  style={{
                    backgroundColor: '#FDF2F0',
                    border: '1px solid #F6CECA',
                    color: 'var(--noshow)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--r-sm)',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <IconAlert />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUser}>
                {/* Role Picker */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>
                    Select Account Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {/* Student option */}
                    <div
                      id="role-btn-student"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--r-sm)',
                        border: `2px solid ${formData.role === 'student' ? '#16A34A' : 'var(--border)'}`,
                        background: formData.role === 'student' ? '#F0FDF4' : 'var(--bg)',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: formData.role === 'student' ? '#15803D' : 'var(--text)', fontSize: '0.9rem' }}>
                        <IconUser />
                        <span>Student</span>
                      </div>
                      <div className="text-muted text-xs" style={{ marginTop: '0.35rem', lineHeight: 1.35 }}>
                        Tokens & digital document requests
                      </div>
                    </div>

                    {/* Faculty option */}
                    <div
                      id="role-btn-faculty"
                      onClick={() => setFormData({ ...formData, role: 'admin' })}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--r-sm)',
                        border: `2px solid ${formData.role === 'admin' ? 'var(--primary)' : 'var(--border)'}`,
                        background: formData.role === 'admin' ? '#FFF3EC' : 'var(--bg)',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: formData.role === 'admin' ? 'var(--primary)' : 'var(--text)', fontSize: '0.9rem' }}>
                        <IconBuilding />
                        <span>Faculty / Staff</span>
                      </div>
                      <div className="text-muted text-xs" style={{ marginTop: '0.35rem', lineHeight: 1.35 }}>
                        Queue console, counters & analytics
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: '0.9rem' }}>
                  <label className="form-label" htmlFor="user-name">
                    Full Name
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder={formData.role === 'admin' ? 'e.g. Prof. Sunita Deshmukh' : 'e.g. Rahul Sharma'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Email Address */}
                <div style={{ marginBottom: '0.9rem' }}>
                  <label className="form-label" htmlFor="user-email">
                    Email Address (Login Username)
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    required
                    className="form-input"
                    placeholder={formData.role === 'admin' ? 'faculty@college.edu' : 'student@college.edu'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label className="form-label" htmlFor="user-pass" style={{ margin: 0 }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="user-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="form-input"
                    placeholder="Enter at least 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="text-muted text-xs" style={{ marginTop: '0.3rem' }}>
                    Password is encrypted using bcryptjs before storage.
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
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
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <IconCheck />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="Delete User Account"
          message={`Are you sure you want to delete ${deleteTarget?.name} (${deleteTarget?.email})? They will no longer be able to log in.`}
          confirmLabel="Delete User"
          cancelLabel="Keep User"
          isDanger={true}
          isLoading={isDeleting}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </AdminLayout>
  );
}
