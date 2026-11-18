// ============================================================================
// app/api/admin/users/[id]/route.js
// Handles user deletion by administrators.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const targetId = params?.id;
    if (!targetId) {
      return NextResponse.json({ error: 'Target user ID is required.' }, { status: 400 });
    }

    // Prevent deleting your own logged-in account
    if (currentUser.id === targetId) {
      return NextResponse.json(
        { error: 'You cannot delete your own logged-in account.' },
        { status: 400 }
      );
    }

    // Clean up dependent records for in-memory or uncascaded stores
    await supabase.from('tokens').delete().eq('student_id', targetId);
    await supabase.from('digital_documents').delete().eq('student_id', targetId);

    const { error } = await supabase.from('users').delete().eq('id', targetId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete user.' },
      { status: 500 }
    );
  }
}
