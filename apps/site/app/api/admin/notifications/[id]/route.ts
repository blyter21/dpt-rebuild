import {NextRequest,NextResponse} from 'next/server';
import {dptAdminSupabaseFetch,getDptAdminApiContext} from '../../../../../lib/dpt-admin-api';
import {simulateNotificationDelivery} from '../../../../../lib/notifications/simulator';
export const dynamic='force-dynamic';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).every((key)=>keys.includes(key));
const rpc=(context:NonNullable<Awaited<ReturnType<typeof getDptAdminApiContext>>>,name:string,body:unknown)=>dptAdminSupabaseFetch(context,`/rest/v1/rpc/${name}`,{method:'POST',body:JSON.stringify(body)});
const sameOrigin=(request:NextRequest)=>request.headers.get('origin')===request.nextUrl.origin&&(!request.headers.get('sec-fetch-site')||request.headers.get('sec-fetch-site')==='same-origin');
export async function GET(request:NextRequest,{params}:{params:{id:string}}){
 const context=await getDptAdminApiContext();if(!context)return NextResponse.json({error:'Unauthorized'},{status:401});if(!uuid.test(params.id))return NextResponse.json({error:'Invalid campaign id'},{status:400});const offset=Math.max(0,Number(request.nextUrl.searchParams.get('offset')??0)||0),response=await rpc(context,'dpt_admin_notification_campaign_detail',{p_campaign_id:params.id,p_offset:offset,p_limit:100});if(!response.ok)return NextResponse.json({error:'Campaign unavailable'},{status:response.status===403?403:404});return NextResponse.json({...await response.json(),simulation:true});
}
export async function POST(request:NextRequest,{params}:{params:{id:string}}){
 const context=await getDptAdminApiContext();if(!context)return NextResponse.json({error:'Unauthorized'},{status:401});if(!sameOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});if(!uuid.test(params.id))return NextResponse.json({error:'Invalid campaign id'},{status:400});let body:Record<string,unknown>;try{body=await request.json() as Record<string,unknown>}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(body.action==='cancel'&&exact(body,['action'])){const response=await rpc(context,'dpt_admin_cancel_notification_campaign',{p_campaign_id:params.id});return response.ok?NextResponse.json({campaign:await response.json()}):NextResponse.json({error:'Cancel rejected'},{status:409});}
 if(body.action==='retry'&&exact(body,['action','delivery_id'])&&typeof body.delivery_id==='string'&&uuid.test(body.delivery_id)){const response=await rpc(context,'dpt_admin_retry_notification_delivery',{p_delivery_id:body.delivery_id});return response.ok?NextResponse.json({delivery:await response.json()}):NextResponse.json({error:'Retry rejected'},{status:409});}
 if(body.action!=='process'||!exact(body,['action']))return NextResponse.json({error:'Invalid action'},{status:400});
 const claimed=await rpc(context,'dpt_admin_claim_notification_deliveries',{p_campaign_id:params.id,p_limit:25});if(!claimed.ok)return NextResponse.json({error:'Queue claim rejected'},{status:409});const queue=await claimed.json() as {deliveries?:Array<{id:string;channel:'email'|'sms';lease_token:string}>};
 const results=await Promise.all((queue.deliveries??[]).map(async(delivery)=>{const result=simulateNotificationDelivery(delivery),response=await rpc(context,'dpt_admin_finalize_notification_delivery',{p_delivery_id:delivery.id,p_lease_token:delivery.lease_token,p_outcome:result.outcome,p_provider_message_id:result.providerMessageId??null,p_error_code:result.errorCode??null});return response.ok?response.json():{id:delivery.id,error:'finalize_rejected'}}));return NextResponse.json({simulation:true,processed:results.length,deliveries:results});
}
