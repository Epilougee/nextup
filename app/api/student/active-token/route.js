// ============================================================================
// app/api/student/active-token/route.js
// Returns the student's current active token (waiting or serving) for today.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayISTDateString } from '@/lib/time';
import {
  formatToken,
  getPosition,
  averageServiceMinutes,
  estimateWaitMinutes,
  getAlertLevel,
} from '@/lib/queueEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = getTodayISTDateString();

    // Look for currently active token (serving first, then waiting)
    const { data: tokens, error: tokErr } = await supabase
      .from('tokens')
      .select('*, service:services(*)')
      .eq('student_id', user.id)
      .eq('token_date', todayStr)
      .in('status', ['serving', 'waiting'])
      .order('created_at', { ascending: false });

    if (tokErr) throw tokErr;

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ activeToken: null });
    }

    // Prioritize serving token over waiting token
    const activeToken = tokens.find((t) => t.status === 'serving') || tokens[0];
    const service = activeToken.service;

    // Fetch all tokens for this service today to compute position and average duration
    const { data: serviceTokens } = await supabase
      .from('tokens')
      .select('*')
      .eq('service_id', service.id)
      .eq('token_date', todayStr);

    const waitingTokens = (serviceTokens || []).filter((t) => t.status === 'waiting');
    const completedTokens = (serviceTokens || []).filter((t) => t.status === 'completed');

    const position = activeToken.status === 'serving' ? 0 : getPosition(activeToken, waitingTokens);
    const peopleAhead = Math.max(0, position - 1);
    const avgMinutes = averageServiceMinutes(completedTokens, service.avg_minutes_default);
    const estimatedWaitMinutes = activeToken.status === 'serving' ? 0 : estimateWaitMinutes(position, avgMinutes);
    const alertLevel = getAlertLevel(position, activeToken.status);

    return NextResponse.json({
      activeToken: {
        ...activeToken,
        token_code: formatToken(service.prefix, activeToken.token_no),
        position,
        peopleAhead,
        estimatedWaitMinutes,
        alertLevel,
      },
    });
  } catch (err) {
    console.error('Error fetching student active token:', err);
    return NextResponse.json({ error: 'Failed to fetch active token.' }, { status: 500 });
  }
}
