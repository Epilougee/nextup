'use client';

// ============================================================================
// components/ConfirmModal.js
// Standard modal dialog for confirming destructive actions (Cancel, Skip, Delete).
// ============================================================================

import { IconAlert } from './Icons';

export default function ConfirmModal({
  isOpen,
  title = 'Please Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go Back',
  onConfirm,
  onCancel,
  isDanger = false,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-card fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            {isDanger && <IconAlert style={{ color: 'var(--noshow)' }} />}
            <h3>{title}</h3>
          </div>
          <p className="text-muted" style={{ lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
