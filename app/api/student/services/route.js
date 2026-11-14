// ============================================================================
// app/api/student/services/route.js
// Fetches office services with live queue status and eligibility for student.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayISTDateString, getNowIST } from '@/lib/time';
import {
  formatToken,
  canTakeToken,
  averageServiceMinutes,
  estimateWaitMinutes,
} from '@/lib/queueEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = getTodayISTDateString();
    const nowIST = getNowIST();

    // 1. Fetch all services
    const { data: services, error: servErr } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (servErr) throw servErr;

    // 2. Fetch all tokens for today
    const { data: todaysTokens, error: tokErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_date', todayStr);

    if (tokErr) throw tokErr;

    // 3. Assemble live queue stats for each service
    const results = services.map((service) => {
      const sTokens = todaysTokens.filter((t) => t.service_id === service.id);
      const serving = sTokens.find((t) => t.status === 'serving');
      const waiting = sTokens.filter((t) => t.status === 'waiting');
      const completed = sTokens.filter((t) => t.status === 'completed');

      const avgMinutes = averageServiceMinutes(completed, service.avg_minutes_default);
      // Wait for a student joining now: position would be waiting.length + 1
      const estWait = estimateWaitMinutes(waiting.length + 1, avgMinutes);

      const eligibility = canTakeToken(service, user, sTokens, nowIST);

      const studentActiveToken = sTokens.find(
        (t) =>
          t.student_id === user.id &&
          (t.status === 'waiting' || t.status === 'serving')
      );

      return {
        id: service.id,
        name: service.name,
        prefix: service.prefix,
        open_time: service.open_time,
        close_time: service.close_time,
        is_open: service.is_open,
        max_tokens_per_day: service.max_tokens_per_day,
        avg_minutes_default: service.avg_minutes_default,
        servingTokenCode: serving ? formatToken(service.prefix, serving.token_no) : null,
        waitingCount: waiting.length,
        estimatedWaitMinutes: estWait,
        avgServiceMinutes: avgMinutes,
        canTake: eligibility,
        activeToken: studentActiveToken
          ? {
              id: studentActiveToken.id,
              token_code: formatToken(service.prefix, studentActiveToken.token_no),
              status: studentActiveToken.status,
            }
          : null,
      };
    });

    return NextResponse.json({ services: results, today: todayStr });
  } catch (err) {
    console.error('Error fetching student services:', err);
    return NextResponse.json({ error: 'Failed to fetch services.' }, { status: 500 });
  }
}
