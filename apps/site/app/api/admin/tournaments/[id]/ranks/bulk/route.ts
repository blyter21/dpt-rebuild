import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

type RankCorrection = {
  entry_id: number;
  rank: number;
  total_buy_in_amount: number;
  bounty: number;
};

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isCorrection(value: unknown): value is RankCorrection {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const correction = value as Record<string, unknown>;
  const entryId = correction.entry_id;
  const rank = correction.rank;
  return Object.keys(correction).length === 4
    && isNonNegativeSafeInteger(entryId) && entryId > 0
    && isNonNegativeSafeInteger(rank) && rank > 0
    && isNonNegativeSafeInteger(correction.total_buy_in_amount)
    && isNonNegativeSafeInteger(correction.bounty);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tournamentId = Number(params.id);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  }

  let body: { corrections?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!Array.isArray(body.corrections) || body.corrections.length === 0 || !body.corrections.every(isCorrection)) {
    return NextResponse.json({ error: 'Corrections must be a non-empty array of entry_id, rank, total_buy_in_amount, and bounty integers' }, { status: 400 });
  }
  if (new Set(body.corrections.map((correction) => correction.entry_id)).size !== body.corrections.length) {
    return NextResponse.json({ error: 'Each entry may appear only once' }, { status: 400 });
  }

  const corrections = body.corrections.map(({ entry_id, rank, total_buy_in_amount, bounty }) => ({ entry_id, rank, total_buy_in_amount, bounty }));
  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_bulk_correct_ranks', {
    method: 'POST',
    body: JSON.stringify({ p_tournament_id: tournamentId, p_corrections: corrections }),
  });
  if (!response.ok) {
    return NextResponse.json({ error: 'Unable to save bulk rank corrections', detail: await response.text() }, { status: response.status });
  }
  return NextResponse.json({ result: await response.json() });
}
