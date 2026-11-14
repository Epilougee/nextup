// ============================================================================
// app/api/student/cancel/route.js
// Allows a student to cancel their token while it is still waiting in line.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token_id } = await request.json();
    if (!token_id) {
      return NextResponse.json({ error: 'Token ID is required.' }, { status: 400 });
    }

    // Retrieve target token
    const { data: token, error: findErr } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', token_id)
      .eq('student_id', user.id)
      .single();

    if (findErr || !token) {
      return NextResponse.json({ error: 'Token not found or not owned by you.' }, { status: 404 });
    }

    // Only waiting tokens can be cancelled
    if (token.status !== 'waiting') {
      return NextResponse.json(
        { error: `Cannot cancel this token because it is already ${token.status}.` },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabase
      .from('tokens')
      .update({ status: 'cancelled' })
      .eq('id', token_id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, message: 'Token cancelled successfully.' });
  } catch (err) {
    console.error('Error cancelling token:', err);
    return NextResponse.json({ error: 'Failed to cancel token.' }, { status: 500 });
  }
}
