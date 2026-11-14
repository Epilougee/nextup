'use client';

// ============================================================================
// components/ReconnectingPill.js
// Subtle top-right pill shown when background polling network drops temporarily.
// ============================================================================

import { IconSpinner } from './Icons';

export default function ReconnectingPill({ show }) {
  if (!show) return null;

  return (
    <div className="reconnecting-pill" role="status" aria-live="polite">
      <IconSpinner style={{ fontSize: '0.75rem' }} />
      <span>Reconnecting...</span>
    </div>
  );
}
