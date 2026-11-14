// ============================================================================
// app/api/admin/analytics/route.js
// Provides queue performance metrics, hourly chart distribution, and per-office breakdown.
// Supports date filters: 'today' and '7days'.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayISTDateString, getPastISTDateString } from '@/lib/time';
import { getAnalytics } from '@/lib/queueEngine';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    const todayStr = getTodayISTDateString();
    const startDateStr = range === '7days' ? getPastISTDateString(7) : todayStr;

    // 1. Fetch tokens in the date window
    const { data: tokens, error: tokErr } = await supabase
      .from('tokens')
      .select('*, service:services(id, name, prefix)')
      .gte('token_date', startDateStr)
      .lte('token_date', todayStr)
      .order('created_at', { ascending: true });

    if (tokErr) throw tokErr;

    // 2. Fetch all services
    const { data: services, error: servErr } = await supabase
      .from('services')
      .select('id, name, prefix')
      .order('name', { ascending: true });

    if (servErr) throw servErr;

    const allTokens = tokens || [];

    // 3. Compute overall aggregated metrics and hourly distribution
    const analytics = getAnalytics(allTokens);

    // 4. Per-service breakdown table
    const serviceBreakdown = (services || []).map((serv) => {
      const sTokens = allTokens.filter((t) => t.service_id === serv.id);
      const servAnalytics = getAnalytics(sTokens);
      return {
        id: serv.id,
        name: serv.name,
        prefix: serv.prefix,
        total: servAnalytics.totalTokens,
        completed: servAnalytics.completedCount,
        noShow: servAnalytics.noShowCount,
        cancelled: servAnalytics.cancelledCount,
        avgWaitMinutes: servAnalytics.avgWaitMinutes,
        avgServiceMinutes: servAnalytics.avgServiceMinutes,
        noShowRate: servAnalytics.noShowRate,
      };
    });

    return NextResponse.json({
      range,
      startDate: startDateStr,
      endDate: todayStr,
      summary: {
        totalTokens: analytics.totalTokens,
        avgWaitMinutes: analytics.avgWaitMinutes,
        avgServiceMinutes: analytics.avgServiceMinutes,
        noShowRate: analytics.noShowRate,
        completedCount: analytics.completedCount,
      },
      chartData: analytics.hourlyCounts,
      serviceBreakdown,
    });
  } catch (err) {
    console.error('Error in analytics route:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics.' }, { status: 500 });
  }
}
