// ============================================================================
// app/api/admin/queue/skip/route.js
// Staff action: Skips the currently called token as a No-Show.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const { token_id } = await request.json();
    if (!token_id) {
      return NextResponse.json({ error: 'Token ID is required.' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('tokens')
      .update({
        status: 'no_show',
      })
      .eq('id', token_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, token: updated });
  } catch (err) {
    console.error('Error skipping token:', err);
    return NextResponse.json({ error: 'Failed to skip token.' }, { status: 500 });
  }
}
