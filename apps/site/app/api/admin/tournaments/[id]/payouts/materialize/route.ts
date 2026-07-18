import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tournamentId = Number(params.id);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  }

  let body: { payoutTemplateId?: unknown; totalDistributionAmount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const payoutTemplateId = Number(body.payoutTemplateId);
  const totalDistributionAmount = Number(body.totalDistributionAmount);
  if (!Number.isSafeInteger(payoutTemplateId) || payoutTemplateId <= 0) {
    return NextResponse.json({ error: 'Invalid payout template' }, { status: 400 });
  }
  if (!Number.isFinite(totalDistributionAmount) || totalDistributionAmount < 0) {
    return NextResponse.json({ error: 'Distribution amount must be non-negative' }, { status: 400 });
  }

  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_materialize_payouts', {
    method: 'POST',
    body: JSON.stringify({
      p_tournament_id: tournamentId,
      p_payout_template_id: payoutTemplateId,
      p_total_distribution_amount: totalDistributionAmount,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: 'Unable to materialize payouts', detail }, { status: response.status });
  }

  return NextResponse.json({ result: await response.json() });
}
