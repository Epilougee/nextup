// ============================================================================
// app/api/auth/login/route.js
// Handles user authentication, credential validation, and session issuance.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { verifyPassword, signSessionToken, sessionCookieOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Lookup user by email in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, role')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Verify bcrypt password hash
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Sign session JWT
    const token = await signSessionToken(user);

    // Determine role redirect
    const redirectUrl = user.role === 'admin' ? '/admin/queue' : '/';

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectUrl,
    });

    // Set signed HTTP-only cookie
    response.cookies.set(sessionCookieOptions.name, token, sessionCookieOptions);

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
