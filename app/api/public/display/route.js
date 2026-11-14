// ============================================================================
// app/api/public/display/route.js
// Public TV Display Board data feed (No login required).
// Feeds currently serving tokens and upcoming waiting tokens for all open offices.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getTodayISTDateString, formatISTTime, formatISTDateTime, getNowIST } from '@/lib/time';
import { formatToken } from '@/lib/queueEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const todayStr = getTodayISTDateString();
    const nowIST = getNowIST();

    // 1. Fetch all open services
    const { data: services, error: servErr } = await supabase
      .from('services')
      .select('id, name, prefix, open_time, close_time')
      .eq('is_open', true)
      .order('name', { ascending: true });

    if (servErr) throw servErr;

    // 2. Fetch active tokens for today
    const { data: tokens, error: tokErr } = await supabase
      .from('tokens')
      .select('id, service_id, token_no, status, created_at, called_at')
      .eq('token_date', todayStr)
      .in('status', ['serving', 'waiting'])
      .order('created_at', { ascending: true });

    if (tokErr) throw tokErr;

    const allTokens = tokens || [];

    const displayTiles = (services || []).map((service) => {
      const sTokens = allTokens.filter((t) => t.service_id === service.id);
      const serving = sTokens.find((t) => t.status === 'serving');
      const waiting = sTokens.filter((t) => t.status === 'waiting');

      const nextWaitingTokens = waiting.slice(0, 2).map((t) =>
        formatToken(service.prefix, t.token_no)
      );

      return {
        id: service.id,
        name: service.name,
        prefix: service.prefix,
        nowServing: serving ? formatToken(service.prefix, serving.token_no) : '---',
        isServing: Boolean(serving),
        nextWaiting: nextWaitingTokens,
        waitingTotal: waiting.length,
      };
    });

    return NextResponse.json({
      tiles: displayTiles,
      currentTime: formatISTTime(nowIST),
      currentDateTime: formatISTDateTime(nowIST),
    });
  } catch (err) {
    console.error('Error fetching display data:', err);
    return NextResponse.json({ error: 'Failed to fetch display data.' }, { status: 500 });
  }
}
