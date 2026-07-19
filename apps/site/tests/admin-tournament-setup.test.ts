import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(()=>({getContext:vi.fn(),adminFetch:vi.fn()}));
vi.mock('../lib/dpt-admin-api',()=>({getDptAdminApiContext:getContext,dptAdminSupabaseFetch:adminFetch}));
import { GET, POST } from '../app/api/admin/tournaments/route';
const json=(body:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json',...headers}});
const post=(body:unknown)=>POST(new NextRequest('http://x/api/admin/tournaments',{method:'POST',body:JSON.stringify(body)}));
const optionResponse=(url:string)=>url.startsWith('/rest/v1/events?')||url.startsWith('/rest/v1/tournament_types?')||url.startsWith('/rest/v1/venues?')||url.startsWith('/rest/v1/blind_structures?')||url.startsWith('/rest/v1/payout_templates?');

describe('tournament setup administration',()=>{
 beforeEach(()=>{vi.clearAllMocks();getContext.mockResolvedValue({accessToken:'token'});});
 it('fails closed before reads or mutations',async()=>{getContext.mockResolvedValue(null);expect((await GET(new NextRequest('http://x/api/admin/tournaments'))).status).toBe(401);expect((await post({action:'copy',id:1})).status).toBe(401);expect(adminFetch).not.toHaveBeenCalled();});
 it('keeps year/event/type/status/scope/search filters independent',async()=>{
  adminFetch.mockImplementation(async(_context:unknown,url:string)=>optionResponse(url)?json([]):json([{id:9,name:'Filtered'}],200,{'content-range':'0-0/1'}));
  const request=new NextRequest('http://x/api/admin/tournaments?year=2027&event=82&type=1&status=published&scope=featured&search=Main&page=2&size=10&sort=starts_at&dir=asc');
  const result=await GET(request);expect(result.status).toBe(200);const listUrl=adminFetch.mock.calls.find((call)=>String(call[1]).startsWith('/rest/v1/tournaments?'))?.[1] as string;
  expect(listUrl).toContain('starts_at=gte.2027-01-01');expect(listUrl).toContain('event_id=eq.82');expect(listUrl).toContain('tournament_type_id=eq.1');expect(listUrl).toContain('status=eq.true');expect(listUrl).toContain('featured=eq.true');expect(listUrl).toContain('name=ilike.*Main*');expect(listUrl).toContain('offset=10');expect(decodeURIComponent(listUrl)).toContain('tournament_types!tournaments_tournament_type_id_fkey');
 });
 it('loads a complete tournament record for editing',async()=>{
  adminFetch.mockImplementation(async(_context:unknown,url:string)=>optionResponse(url)?json([]):json([{id:346,name:'Main',minimum_buyin:250,allow_rebuy:true}]));
  const result=await GET(new NextRequest('http://x/api/admin/tournaments?id=346'));const body=await result.json();expect(result.status).toBe(200);expect(body.record.minimum_buyin).toBe(250);expect(String(adminFetch.mock.calls.at(-1)?.[1])).toContain('select=*');
 });
 it('accepts a strict create payload without requiring an id',async()=>{
  adminFetch.mockResolvedValue(json({id:400}));
  const values={name:'QA Setup',tournament_type_id:1,status:false,featured:false,multi_day:false,allow_rebuy:false,allow_rebuy_chips:false,title_count:false,points_multiplier_enabled:false,allow_search_registration:true,qualifier_tournament:false,advancing_to_flight_tournaments:false};
  const result=await post({action:'save',values});expect(result.status).toBe(201);expect(adminFetch).toHaveBeenCalledWith(expect.anything(),'/rest/v1/rpc/dpt_admin_save_tournament',expect.objectContaining({body:JSON.stringify({p_id:null,p_values:values})}));
 });
 it('rejects unknown setup fields and malformed action payloads',async()=>{expect((await post({action:'save',values:{name:'X',tournament_type_id:1,injected:true}})).status).toBe(400);expect((await post({action:'status',id:1,status:false,extra:true})).status).toBe(400);expect(adminFetch).not.toHaveBeenCalled();});
 it('routes copy/status/delete to explicit guarded RPCs',async()=>{
  adminFetch.mockResolvedValueOnce(json({id:2})).mockResolvedValueOnce(json({id:1})).mockResolvedValueOnce(json({id:1}));
  expect((await post({action:'copy',id:1})).status).toBe(200);expect((await post({action:'status',id:1,status:false})).status).toBe(200);expect((await post({action:'delete',id:1})).status).toBe(200);
  expect(adminFetch.mock.calls.map((call)=>call[1])).toEqual(['/rest/v1/rpc/dpt_admin_copy_tournament','/rest/v1/rpc/dpt_admin_set_tournament_status','/rest/v1/rpc/dpt_admin_soft_delete_tournament']);
 });
 it('matches captured production list and setup labels',async()=>{
  const source=await readFile(new URL('../components/tournament-manager.tsx',import.meta.url),'utf8');
  for(const label of ['Tournaments List','Save as Copy','Manage Tournament','Year','Event','Type','Status','Scope','Start Date','End Date','Initial Buy In','Dealer Appreciation Fee','Charity Take','Initial Chips Count','Allowed Rebuys Limit','Points Multiplier','Rules Description']) expect(source).toContain(label);
 });
});
