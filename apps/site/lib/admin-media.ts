import sharp from 'sharp';

export const ADMIN_MEDIA_BUCKET = 'dpt-admin-media';
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export type MediaVariant = 'thumb' | 'card' | 'hero' | 'logo';
export type ProcessedMedia = { width:number; height:number; original:Buffer; variants:Record<MediaVariant,Buffer> };

export async function processAdminImage(input: Buffer, declaredType: string): Promise<ProcessedMedia> {
  if (!IMAGE_TYPES.has(declaredType) || input.length < 1 || input.length > MAX_MEDIA_BYTES) throw new Error('Only JPEG, PNG, or WebP images up to 10 MiB are allowed');
  const image = sharp(input, { limitInputPixels: 40_000_000, failOn: 'error' }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || metadata.width > 12000 || metadata.height > 12000 || metadata.width * metadata.height > 40_000_000 || !['jpeg','png','webp'].includes(metadata.format || '')) throw new Error('Invalid image dimensions or format');
  const expectedFormat:Record<string,string>={'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'};
  if(metadata.format!==expectedFormat[declaredType]) throw new Error('Declared image type does not match decoded image');
  // rotate() applies EXIF orientation; withMetadata is deliberately omitted to strip EXIF and ICC metadata.
  const original = await image.clone().webp({ quality: 88, effort: 4 }).toBuffer();
  const variant = (width:number,height:number) => image.clone().resize(width,height,{fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:4}).toBuffer();
  return { width:metadata.width, height:metadata.height, original, variants:{ thumb:await variant(240,240), card:await variant(640,480), hero:await variant(1600,1000), logo:await variant(600,600) } };
}

export function isMediaPurpose(value: unknown): value is 'article_logo'|'email_attachment' { return value === 'article_logo' || value === 'email_attachment'; }
export function safeMediaKeys(asset: {original_key?:unknown;variants?:unknown}) { const variants=asset.variants && typeof asset.variants==='object' ? Object.values(asset.variants as Record<string,unknown>) : []; return [asset.original_key,...variants].filter((key):key is string=>typeof key==='string' && /^operator\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/(original\.webp|(thumb|card|hero|logo)\.webp)$/i.test(key)); }
