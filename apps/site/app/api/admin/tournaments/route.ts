import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';
const fields = ['name','alias','event_id','venue_id','tournament_type_id','blind_structure_id','payout_template_id','point_distribution_id','short_description','long_description','rules_description','starts_at','ends_at','registration_starts_at','registration_ends_at','dealer_fee','tournament_fee_percent','minimum_buyin','maximum_buyin','allow_rebuy','allowed_rebuys_limit','rebuy_amount','rebuy_fee','allow_rebuy_chips','rebuy_chips_count','initial_chips_count','title_count','players_at_final_table','points_multiplier_enabled','points_multiplier_value','participation_bonus_points','chip_carryover','allow_search_registration','blind_intervals','status','featured','multi_day','logo_url','banner_url','live_stream_url','qualifier_tournament','advancing_to_flight_tournaments'];
const integerFields = new Set(['event_id','venue_id','tournament_type_id','blind_structure_id','payout_template_id','point_distribution_id','dealer_fee','minimum_buyin','maximum_buyin','allowed_rebuys_limit','rebuy_amount','rebuy_fee','rebuy_chips_count','initial_chips_count','players_at_final_table','participation_bonus_points','blind_intervals']);
const booleanFields = new Set(['allow_rebuy','allow_rebuy_chips','title_count','points_multiplier_enabled','allow_search_registration','status','featured','multi_day','qualifier_tournament','advancing_to_flight_tournaments']);
const positiveId = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value: Record<string,unknown>, allowed: string[]) => Object.keys(value).every((key)=>allowed.includes(key));

async function options(context: NonNullable<Awaited<ReturnType<typeof getDptAdminApiContext>>>) {
  const [events,types,venues,blinds,payouts] = await Promise.all([
    dptAdminSupabaseFetch(context,'/rest/v1/events?select=id,name&status=eq.true&deleted_at=is.null&order=name.asc'),
    dptAdminSupabaseFetch(context,'/rest/v1/tournament_types?select=id,name,code&order=name.asc'),
    dptAdminSupabaseFetch(context,'/rest/v1/venues?select=id,name&status=eq.true&deleted_at=is.null&order=name.asc'),
    dptAdminSupabaseFetch(context,'/rest/v1/blind_structures?select=id,name&status=eq.true&deleted_at=is.null&order=name.asc'),
    dptAdminSupabaseFetch(context,'/rest/v1/payout_templates?select=id,name,type&deleted_at=is.null&order=name.asc'),
  ]);
  if (![events,types,venues,blinds,payouts].every((response)=>response.ok)) return null;
  return {events:await events.json(),types:await types.json(),venues:await venues.json(),blinds:await blinds.json(),payouts:await payouts.json()};
}

export async function GET(request: NextRequest) {
  const context=await getDptAdminApiContext();
  if(!context) return NextResponse.json({error:'Unauthorized'},{status:401});
  const query=request.nextUrl.searchParams;
  const setupOptions=await options(context);
  if(!setupOptions) return NextResponse.json({error:'Tournament options unavailable'},{status:502});
  if(query.get('id')) {
    const tournamentId=Number(query.get('id'));
    if(!Number.isSafeInteger(tournamentId)||tournamentId<1) return NextResponse.json({error:'Invalid tournament ID'},{status:400});
    const detail=await dptAdminSupabaseFetch(context,`/rest/v1/tournaments?select=*&id=eq.${tournamentId}&deleted_at=is.null&limit=1`);
    if(!detail.ok) return NextResponse.json({error:'Tournament detail unavailable'},{status:502});
    const rows=await detail.json() as unknown[];
    if(!rows[0]) return NextResponse.json({error:'Tournament not found'},{status:404});
    return NextResponse.json({record:rows[0],options:setupOptions});
  }
  const sort=['id','name','starts_at','ends_at','status'].includes(query.get('sort')||'')?query.get('sort')!:'id';
  const direction=query.get('dir')==='asc'?'asc':'desc';
  const page=Math.max(1,Number(query.get('page')||1));
  const size=[10,25,50,100].includes(Number(query.get('size')))?Number(query.get('size')):10;
  const filters=['deleted_at=is.null',`order=${sort}.${direction}`,`limit=${size}`,`offset=${(page-1)*size}`];
  if(query.get('status')==='published') filters.push('status=eq.true');
  if(query.get('status')==='unpublished') filters.push('status=eq.false');
  if(query.get('type')&&Number.isSafeInteger(Number(query.get('type')))) filters.push(`tournament_type_id=eq.${Number(query.get('type'))}`);
  if(query.get('event')&&Number.isSafeInteger(Number(query.get('event')))) filters.push(`event_id=eq.${Number(query.get('event'))}`);
  if(/^\d{4}$/.test(query.get('year')||'')) { const year=Number(query.get('year')); filters.push(`starts_at=gte.${year}-01-01T00:00:00Z`,`starts_at=lt.${year+1}-01-01T00:00:00Z`); }
  if(query.get('scope')==='featured') filters.push('featured=eq.true');
  if(query.get('scope')==='standard') filters.push('featured=eq.false');
  if(query.get('search')) filters.push(`name=ilike.*${encodeURIComponent(query.get('search')!.trim())}*`);
  const select='id,name,alias,event_id,venue_id,tournament_type_id,starts_at,ends_at,status,featured,event:events(name),tournament_type:tournament_types(name,code)';
  const records=await dptAdminSupabaseFetch(context,`/rest/v1/tournaments?select=${encodeURIComponent(select)}&${filters.join('&')}`,{headers:{Prefer:'count=exact'}});
  if(!records.ok) return NextResponse.json({error:'Tournament list unavailable'},{status:502});
  return NextResponse.json({records:await records.json(),total:Number(records.headers.get('content-range')?.split('/')[1]||0),options:setupOptions});
}

export async function POST(request: NextRequest) {
  const context=await getDptAdminApiContext();
  if(!context) return NextResponse.json({error:'Unauthorized'},{status:401});
  let body:Record<string,unknown>;
  try{body=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}
  if(!object(body)||typeof body.action!=='string') return NextResponse.json({error:'Invalid tournament payload'},{status:400});
  let rpc:string;let payload:Record<string,unknown>;
  if(body.action==='save') {
    if(!exactKeys(body,['action','id','values'])||!object(body.values)||(body.id!==undefined&&body.id!==null&&!positiveId(body.id))||Object.keys(body.values).some((key)=>!fields.includes(key))) return NextResponse.json({error:'Invalid tournament save payload'},{status:400});
    const values=body.values;
    for(const [key,value] of Object.entries(values)) {
      if(integerFields.has(key)&&value!==''&&value!==null&&(!Number.isSafeInteger(Number(value))||Number(value)<0)) return NextResponse.json({error:`Invalid ${key}`},{status:400});
      if(booleanFields.has(key)&&typeof value!=='boolean') return NextResponse.json({error:`Invalid ${key}`},{status:400});
    }
    if(typeof values.name!=='string'||!values.name.trim()) return NextResponse.json({error:'Name is required'},{status:400});
    rpc='dpt_admin_save_tournament';payload={p_id:body.id??null,p_values:values};
  } else if(body.action==='copy'&&exactKeys(body,['action','id'])&&positiveId(body.id)) { rpc='dpt_admin_copy_tournament';payload={p_id:body.id};
  } else if(body.action==='status'&&exactKeys(body,['action','id','status'])&&positiveId(body.id)&&typeof body.status==='boolean') { rpc='dpt_admin_set_tournament_status';payload={p_id:body.id,p_status:body.status};
  } else if(body.action==='delete'&&exactKeys(body,['action','id'])&&positiveId(body.id)) { rpc='dpt_admin_soft_delete_tournament';payload={p_id:body.id};
  } else return NextResponse.json({error:'Invalid tournament action'},{status:400});
  const response=await dptAdminSupabaseFetch(context,`/rest/v1/rpc/${rpc}`,{method:'POST',body:JSON.stringify(payload)});
  if(!response.ok) return NextResponse.json({error:'Tournament change was rejected',detail:await response.text()},{status:response.status===401?401:409});
  return NextResponse.json({record:await response.json()},{status:body.action==='save'&&!body.id?201:200});
}
