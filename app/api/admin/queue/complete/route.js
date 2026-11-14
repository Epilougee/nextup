// ============================================================================
// app/api/admin/queue/complete/route.js
// Staff action: Marks the active token as completed.
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

    const nowIso = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from('tokens')
      .update({
        status: 'completed',
        completed_at: nowIso,
      })
      .eq('id', token_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, token: updated });
  } catch (err) {
    console.error('Error completing token:', err);
    return NextResponse.json({ error: 'Failed to complete token.' }, { status: 500 });
  }
}
