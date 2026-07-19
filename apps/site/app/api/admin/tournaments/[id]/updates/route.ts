import { NextRequest, NextResponse } from 'next/server';
import { dptAdminSupabaseFetch, getDptAdminApiContext } from '../../../../../../lib/dpt-admin-api';

export const dynamic = 'force-dynamic';
type SaveBody = { updateId?: unknown; title?: unknown; description?: unknown; updateAt?: unknown; imageUrl?: unknown; videoUrl?: unknown };
const text = (value: unknown, limit: number) => typeof value === 'string' && value.trim().length <= limit ? value.trim() : null;
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const context = await getDptAdminApiContext();
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tournamentId = Number(params.id);
  if (!Number.isSafeInteger(tournamentId) || tournamentId <= 0) return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
  let body: SaveBody; try { body = await request.json() as SaveBody; } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const allowedFields = new Set(['updateId', 'title', 'description', 'updateAt', 'imageUrl', 'videoUrl']);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !allowedFields.has(key))) return NextResponse.json({ error: 'Invalid update payload fields' }, { status: 400 });
  const title = text(body.title, 255); const description = text(body.description ?? '', 20000); const imageUrl = text(body.imageUrl ?? '', 4000); const videoUrl = text(body.videoUrl ?? '', 4000);
  const updateId = body.updateId === undefined ? null : Number(body.updateId);
  if (!title || description === null || imageUrl === null || videoUrl === null || (updateId !== null && (!Number.isSafeInteger(updateId) || updateId <= 0))) return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
  let updateAt: string | null = null;
  if (body.updateAt !== undefined && body.updateAt !== null && body.updateAt !== '') { updateAt = typeof body.updateAt === 'string' && !Number.isNaN(Date.parse(body.updateAt)) ? new Date(body.updateAt).toISOString() : null; if (!updateAt) return NextResponse.json({ error: 'updateAt must be an ISO date' }, { status: 400 }); }
  const response = await dptAdminSupabaseFetch(context, '/rest/v1/rpc/dpt_admin_save_tournament_update', { method: 'POST', body: JSON.stringify({ p_tournament_id: tournamentId, p_update_id: updateId, p_title: title, p_description: description || null, p_update_at: updateAt, p_image_url: imageUrl || null, p_video_url: videoUrl || null }) });
  if (!response.ok) return NextResponse.json({ error: 'Live update could not be saved' }, { status: response.status === 404 ? 404 : 409 });
  return NextResponse.json({ update: await response.json() }, { status: updateId ? 200 : 201 });
}
