// ============================================================================
// app/api/admin/services/[id]/route.js
// Handles updating service parameters (toggle open/close, hours, etc.) and deletion.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const allowedFields = [
      'name',
      'prefix',
      'avg_minutes_default',
      'open_time',
      'close_time',
      'is_open',
      'max_tokens_per_day',
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === 'open_time' || key === 'close_time') {
          updates[key] = body[key].length === 5 ? `${body[key]}:00` : body[key];
        } else if (key === 'prefix') {
          updates[key] = body[key].trim().toUpperCase();
        } else {
          updates[key] = body[key];
        }
      }
    }

    const { data: updated, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, service: updated });
  } catch (err) {
    console.error('Error updating service:', err);
    return NextResponse.json({ error: 'Failed to update service.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const { id } = params;

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Service deleted.' });
  } catch (err) {
    console.error('Error deleting service:', err);
    return NextResponse.json({ error: 'Failed to delete service.' }, { status: 500 });
  }
}
