// ============================================================================
// app/api/admin/queue/route.js
// Admin Queue Console data provider: current serving token, waiting list,
// summary metrics, and office switcher.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayISTDateString } from '@/lib/time';
import {
  formatToken,
  averageServiceMinutes,
  estimateWaitMinutes,
} from '@/lib/queueEngine';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let serviceId = searchParams.get('service_id');

    // 1. Fetch all services for the dropdown switcher
    const { data: services, error: servErr } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (servErr) throw servErr;
    if (!services || services.length === 0) {
      return NextResponse.json({
        services: [],
        currentService: null,
        nowServing: null,
        waitingList: [],
        summary: { waitingCount: 0, servedTodayCount: 0, avgServiceMinutes: 0 },
      });
    }

    // Default to first service if none provided or invalid
    let activeService = services.find((s) => s.id === serviceId) || services[0];
    serviceId = activeService.id;

    const todayStr = getTodayISTDateString();

    // 2. Fetch today's tokens for the selected office
    const { data: tokens, error: tokErr } = await supabase
      .from('tokens')
      .select('*, student:users(name, email)')
      .eq('service_id', serviceId)
      .eq('token_date', todayStr)
      .order('created_at', { ascending: true });

    if (tokErr) throw tokErr;

    const allTokens = tokens || [];

    // Currently serving token (if any)
    const servingToken = allTokens.find((t) => t.status === 'serving') || null;

    // Waiting tokens strictly ordered by created_at (FIFO)
    const waitingTokens = allTokens.filter((t) => t.status === 'waiting');
    const completedTokens = allTokens.filter((t) => t.status === 'completed');

    const avgMinutes = averageServiceMinutes(completedTokens, activeService.avg_minutes_default);

    const waitingList = waitingTokens.map((t, index) => {
      const position = index + 1;
      return {
        id: t.id,
        token_no: t.token_no,
        token_code: formatToken(activeService.prefix, t.token_no),
        student_name: t.student?.name || 'Student',
        student_email: t.student?.email || '',
        purpose: t.purpose || 'General Inquiry',
        created_at: t.created_at,
        position,
        estimated_wait_minutes: estimateWaitMinutes(position, avgMinutes),
      };
    });

    const formattedServing = servingToken
      ? {
          id: servingToken.id,
          token_no: servingToken.token_no,
          token_code: formatToken(activeService.prefix, servingToken.token_no),
          student_name: servingToken.student?.name || 'Student',
          student_email: servingToken.student?.email || '',
          purpose: servingToken.purpose || 'General Inquiry',
          called_at: servingToken.called_at,
          status: servingToken.status,
        }
      : null;

    return NextResponse.json({
      services,
      currentService: activeService,
      nowServing: formattedServing,
      waitingList,
      summary: {
        waitingCount: waitingTokens.length,
        servedTodayCount: completedTokens.length,
        avgServiceMinutes: avgMinutes,
      },
    });
  } catch (err) {
    console.error('Error in admin queue route:', err);
    return NextResponse.json({ error: 'Failed to fetch queue data.' }, { status: 500 });
  }
}
