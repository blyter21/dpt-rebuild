import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../lib/dpt-admin-api';
import { ADMIN_MEDIA_BUCKET, isMediaPurpose, MAX_MEDIA_BYTES, processAdminImage } from '../../../../lib/admin-media';
export const dynamic='force-dynamic';
export const runtime='nodejs';
type Started={id:string;key:string;variants:Record<'thumb'|'card'|'hero'|'logo',string>};
const sameOrigin=(request:NextRequest)=>request.headers.get('origin')===request.nextUrl.origin&&(!request.headers.get('sec-fetch-site')||request.headers.get('sec-fetch-site')==='same-origin');
const storage=(context:NonNullable<Awaited<ReturnType<typeof getDptAdminApiContext>>>,key:string,init:RequestInit={})=>dptAdminSupabaseFetch(context,`/storage/v1/object/${ADMIN_MEDIA_BUCKET}/${key}`,init);
const publicAsset=(asset:Record<string,unknown>)=>({id:asset.id,purpose:asset.purpose,state:asset.state,content_type:asset.content_type,byte_size:asset.byte_size,width:asset.width,height:asset.height,alt_text:asset.alt_text,created_at:asset.created_at,updated_at:asset.updated_at});
export async function GET(request:NextRequest){
 const context=await getDptAdminApiContext();if(!context)return NextResponse.json({error:'Unauthorized'},{status:401});
 const purpose=request.nextUrl.searchParams.get('purpose');if(purpose&&!isMediaPurpose(purpose))return NextResponse.json({error:'Invalid purpose'},{status:400});
 const query=new URLSearchParams({select:'id,purpose,state,content_type,byte_size,width,height,alt_text,created_at,updated_at',deleted_at:'is.null',state:'eq.ready',order:'created_at.desc',limit:'100'});if(purpose)query.set('purpose',`eq.${purpose}`);
 const response=await dptAdminSupabaseFetch(context,`/rest/v1/media_assets?${query}`);if(!response.ok)return NextResponse.json({error:'Media unavailable'},{status:502});return NextResponse.json({media:await response.json()});
}
export async function POST(request:NextRequest){
 const context=await getDptAdminApiContext();if(!context)return NextResponse.json({error:'Unauthorized'},{status:401});if(!sameOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403});
 const declaredLength=Number(request.headers.get('content-length')||0);if(!Number.isFinite(declaredLength)||declaredLength<1||declaredLength>MAX_MEDIA_BYTES+1_048_576)return NextResponse.json({error:'Upload is too large'},{status:413});
 let form:FormData;try{form=await request.formData()}catch{return NextResponse.json({error:'Multipart form required'},{status:400});}
 if([...form.keys()].some((key)=>!['purpose','alt_text','file'].includes(key))||form.getAll('purpose').length!==1||form.getAll('file').length!==1||form.getAll('alt_text').length>1)return NextResponse.json({error:'Unexpected or duplicate upload field'},{status:400});
 const purpose=form.get('purpose'),file=form.get('file'),alt=form.get('alt_text');if(!isMediaPurpose(purpose)||!(file instanceof File))return NextResponse.json({error:'Exactly one image file and a valid purpose are required'},{status:400});
 let processed;try{processed=await processAdminImage(Buffer.from(await file.arrayBuffer()),file.type)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Image rejected'},{status:400});}
 const begin=await dptAdminSupabaseFetch(context,'/rest/v1/rpc/dpt_admin_begin_media',{method:'POST',body:JSON.stringify({p_purpose:purpose,p_content_type:'image/webp',p_byte_size:processed.original.length,p_width:processed.width,p_height:processed.height,p_alt_text:typeof alt==='string'?alt.trim().slice(0,500)||null:null})});
 if(!begin.ok)return NextResponse.json({error:'Media upload rejected'},{status:409});const started=await begin.json() as Started;
 const entries:[string,Buffer][]=[[started.key,processed.original],...Object.entries(started.variants).map(([name,key])=>[key,processed.variants[name as keyof typeof processed.variants]] as [string,Buffer])];const uploaded:string[]=[];
 try{
  for(const [key,body] of entries){const response=await storage(context,key,{method:'POST',headers:{'content-type':'image/webp','x-upsert':'false'},body:body as unknown as BodyInit});if(!response.ok)throw new Error('Storage upload failed');uploaded.push(key);}
  const finalized=await dptAdminSupabaseFetch(context,'/rest/v1/rpc/dpt_admin_finalize_media',{method:'POST',body:JSON.stringify({p_id:started.id,p_original_key:started.key,p_variants:started.variants})});if(!finalized.ok)throw new Error('Media finalization failed');return NextResponse.json({media:publicAsset(await finalized.json())},{status:201});
 }catch(error){await Promise.allSettled(uploaded.map((key)=>storage(context,key,{method:'DELETE'})));await dptAdminSupabaseFetch(context,'/rest/v1/rpc/dpt_admin_fail_media',{method:'POST',body:JSON.stringify({p_id:started.id})}).catch(()=>undefined);return NextResponse.json({error:error instanceof Error?error.message:'Upload failed'},{status:502});}
}
