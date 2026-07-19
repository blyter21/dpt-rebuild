import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';
type Resource = 'blinds' | 'payouts';
const valid = (value: string): value is Resource => value === 'blinds' || value === 'payouts';
const positiveId = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, allowed: string[]) => Object.keys(value).every((key) => allowed.includes(key));

export async function GET(_request: NextRequest, { params }: { params: { resource: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!valid(params.resource)) return NextResponse.json({ error: 'Unknown structure resource' }, { status: 404 });
  if (params.resource === 'blinds') {
    const response = await dptAdminSupabaseFetch(context, '/rest/v1/blind_structures?select=id,name,description,blind_info,blind_intervals,is_copy,status,created_at&deleted_at=is.null&order=id.desc');
    if (!response.ok) return NextResponse.json({ error: 'Structure list unavailable' }, { status: 502 });
    return NextResponse.json({ records: await response.json() });
  }
  const [templatesResponse, tournamentsResponse, typesResponse] = await Promise.all([
    dptAdminSupabaseFetch(context, '/rest/v1/payout_templates?select=id,name,type,tournament_type_id,created_at,payout_template_rows(id,player_count_start,player_count_end,winners_count,standing,payout_percentage,payout_amount,points,prize_description)&deleted_at=is.null&order=id.asc'),
    dptAdminSupabaseFetch(context, '/rest/v1/tournaments?select=payout_template_id&deleted_at=is.null&payout_template_id=not.is.null'),
    dptAdminSupabaseFetch(context, '/rest/v1/tournament_types?select=id,name,code&order=id.asc'),
  ]);
  if (!templatesResponse.ok || !tournamentsResponse.ok || !typesResponse.ok) return NextResponse.json({ error: 'Payout structure list unavailable' }, { status: 502 });
  const templates = await templatesResponse.json() as Array<Record<string, unknown>>;
  const tournaments = await tournamentsResponse.json() as Array<{ payout_template_id: number }>;
  const counts = tournaments.reduce<Record<number, number>>((result, tournament) => { result[tournament.payout_template_id] = (result[tournament.payout_template_id] || 0) + 1; return result; }, {});
  return NextResponse.json({ records: templates.map((template) => ({ ...template, assigned_tournaments: counts[Number(template.id)] || 0 })), tournamentTypes: await typesResponse.json() });
}

export async function POST(request: NextRequest, { params }: { params: { resource: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!valid(params.resource)) return NextResponse.json({ error: 'Unknown structure resource' }, { status: 404 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!isObject(body) || typeof body.action !== 'string') return NextResponse.json({ error: 'Invalid structure payload' }, { status: 400 });
  const id = body.id;
  if (id !== undefined && id !== null && !positiveId(id)) return NextResponse.json({ error: 'Invalid structure ID' }, { status: 400 });
  let rpc: string;
  let payload: Record<string, unknown>;

  if (body.action === 'save') {
    if (!exactKeys(body, ['action','id','values']) || !isObject(body.values)) return NextResponse.json({ error: 'Invalid structure save payload' }, { status: 400 });
    const values = body.values;
    if (typeof values.name !== 'string' || !values.name.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (params.resource === 'blinds') {
      if (!exactKeys(values, ['name','description','status','blind_intervals','blind_info']) || typeof values.status !== 'boolean' || !(values.blind_intervals === null || Number.isInteger(values.blind_intervals)) || !Array.isArray(values.blind_info) || values.blind_info.length === 0) return NextResponse.json({ error: 'Invalid blind structure values' }, { status: 400 });
      for (const row of values.blind_info) {
        if (!isObject(row)) return NextResponse.json({ error: 'Invalid blind row' }, { status: 400 });
        const isBreak = 'addbreak' in row;
        if (!exactKeys(row, isBreak ? ['addbreak','blind_interval'] : ['small_blind','big_blind','bbante']) || Object.values(row).some((value) => typeof value !== 'string')) return NextResponse.json({ error: 'Invalid blind row fields' }, { status: 400 });
      }
      rpc = 'dpt_admin_save_blind_structure';
    } else {
      if (!exactKeys(values, ['name','type','tournament_type_id','rows']) || typeof values.type !== 'string' || !['range','satellite','formula'].includes(values.type) || !Array.isArray(values.rows) || values.rows.length === 0) return NextResponse.json({ error: 'Invalid payout template values' }, { status: 400 });
      const rowKeys = ['id','player_count_start','player_count_end','winners_count','standing','payout_percentage','payout_amount','points','prize_description'];
      for (const row of values.rows) if (!isObject(row) || !exactKeys(row,rowKeys)) return NextResponse.json({ error: 'Invalid payout row fields' }, { status: 400 });
      rpc = 'dpt_admin_save_payout_template';
    }
    payload = { p_id: id ?? null, p_values: values };
  } else if (body.action === 'status' && params.resource === 'blinds') {
    if (!exactKeys(body,['action','id','status']) || !positiveId(id) || typeof body.status !== 'boolean') return NextResponse.json({ error: 'Invalid structure status payload' }, { status: 400 });
    rpc = 'dpt_admin_status_blind_structure'; payload = { p_id: id, p_status: body.status };
  } else if (body.action === 'copy' || body.action === 'delete') {
    if (!exactKeys(body,['action','id']) || !positiveId(id)) return NextResponse.json({ error: 'A structure ID is required' }, { status: 400 });
    rpc = params.resource === 'blinds'
      ? (body.action === 'copy' ? 'dpt_admin_copy_blind_structure' : 'dpt_admin_delete_blind_structure')
      : (body.action === 'copy' ? 'dpt_admin_copy_payout_template' : 'dpt_admin_delete_payout_template');
    payload = { p_id: id };
  } else {
    return NextResponse.json({ error: 'Invalid structure action' }, { status: 400 });
  }
  const response = await dptAdminSupabaseFetch(context, `/rest/v1/rpc/${rpc}`, { method:'POST', body:JSON.stringify(payload) });
  if (!response.ok) return NextResponse.json({ error:'Structure change was rejected', detail:await response.text() }, { status:response.status===401?401:409 });
  return NextResponse.json({ record:await response.json() }, { status:body.action==='save'&&!id?201:200 });
}
