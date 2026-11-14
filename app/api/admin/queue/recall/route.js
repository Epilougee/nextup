// ============================================================================
// app/api/admin/queue/recall/route.js
// Staff action: Re-announces/recalls the student, resetting called_at timestamp.
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
        called_at: nowIso,
      })
      .eq('id', token_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Token recalled. Counter audio and display refreshed.',
      token: updated,
    });
  } catch (err) {
    console.error('Error recalling token:', err);
    return NextResponse.json({ error: 'Failed to recall token.' }, { status: 500 });
  }
}
