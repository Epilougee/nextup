// ============================================================================
// app/api/admin/services/route.js
// Lists all office services and creates a new service.
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayISTDateString } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const { data: services, error: servErr } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (servErr) throw servErr;

    const todayStr = getTodayISTDateString();
    const { data: todaysTokens, error: tokErr } = await supabase
      .from('tokens')
      .select('service_id, status')
      .eq('token_date', todayStr);

    if (tokErr) throw tokErr;

    // Attach today's token statistics to each service
    const enriched = (services || []).map((s) => {
      const tokens = (todaysTokens || []).filter((t) => t.service_id === s.id);
      return {
        ...s,
        today_total: tokens.length,
        today_waiting: tokens.filter((t) => t.status === 'waiting').length,
        today_completed: tokens.filter((t) => t.status === 'completed').length,
      };
    });

    return NextResponse.json({ services: enriched });
  } catch (err) {
    console.error('Error fetching admin services:', err);
    return NextResponse.json({ error: 'Failed to fetch services.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      prefix,
      avg_minutes_default = 8,
      open_time = '10:00:00',
      close_time = '16:00:00',
      is_open = true,
      max_tokens_per_day = 100,
    } = body;

    if (!name || !prefix) {
      return NextResponse.json(
        { error: 'Service name and prefix (e.g. ACC) are required.' },
        { status: 400 }
      );
    }

    const { data: created, error } = await supabase
      .from('services')
      .insert({
        name: name.trim(),
        prefix: prefix.trim().toUpperCase(),
        avg_minutes_default: Number(avg_minutes_default) || 8,
        open_time: open_time.length === 5 ? `${open_time}:00` : open_time,
        close_time: close_time.length === 5 ? `${close_time}:00` : close_time,
        is_open: Boolean(is_open),
        max_tokens_per_day: Number(max_tokens_per_day) || 100,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `Prefix "${prefix.toUpperCase()}" is already in use by another service.` },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, service: created });
  } catch (err) {
    console.error('Error creating service:', err);
    return NextResponse.json({ error: 'Failed to create service.' }, { status: 500 });
  }
}
