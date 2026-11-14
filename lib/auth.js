// ============================================================================
// lib/auth.js
// Authentication & Session Management using bcryptjs and signed jose JWTs.
// Secure, server-only HTTP cookie sessions for Students and Admins.
// ============================================================================

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'queueless_session';
const DEFAULT_SECRET = 'queueless-college-queue-jwt-secret-key-32chars';
const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET || DEFAULT_SECRET);

/**
 * Hashes a plaintext password using bcrypt with a salt work factor of 10.
 */
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Validates a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(plainPassword, hash) {
  if (!plainPassword || !hash) return false;
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Generates a signed tamper-proof JWT token containing safe user details.
 */
export async function signSessionToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Decodes and verifies the signature of a session JWT token.
 * Returns the decoded payload or null if invalid or expired.
 */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Reads and verifies the current session from incoming HTTP cookies.
 * Server components and route handlers can call this directly.
 */
export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Cookie options for setting the signed session.
 */
export const sessionCookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
