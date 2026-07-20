import sharp from 'sharp';
import {describe,expect,it} from 'vitest';
import {processAdminImage} from '../lib/admin-media';
describe('admin media processor',()=>{
 it('normalizes PNG input to metadata-free WebP variants',async()=>{const input=await sharp({create:{width:20,height:10,channels:4,background:{r:20,g:40,b:60,alpha:1}}}).png().toBuffer();const result=await processAdminImage(input,'image/png');expect(result.width).toBe(20);expect(result.height).toBe(10);expect(Object.keys(result.variants).sort()).toEqual(['card','hero','logo','thumb']);expect((await sharp(result.original).metadata()).format).toBe('webp');for(const output of Object.values(result.variants))expect((await sharp(output).metadata()).format).toBe('webp');});
 it('rejects declared MIME spoofing and unsupported formats',async()=>{const png=await sharp({create:{width:2,height:2,channels:3,background:'#fff'}}).png().toBuffer();await expect(processAdminImage(png,'image/jpeg')).rejects.toThrow('does not match');await expect(processAdminImage(Buffer.from('<svg/>'),'image/svg+xml')).rejects.toThrow('Only JPEG');});
});
