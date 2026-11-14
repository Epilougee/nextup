// ============================================================================
// app/api/student/tokens/route.js
// Issues a new digital queue token for a student with race-condition retries.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayISTDateString, getNowIST } from '@/lib/time';
import {
  formatToken,
  nextTokenNumber,
  canTakeToken,
  getPosition,
  averageServiceMinutes,
  estimateWaitMinutes,
} from '@/lib/queueEngine';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized. Students only.' }, { status: 401 });
    }

    const { service_id, purpose } = await request.json();

    if (!service_id) {
      return NextResponse.json({ error: 'Service ID is required.' }, { status: 400 });
    }

    const todayStr = getTodayISTDateString();
    const nowIST = getNowIST();

    // 1. Fetch targeted service
    const { data: service, error: servErr } = await supabase
      .from('services')
      .select('*')
      .eq('id', service_id)
      .single();

    if (servErr || !service) {
      return NextResponse.json({ error: 'Selected service office not found.' }, { status: 404 });
    }

    // 2. Fetch today's tokens for this service to check eligibility
    const { data: todaysTokens, error: tokErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('service_id', service_id)
      .eq('token_date', todayStr);

    if (tokErr) throw tokErr;

    // 3. Rule-based eligibility validation
    const eligibility = canTakeToken(service, user, todaysTokens, nowIST);
    if (!eligibility.ok) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    // 4. Retry loop (up to 3 attempts) to resolve potential concurrent token insertion collisions
    let attempts = 0;
    const maxAttempts = 3;
    let insertedToken = null;

    while (attempts < maxAttempts) {
      attempts++;

      // Refresh today's tokens for accurate sequence number
      const { data: currentTokens } = await supabase
        .from('tokens')
        .select('token_no')
        .eq('service_id', service_id)
        .eq('token_date', todayStr);

      const nextNo = nextTokenNumber(currentTokens || []);

      const { data: newTok, error: insErr } = await supabase
        .from('tokens')
        .insert({
          service_id,
          student_id: user.id,
          token_date: todayStr,
          token_no: nextNo,
          purpose: purpose ? purpose.trim() : null,
          status: 'waiting',
        })
        .select()
        .single();

      if (!insErr && newTok) {
        insertedToken = newTok;
        break; // Successfully inserted
      }

      // Check if collision on unique constraint (service_id, token_date, token_no)
      if (insErr && insErr.code === '23505') {
        console.warn(`Token number conflict detected for token_no ${nextNo}, retrying attempt ${attempts}...`);
        continue;
      } else if (insErr) {
        throw insErr;
      }
    }

    if (!insertedToken) {
      return NextResponse.json(
        { error: 'High queue demand. Please try taking your token again.' },
        { status: 409 }
      );
    }

    // Compute live initial queue position & estimated wait
    const { data: waitingTokens } = await supabase
      .from('tokens')
      .select('*')
      .eq('service_id', service_id)
      .eq('token_date', todayStr)
      .eq('status', 'waiting');

    const position = getPosition(insertedToken, waitingTokens || []);
    const avgMinutes = service.avg_minutes_default || 8;
    const waitMinutes = estimateWaitMinutes(position, avgMinutes);

    return NextResponse.json({
      success: true,
      token: {
        ...insertedToken,
        token_code: formatToken(service.prefix, insertedToken.token_no),
        service_name: service.name,
        service_prefix: service.prefix,
        position,
        estimated_wait_minutes: waitMinutes,
      },
    });
  } catch (err) {
    console.error('Error generating token:', err);
    return NextResponse.json({ error: 'Failed to generate token.' }, { status: 500 });
  }
}
