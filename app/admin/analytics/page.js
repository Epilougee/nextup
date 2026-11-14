'use client';

// ============================================================================
// app/admin/analytics/page.js
// Queue Analytics Dashboard: 4 Stat Cards, Tokens-by-Hour Bar Chart,
// and Per-Office Performance Table. Filterable by Today or Last 7 Days.
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  IconAnalytics,
  IconClock,
  IconUsers,
  IconCheckCircle,
  IconTimesCircle,
} from '@/components/Icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [range, setRange] = useState('today');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkAuth() {
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
      } catch (err) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}`);
        if (!res.ok) throw new Error('Failed to load analytics data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [range]);

  const summary = data?.summary || {
    totalTokens: 0,
    avgWaitMinutes: 0,
    avgServiceMinutes: 0,
    noShowRate: '0%',
    completedCount: 0,
  };

  const chartData = {
    labels: data?.chartData?.labels || [
      '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
    ],
    datasets: [
      {
        label: 'Tokens Issued (IST)',
        data: data?.chartData?.data || [0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#1F2937',
        hoverBackgroundColor: '#E8590C',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#111827',
        padding: 10,
        titleFont: { size: 13, family: 'Inter' },
        bodyFont: { size: 13, family: 'Inter' },
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 12 }, color: '#6B7280' },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#E6E3DD' },
        ticks: {
          stepSize: 2,
          font: { family: 'Inter', size: 12 },
          color: '#6B7280',
        },
      },
    },
  };

  return (
    <AdminLayout user={currentUser}>
      {/* Page Header and Range Filter */}
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
          <h1 style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>Queue Analytics</h1>
          <p className="text-muted text-sm">
            Office workload, service efficiency, and peak hour trends across college offices.
          </p>
        </div>

        {/* Filter Toggle: Today / Last 7 Days */}
        <div style={{ display: 'inline-flex', backgroundColor: '#EFECE6', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
          <button
            type="button"
            className={`btn btn-sm ${range === 'today' ? 'btn-primary' : 'btn-outline'}`}
            style={{
              border: 'none',
              backgroundColor: range === 'today' ? 'var(--primary)' : 'transparent',
              color: range === 'today' ? '#FFFFFF' : 'var(--text)',
            }}
            onClick={() => setRange('today')}
          >
            Today
          </button>
          <button
            type="button"
            className={`btn btn-sm ${range === '7days' ? 'btn-primary' : 'btn-outline'}`}
            style={{
              border: 'none',
              backgroundColor: range === '7days' ? 'var(--primary)' : 'transparent',
              color: range === '7days' ? '#FFFFFF' : 'var(--text)',
            }}
            onClick={() => setRange('7days')}
          >
            Last 7 Days
          </button>
        </div>
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

      {/* 4 Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card">
          <div className="text-muted text-sm" style={{ marginBottom: '0.35rem' }}>
            Total Tokens Issued
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }} className="tabular-nums">
            {summary.totalTokens}
          </div>
          <div className="text-muted text-sm" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {summary.completedCount} successfully completed
          </div>
        </div>

        <div className="card">
          <div className="text-muted text-sm" style={{ marginBottom: '0.35rem' }}>
            Average Wait Time
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--blue)' }} className="tabular-nums">
            {summary.avgWaitMinutes} min
          </div>
          <div className="text-muted text-sm" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            From token creation to desk call
          </div>
        </div>

        <div className="card">
          <div className="text-muted text-sm" style={{ marginBottom: '0.35rem' }}>
            Average Service Time
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green)' }} className="tabular-nums">
            {summary.avgServiceMinutes} min
          </div>
          <div className="text-muted text-sm" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Actual desk handling duration
          </div>
        </div>

        <div className="card">
          <div className="text-muted text-sm" style={{ marginBottom: '0.35rem' }}>
            No-Show Rate
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--red)' }} className="tabular-nums">
            {summary.noShowRate}
          </div>
          <div className="text-muted text-sm" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
            Skipped students who did not arrive
          </div>
        </div>
      </div>

      {/* Tokens-by-Hour Bar Chart */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Tokens by Hour of Day (IST)</h2>
            <div className="text-muted text-sm">
              Distribution of student arrival volume during office hours (09:00 - 17:00 IST).
            </div>
          </div>
        </div>

        <div style={{ height: '280px', position: 'relative' }}>
          {isLoading ? (
            <div className="skeleton" style={{ height: '100%', width: '100%' }} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Per-Office Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.15rem' }}>Office Performance Breakdown</h2>
          <span className="text-muted text-sm">
            {range === 'today' ? 'Today' : 'Last 7 Days'} Summary
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Office</th>
                <th>Prefix</th>
                <th>Total Tokens</th>
                <th>Completed</th>
                <th>No-Shows</th>
                <th>Avg Wait</th>
                <th>Avg Service</th>
                <th>No-Show Rate</th>
              </tr>
            </thead>
            <tbody>
              {(data?.serviceBreakdown || []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        backgroundColor: '#F3F4F6',
                        padding: '0.2rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      className="tabular-nums"
                    >
                      {s.prefix}
                    </span>
                  </td>
                  <td className="tabular-nums">{s.total}</td>
                  <td className="tabular-nums" style={{ color: 'var(--completed)', fontWeight: 600 }}>
                    {s.completed}
                  </td>
                  <td className="tabular-nums" style={{ color: 'var(--noshow)' }}>
                    {s.noShow}
                  </td>
                  <td className="tabular-nums">{s.avgWaitMinutes} min</td>
                  <td className="tabular-nums">{s.avgServiceMinutes} min</td>
                  <td className="tabular-nums">{s.noShowRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
