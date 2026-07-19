import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../lib/dpt-admin-api';

export const dynamic='force-dynamic';
type JsonRecord=Record<string,unknown>;
const object=(value:unknown):value is JsonRecord=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const positive=(value:unknown)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>0;
const exact=(value:JsonRecord, keys:string[])=>Object.keys(value).every((key)=>keys.includes(key));
const flightKeys=['id','name','starts_at','ends_at','registration_starts_at','registration_ends_at','minimum_buyin','tournament_fee_percent','initial_chips_count'];
function relationshipPayload(value:unknown): value is JsonRecord {
 if(!object(value)||!exact(value,['advancing_to_flight_tournaments','allow_search_registration','chip_carryover','flights','qualifiers','toc_all_types','toc_type_ids','toc_tournament_ids'])) return false;
 if(typeof value.advancing_to_flight_tournaments!=='boolean'||typeof value.allow_search_registration!=='boolean'||typeof value.toc_all_types!=='boolean'||!['','highest','sum'].includes(String(value.chip_carryover))||!Array.isArray(value.flights)||!Array.isArray(value.qualifiers)||!Array.isArray(value.toc_type_ids)||!Array.isArray(value.toc_tournament_ids)) return false;
 return value.flights.every((f)=>object(f)&&exact(f,flightKeys)&&(!('id'in f)||f.id===null||f.id===''||positive(f.id))&&typeof f.name==='string'&&typeof f.starts_at==='string'&&typeof f.ends_at==='string'&&typeof f.registration_starts_at==='string'&&typeof f.registration_ends_at==='string'&&Number.isFinite(Number(f.minimum_buyin))&&Number(f.minimum_buyin)>=0&&Number.isFinite(Number(f.initial_chips_count))&&Number(f.initial_chips_count)>=0&&Number.isFinite(Number(f.tournament_fee_percent))) && value.qualifiers.every((q)=>object(q)&&exact(q,['tournament_id','qualifier_prize'])&&positive(q.tournament_id)&&typeof q.qualifier_prize==='string') && value.toc_type_ids.every(positive)&&value.toc_tournament_ids.every(positive);
}
const idFrom=(request:NextRequest)=>{const value=Number(request.nextUrl.pathname.split('/').at(-2));return Number.isSafeInteger(value)&&value>0?value:null;};

export async function GET(request:NextRequest){
 const context=await getDptAdminApiContext(); if(!context)return NextResponse.json({error:'Unauthorized'},{status:401}); const id=idFrom(request); if(!id)return NextResponse.json({error:'Invalid tournament ID'},{status:400});
 const [main,flights,qualifiers,types,tournaments,tocTypes,tocTournaments]=await Promise.all([
  dptAdminSupabaseFetch(context,`/rest/v1/tournaments?select=*&id=eq.${id}&deleted_at=is.null&limit=1`),
  dptAdminSupabaseFetch(context,`/rest/v1/tournaments?select=id,name,starts_at,ends_at,registration_starts_at,registration_ends_at,minimum_buyin,tournament_fee_percent,initial_chips_count&main_tournament_id=eq.${id}&deleted_at=is.null&order=id.asc`),
  dptAdminSupabaseFetch(context,`/rest/v1/tournament_qualifiers?select=qualifier_tournament_id,qualifier_prize&tournament_id=eq.${id}`),
  dptAdminSupabaseFetch(context,'/rest/v1/tournament_types?select=id,name,code&order=name.asc'),
  dptAdminSupabaseFetch(context,`/rest/v1/tournaments?select=id,name,tournament_type_id&deleted_at=is.null&id=neq.${id}&order=name.asc`),
  dptAdminSupabaseFetch(context,`/rest/v1/toc_qualified_types?select=tournament_type_id&tournament_id=eq.${id}`),
  dptAdminSupabaseFetch(context,`/rest/v1/toc_qualified_tournaments?select=qualified_tournament_id&tournament_id=eq.${id}`),
 ]); if(![main,flights,qualifiers,types,tournaments,tocTypes,tocTournaments].every(r=>r.ok))return NextResponse.json({error:'Relationship data unavailable'},{status:502});
 const mainRows=await main.json() as JsonRecord[]; if(!mainRows[0])return NextResponse.json({error:'Tournament not found'},{status:404});
 const qs=await qualifiers.json() as {qualifier_tournament_id:number;qualifier_prize:string|null}[];
 return NextResponse.json({current:{advancing_to_flight_tournaments:Boolean(mainRows[0].advancing_to_flight_tournaments),allow_search_registration:Boolean(mainRows[0].allow_search_registration),chip_carryover:mainRows[0].chip_carryover||'',flights:await flights.json(),qualifiers:qs.map(q=>({tournament_id:q.qualifier_tournament_id,qualifier_prize:q.qualifier_prize||''})),toc_all_types:Boolean(mainRows[0].toc_all_types),toc_type_ids:(await tocTypes.json() as {tournament_type_id:number}[]).map(x=>x.tournament_type_id),toc_tournament_ids:(await tocTournaments.json() as {qualified_tournament_id:number}[]).map(x=>x.qualified_tournament_id)},options:{types:await types.json(),tournaments:await tournaments.json()}});
}
export async function POST(request:NextRequest){const context=await getDptAdminApiContext();if(!context)return NextResponse.json({error:'Unauthorized'},{status:401});const id=idFrom(request);if(!id)return NextResponse.json({error:'Invalid tournament ID'},{status:400});let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}if(!relationshipPayload(body))return NextResponse.json({error:'Invalid relationship payload'},{status:400});const response=await dptAdminSupabaseFetch(context,'/rest/v1/rpc/dpt_admin_save_tournament_relationships',{method:'POST',body:JSON.stringify({p_main_id:id,p_values:body})});if(!response.ok)return NextResponse.json({error:'Relationship change was rejected',detail:await response.text()},{status:409});return NextResponse.json({record:await response.json()});}
