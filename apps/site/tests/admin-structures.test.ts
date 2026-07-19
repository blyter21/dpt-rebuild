import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getContext, adminFetch } = vi.hoisted(() => ({ getContext: vi.fn(), adminFetch: vi.fn() }));
vi.mock('../lib/dpt-admin-api', () => ({ getDptAdminApiContext: getContext, dptAdminSupabaseFetch: adminFetch }));
import { GET, POST } from '../app/api/admin/structures/[resource]/route';
const response = (body: unknown, status=200) => new Response(JSON.stringify(body), {status});
const request = (body: unknown) => new NextRequest('http://x/api/admin/structures/blinds',{method:'POST',body:JSON.stringify(body)});

describe('blind and payout structure administration', () => {
  beforeEach(()=>{vi.clearAllMocks();getContext.mockResolvedValue({accessToken:'token'});});
  it('fails closed before list or mutation calls', async()=>{
    getContext.mockResolvedValue(null);
    expect((await GET(new NextRequest('http://x'),{params:{resource:'blinds'}})).status).toBe(401);
    expect((await POST(request({action:'copy',id:1}),{params:{resource:'blinds'}})).status).toBe(401);
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it('returns payout rows with IDs, tournament types, and assignment counts', async()=>{
    adminFetch.mockImplementation(async(_context:unknown,url:string)=>{
      if(url.startsWith('/rest/v1/payout_templates?'))return response([{id:1,name:'DPT',payout_template_rows:[{id:11,standing:1}]}]);
      if(url.startsWith('/rest/v1/tournaments?'))return response([{payout_template_id:1},{payout_template_id:1}]);
      if(url.startsWith('/rest/v1/tournament_types?'))return response([{id:1,name:'DPT',code:'dpt_standard'}]);
      return response({},404);
    });
    const result=await GET(new NextRequest('http://x'),{params:{resource:'payouts'}});const body=await result.json();
    expect(result.status).toBe(200);expect(body.records[0].assigned_tournaments).toBe(2);expect(body.records[0].payout_template_rows[0].id).toBe(11);expect(body.tournamentTypes[0].name).toBe('DPT');
  });
  it('rejects unknown nested blind and payout fields', async()=>{
    const blind={action:'save',values:{name:'X',status:true,blind_intervals:20,description:'',blind_info:[{small_blind:'1',big_blind:'2',bbante:'0',injected:'no'}]}};
    const payout={action:'save',values:{name:'X',type:'range',tournament_type_id:1,rows:[{player_count_start:1,player_count_end:10,winners_count:1,standing:1,injected:'no'}]}};
    expect((await POST(request(blind),{params:{resource:'blinds'}})).status).toBe(400);
    expect((await POST(request(payout),{params:{resource:'payouts'}})).status).toBe(400);
    expect(adminFetch).not.toHaveBeenCalled();
  });
  it('forwards a validated blind structure only to the blind save RPC', async()=>{
    adminFetch.mockResolvedValue(response({id:10}));
    const values={name:'QA Blind',description:'',status:false,blind_intervals:20,blind_info:[{small_blind:'100',big_blind:'200',bbante:'200'},{addbreak:'Dinner',blind_interval:'30'}]};
    const result=await POST(request({action:'save',values}),{params:{resource:'blinds'}});
    expect(result.status).toBe(201);expect(adminFetch).toHaveBeenCalledWith(expect.anything(),'/rest/v1/rpc/dpt_admin_save_blind_structure',expect.objectContaining({body:JSON.stringify({p_id:null,p_values:values})}));
  });
  it('preserves payout row IDs in the guarded save RPC', async()=>{
    adminFetch.mockResolvedValue(response({template:{id:1},rows:[]}));
    const rows=[{id:11,player_count_start:1,player_count_end:10,winners_count:1,standing:1,payout_percentage:100,payout_amount:null,points:null,prize_description:''}];
    const values={name:'DPT',type:'range',tournament_type_id:1,rows};
    const result=await POST(request({action:'save',id:1,values}),{params:{resource:'payouts'}});
    expect(result.status).toBe(200);expect(adminFetch).toHaveBeenCalledWith(expect.anything(),'/rest/v1/rpc/dpt_admin_save_payout_template',expect.objectContaining({body:JSON.stringify({p_id:1,p_values:values})}));
  });
  it('uses action-specific status/copy/delete RPC payloads', async()=>{
    adminFetch.mockResolvedValueOnce(response({id:4})).mockResolvedValueOnce(response({id:5})).mockResolvedValueOnce(response({id:4}));
    expect((await POST(request({action:'status',id:4,status:false}),{params:{resource:'blinds'}})).status).toBe(200);
    expect((await POST(request({action:'copy',id:4}),{params:{resource:'blinds'}})).status).toBe(200);
    expect((await POST(request({action:'delete',id:4}),{params:{resource:'blinds'}})).status).toBe(200);
    expect(adminFetch.mock.calls.map((call)=>call[1])).toEqual(['/rest/v1/rpc/dpt_admin_status_blind_structure','/rest/v1/rpc/dpt_admin_copy_blind_structure','/rest/v1/rpc/dpt_admin_delete_blind_structure']);
  });
  it('matches the captured production editor labels and conditional actions', async()=>{
    const source=await readFile(new URL('../components/structure-manager.tsx',import.meta.url),'utf8');
    for(const label of ['Blinds List','Points System List','Small Blind','Big Blind','BB Ante','Add Break','Add Structure','Range Start','Range End','No. of Winners','Assigned Tournament','View Structure'])expect(source).toContain(label);
    expect(source).toContain("record.type==='range'");
  });
});
