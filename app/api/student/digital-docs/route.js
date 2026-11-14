// ============================================================================
// app/api/student/digital-docs/route.js
// Handles digital document generation, instant electronic issuance,
// and retrieval of student digital documents.
// No office visit needed for digital documents!
// ============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { DEPARTMENT_CATALOG } from '@/lib/departmentCatalog';
import { getTodayISTDateString, formatISTDateTime } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized. Students only.' }, { status: 401 });
    }

    const { data: docs, error } = await supabase
      .from('digital_documents')
      .select('*, service:services(name, prefix)')
      .eq('student_id', user.id)
      .order('issued_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documents: docs || [] });
  } catch (err) {
    console.error('Error fetching digital documents:', err);
    return NextResponse.json({ error: 'Failed to fetch digital documents.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized. Students only.' }, { status: 401 });
    }

    const body = await request.json();
    const { doc_type, service_prefix, purpose, custom_fields = {} } = body;

    if (!doc_type || !service_prefix) {
      return NextResponse.json(
        { error: 'Document type and department prefix are required.' },
        { status: 400 }
      );
    }

    // Lookup service from database
    const { data: service, error: servErr } = await supabase
      .from('services')
      .select('*')
      .eq('prefix', service_prefix.toUpperCase())
      .single();

    if (servErr || !service) {
      return NextResponse.json({ error: 'Department service not found.' }, { status: 404 });
    }

    // Lookup catalog template definition
    const dept = DEPARTMENT_CATALOG.find((d) => d.prefix === service.prefix);
    const itemDef = dept?.items.find((i) => i.id === doc_type);

    if (!itemDef) {
      return NextResponse.json({ error: 'Document template not found.' }, { status: 404 });
    }

    if (itemDef.type !== 'digital') {
      return NextResponse.json(
        { error: 'This service requires an in-person physical desk visit and a counter token.' },
        { status: 400 }
      );
    }

    // Generate verified institutional reference code
    const now = new Date();
    const year = now.getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const refNo = `NITM-${service.prefix}-${itemDef.samplePrefix || 'DOC'}-${year}-${randomSuffix}`;

    const metadata = {
      student_name: user.name,
      student_email: user.email,
      roll_no: custom_fields.roll_no || 'NITM-2023-CS-042',
      branch: custom_fields.branch || 'B.Tech Computer Science & Engineering',
      semester: custom_fields.semester || 'Semester V',
      academic_year: '2026-2027',
      verification_code: `VRF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      issued_date: formatISTDateTime(now),
      ...custom_fields,
    };

    const { data: newDoc, error: insErr } = await supabase
      .from('digital_documents')
      .insert({
        student_id: user.id,
        service_id: service.id,
        doc_type,
        doc_title: itemDef.title,
        reference_no: refNo,
        purpose: purpose ? purpose.trim() : 'Official Institutional Academic Use',
        metadata,
        status: 'issued',
        issued_at: now.toISOString(),
      })
      .select('*, service:services(name, prefix)')
      .single();

    if (insErr) throw insErr;

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: 'Document generated and digitally verified. You do not need to visit the office.',
    });
  } catch (err) {
    console.error('Error generating digital document:', err);
    return NextResponse.json({ error: 'Failed to issue digital document.' }, { status: 500 });
  }
}
