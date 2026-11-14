// ============================================================================
// app/api/student/catalog/route.js
// Provides the full catalog of campus departments, document services,
// and delivery classification (Instant Digital Issuance vs In-Person Token).
// ============================================================================

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { DEPARTMENT_CATALOG } from '@/lib/departmentCatalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ catalog: DEPARTMENT_CATALOG });
  } catch (err) {
    console.error('Error fetching catalog:', err);
    return NextResponse.json({ error: 'Failed to fetch catalog.' }, { status: 500 });
  }
}
