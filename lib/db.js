// ============================================================================
// lib/db.js
// Supabase Database Client for Server-Side Use Only.
// Connects to PostgreSQL using the Service Role Key when configured in .env.local / Vercel.
// Falls back to an in-memory mock database when credentials are not yet supplied,
// ensuring immediate, zero-setup testing of demo accounts and queue operations.
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockDb';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const isConfigured =
  supabaseUrl &&
  !supabaseUrl.includes('placeholder') &&
  supabaseServiceKey &&
  !supabaseServiceKey.includes('placeholder');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : mockSupabase;

if (!isConfigured) {
  console.info(
    '[NextUp] Notice: Running with pre-seeded in-memory database store. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local or Vercel for production Supabase.'
  );
}
