// ============================================================================
// app/api/student/history/route.js
// Retrieves historical tokens taken by the logged-in student.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { formatToken } from '@/lib/queueEngine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tokens, error } = await supabase
      .from('tokens')
      .select('*, service:services(name, prefix)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedHistory = (tokens || []).map((t) => {
      let waitMinutes = null;
      if (t.called_at && t.created_at) {
        const ms = new Date(t.called_at) - new Date(t.created_at);
        if (ms > 0) waitMinutes = Math.round(ms / (1000 * 60));
      }

      let serviceMinutes = null;
      if (t.completed_at && t.called_at) {
        const ms = new Date(t.completed_at) - new Date(t.called_at);
        if (ms > 0) serviceMinutes = Math.round(ms / (1000 * 60));
      }

      return {
        id: t.id,
        token_code: formatToken(t.service?.prefix, t.token_no),
        service_name: t.service?.name || 'Administrative Office',
        service_prefix: t.service?.prefix || 'TOK',
        date: t.token_date,
        status: t.status,
        purpose: t.purpose,
        wait_minutes: waitMinutes,
        service_minutes: serviceMinutes,
        created_at: t.created_at,
        called_at: t.called_at,
        completed_at: t.completed_at,
      };
    });

    return NextResponse.json({ history: formattedHistory });
  } catch (err) {
    console.error('Error fetching student history:', err);
    return NextResponse.json({ error: 'Failed to fetch token history.' }, { status: 500 });
  }
}
