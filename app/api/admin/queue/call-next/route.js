// ============================================================================
// app/api/admin/queue/call-next/route.js
// Staff action: Calls the next waiting student to the counter.
// Requires that any currently serving token is completed or skipped first.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayISTDateString } from '@/lib/time';
import { getNextToken, formatToken } from '@/lib/queueEngine';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const { service_id } = await request.json();
    if (!service_id) {
      return NextResponse.json({ error: 'Service ID is required.' }, { status: 400 });
    }

    const todayStr = getTodayISTDateString();

    // 1. Check if there is already an active serving token for this office
    const { data: currentServing } = await supabase
      .from('tokens')
      .select('id, token_no')
      .eq('service_id', service_id)
      .eq('token_date', todayStr)
      .eq('status', 'serving')
      .maybeSingle();

    if (currentServing) {
      return NextResponse.json(
        {
          error:
            'A student is already being served. Please Complete or Skip the current token before calling the next.',
        },
        { status: 400 }
      );
    }

    // 2. Fetch all waiting tokens for this office today
    const { data: waitingTokens, error: waitErr } = await supabase
      .from('tokens')
      .select('*, service:services(prefix, name)')
      .eq('service_id', service_id)
      .eq('token_date', todayStr)
      .eq('status', 'waiting');

    if (waitErr) throw waitErr;

    const nextToken = getNextToken(waitingTokens || []);
    if (!nextToken) {
      return NextResponse.json(
        { error: 'No students waiting in the queue for this service.' },
        { status: 404 }
      );
    }

    // 3. Mark token as serving
    const nowIso = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from('tokens')
      .update({
        status: 'serving',
        called_at: nowIso,
        served_by: user.id,
      })
      .eq('id', nextToken.id)
      .select('*, student:users(name, email)')
      .single();

    if (updErr) throw updErr;

    return NextResponse.json({
      success: true,
      token: {
        ...updated,
        token_code: formatToken(nextToken.service?.prefix, updated.token_no),
        student_name: updated.student?.name || 'Student',
      },
    });
  } catch (err) {
    console.error('Error in call-next route:', err);
    return NextResponse.json({ error: 'Failed to call next token.' }, { status: 500 });
  }
}
