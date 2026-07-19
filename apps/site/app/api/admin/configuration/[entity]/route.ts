import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';

const entities = {
  events: {
    table: 'events',
    select: 'id,name,alias,season_id,venue_id,start_at,end_at,status,description,rules_description,logo_url,banner_url,facebook_event_url',
    order: 'id.desc',
    fields: ['name','alias','season_id','venue_id','start_at','end_at','description','rules_description','logo_url','banner_url','facebook_event_url'],
  },
  seasons: {
    table: 'seasons',
    select: 'id,name,alias,league_id,start_at,end_at,status,description,is_default,logo_url,banner_url',
    order: 'id.desc',
    fields: ['name','alias','league_id','start_at','end_at','description','is_default','logo_url','banner_url'],
  },
  leagues: {
    table: 'leagues', select: 'id,name,alias,status,description', order: 'id.desc', fields: ['name','alias','description'],
  },
  venues: {
    table: 'venues',
    select: 'id,name,alias,address,city,state,zip,phone,website,status,logo_url,banner_url,facebook_url,twitter_url,instagram_url,youtube_url,map_location_address',
    order: 'id.desc',
    fields: ['name','alias','address','city','state','zip','phone','website','logo_url','banner_url','facebook_url','twitter_url','instagram_url','youtube_url','map_location_address'],
  },
} as const;
type Entity = keyof typeof entities;
const valid = (value: string | undefined): value is Entity => Boolean(value && value in entities);
const allowedTopLevel = (body: Record<string, unknown>, allowed: string[]) => Object.keys(body).every((key) => allowed.includes(key));

async function readOptions(context: NonNullable<Awaited<ReturnType<typeof getDptAdminApiContext>>>, resource: Entity) {
  const options: Record<string, unknown[]> = {};
  if (resource === 'events' || resource === 'seasons') {
    const response = await dptAdminSupabaseFetch(context, '/rest/v1/leagues?select=id,name&status=eq.true&deleted_at=is.null&order=name.asc');
    if (!response.ok) throw new Error('League options unavailable');
    options.leagues = await response.json() as unknown[];
  }
  if (resource === 'events') {
    const [seasons, venues] = await Promise.all([
      dptAdminSupabaseFetch(context, '/rest/v1/seasons?select=id,name,league_id&status=eq.true&deleted_at=is.null&order=name.asc'),
      dptAdminSupabaseFetch(context, '/rest/v1/venues?select=id,name,city,state&status=eq.true&deleted_at=is.null&order=name.asc'),
    ]);
    if (!seasons.ok || !venues.ok) throw new Error('Event relationship options unavailable');
    options.seasons = await seasons.json() as unknown[];
    options.venues = await venues.json() as unknown[];
  }
  return options;
}

export async function GET(_request: NextRequest, { params }: { params: { entity: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!valid(params.entity)) return NextResponse.json({ error: 'Unknown configuration resource' }, { status: 404 });
  const resource = params.entity as Entity;
  const spec = entities[resource];
  const query = new URLSearchParams({ select: spec.select, deleted_at: 'is.null', order: spec.order });
  try {
    const [response, options] = await Promise.all([
      dptAdminSupabaseFetch(context, `/rest/v1/${spec.table}?${query}`),
      readOptions(context, resource),
    ]);
    if (!response.ok) return NextResponse.json({ error: 'Configuration list unavailable' }, { status: 502 });
    return NextResponse.json({ records: await response.json(), options });
  } catch {
    return NextResponse.json({ error: 'Configuration relationship options unavailable' }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { entity: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!valid(params.entity)) return NextResponse.json({ error: 'Unknown configuration resource' }, { status: 404 });
  const resource = params.entity as Entity;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.action !== 'string') {
    return NextResponse.json({ error: 'Invalid configuration payload' }, { status: 400 });
  }
  const id = body.id === undefined || body.id === null ? null : Number(body.id);
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });

  let rpc: string;
  let payload: Record<string, unknown>;
  if (body.action === 'save') {
    if (!allowedTopLevel(body, ['action','id','values']) || !body.values || typeof body.values !== 'object' || Array.isArray(body.values)) {
      return NextResponse.json({ error: 'Invalid configuration save payload' }, { status: 400 });
    }
    const raw = body.values as Record<string, unknown>;
    const allowed = entities[resource].fields as readonly string[];
    if (Object.keys(raw).some((key) => !allowed.includes(key)) || Object.values(raw).some((value) => typeof value !== 'string')) {
      return NextResponse.json({ error: 'Invalid configuration values' }, { status: 400 });
    }
    const values = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, (value as string).trim()]));
    if (!values.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    rpc = 'dpt_admin_save_configuration';
    payload = { p_entity: resource.slice(0, -1), p_id: id, p_values: values };
  } else if (body.action === 'status') {
    if (!allowedTopLevel(body, ['action','id','status']) || typeof body.status !== 'boolean' || id === null) return NextResponse.json({ error: 'Invalid status payload' }, { status: 400 });
    rpc = 'dpt_admin_set_configuration_status';
    payload = { p_entity: resource.slice(0, -1), p_id: id, p_status: body.status };
  } else if (body.action === 'delete') {
    if (!allowedTopLevel(body, ['action','id']) || id === null) return NextResponse.json({ error: 'Invalid delete payload' }, { status: 400 });
    rpc = 'dpt_admin_soft_delete_configuration';
    payload = { p_entity: resource.slice(0, -1), p_id: id };
  } else {
    return NextResponse.json({ error: 'Invalid configuration action' }, { status: 400 });
  }
  const response = await dptAdminSupabaseFetch(context, `/rest/v1/rpc/${rpc}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) return NextResponse.json({ error: 'Configuration change was rejected', detail: await response.text() }, { status: response.status === 401 ? 401 : 409 });
  return NextResponse.json({ record: await response.json() }, { status: id ? 200 : 201 });
}
