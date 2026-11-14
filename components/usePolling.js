'use client';

// ============================================================================
// components/usePolling.js
// Custom Hook: Polls an API endpoint every 4 seconds with setInterval.
// Automatically pauses when browser tab is hidden to conserve serverless quota.
// Tracks background reconnecting state without tearing down current UI.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

export function usePolling(fetcherFn, intervalMs = 4000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const fetcherRef = useRef(fetcherFn);
  useEffect(() => {
    fetcherRef.current = fetcherFn;
  }, [fetcherFn]);

  const executeFetch = useCallback(async (isInitial = false) => {
    try {
      if (isInitial && !data) {
        setIsLoading(true);
      }
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      setIsReconnecting(false);
    } catch (err) {
      console.warn('Polling fetch error:', err);
      if (!isInitial) {
        // If background poll failed, show reconnecting badge instead of blanking UI
        setIsReconnecting(true);
      } else {
        setError(err.message || 'Failed to load initial data');
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, [data]);

  useEffect(() => {
    let intervalId = null;

    // Initial fetch on mount
    executeFetch(true);

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          executeFetch(false);
        }
      }, intervalMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Immediately refresh when student or staff switches back to tab
        executeFetch(false);
        startPolling();
      } else {
        // Tab is hidden, clear timer to avoid unnecessary serverless function hits
        if (intervalId) clearInterval(intervalId);
      }
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      startPolling();
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [executeFetch, intervalMs]);

  const mutate = useCallback(() => {
    return executeFetch(false);
  }, [executeFetch]);

  return { data, error, isLoading, isReconnecting, mutate };
}
