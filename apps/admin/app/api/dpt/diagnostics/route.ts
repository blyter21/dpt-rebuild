import { NextResponse } from 'next/server';
import { getAdminDiagnostics } from '../../../../lib/admin-diagnostics';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getAdminDiagnostics());
}
