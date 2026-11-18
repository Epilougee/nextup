// ============================================================================
// app/api/admin/users/route.js
// Lists all users and allows administrators to create new Faculty and Students.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users: users || [] });
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const body = await request.json();
    let { name, email, password, role } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    email = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Normalize role: faculty / staff -> admin
    const normalizedRole = (role === 'faculty' || role === 'staff' || role === 'admin')
      ? 'admin'
      : (role === 'student' ? 'student' : null);

    if (!normalizedRole) {
      return NextResponse.json(
        { error: 'Invalid role selected. Must be Faculty/Staff or Student.' },
        { status: 400 }
      );
    }

    name = String(name || '').trim();
    if (!name) {
      name = normalizedRole === 'admin' ? 'Faculty Member' : 'Student';
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: `A user with email "${email}" already exists.` },
        { status: 400 }
      );
    }

    // Hash the password securely with bcrypt
    const passwordHash = await hashPassword(password);

    // Insert new user
    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role: normalizedRole,
      })
      .select('id, name, email, role, created_at')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: `User with email "${email}" already exists.` },
          { status: 400 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `${normalizedRole === 'admin' ? 'Faculty/Staff' : 'Student'} account created successfully.`,
      user: createdUser,
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create user account.' },
      { status: 500 }
    );
  }
}
