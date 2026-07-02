# DPT Media Storage Migration Plan

## Scope

Create the final media-storage migration plan for Supabase Storage or Vercel/public CDN without uploading anything.

## Safety

```text
No upload performed
No Supabase project linked
No Vercel deploy
No production mutation
```

## Outputs

```text
apps/site/data/dpt-media-storage-manifest.json
reports/dpt-media-upload-commands.jsonl
```

## Target storage shape

Default bucket:

```text
dpt-public-media
```

Object paths preserve the local public media structure after `/media/dpt/`:

```text
apps/site/public/media/dpt/event/example.png
        -> bucket: dpt-public-media
        -> object: event/example.png
```

Future CDN/base URL env:

```text
NEXT_PUBLIC_DPT_MEDIA_BASE_URL=https://cdn.example.com/dpt-public-media
```

Then runtime URLs become:

```text
${NEXT_PUBLIC_DPT_MEDIA_BASE_URL}/event/example.png
```

## Summary

```text
totalFiles: 312
totalBytes: 15,992,956
```

| Type | Files | Bytes |
|---|---:|---:|
| `article` | 78 | 203,189 |
| `event` | 59 | 5,185,507 |
| `logo` | 1 | 16,196 |
| `profile` | 25 | 523,529 |
| `slider` | 1 | 22,569 |
| `tournament` | 72 | 6,328,440 |
| `venue` | 74 | 3,655,101 |
| `video` | 2 | 58,425 |

## Sample mappings

| Local public path | Bucket | Object path |
|---|---|---|
| `/media/dpt/article/5895-2ZFJwJk1.jpg` | `dpt-public-media` | `article/5895-2ZFJwJk1.jpg` |
| `/media/dpt/article/624097261_1557797323014007_6731439949156077435_n-4ImSBlPS.jpg` | `dpt-public-media` | `article/624097261_1557797323014007_6731439949156077435_n-4ImSBlPS.jpg` |
| `/media/dpt/article/625345834_1557684043025335_6356642423505752983_n-xdasf0Pk.jpg` | `dpt-public-media` | `article/625345834_1557684043025335_6356642423505752983_n-xdasf0Pk.jpg` |
| `/media/dpt/article/641636097_1584189320374807_8541594968132913524_n-wgHglL1W.jpg` | `dpt-public-media` | `article/641636097_1584189320374807_8541594968132913524_n-wgHglL1W.jpg` |
| `/media/dpt/article/650535334_1594158749377864_936456110948628482_n-5C99VGDa.jpg` | `dpt-public-media` | `article/650535334_1594158749377864_936456110948628482_n-5C99VGDa.jpg` |
| `/media/dpt/article/651233183_1595244512602621_8432823892227840256_n-GJW9DuMV.jpg` | `dpt-public-media` | `article/651233183_1595244512602621_8432823892227840256_n-GJW9DuMV.jpg` |
| `/media/dpt/article/651439665_1595899975870408_1131605283142510705_n-YGejH793.jpg` | `dpt-public-media` | `article/651439665_1595899975870408_1131605283142510705_n-YGejH793.jpg` |
| `/media/dpt/article/653499935_1602101801916892_6979512571715754921_n-Ce4c0voQ.jpg` | `dpt-public-media` | `article/653499935_1602101801916892_6979512571715754921_n-Ce4c0voQ.jpg` |
| `/media/dpt/article/674434535_1626215662838839_3101149415253439377_n-OjBpK678.jpg` | `dpt-public-media` | `article/674434535_1626215662838839_3101149415253439377_n-OjBpK678.jpg` |
| `/media/dpt/article/ALI-lR0p9Bjn.jpg` | `dpt-public-media` | `article/ALI-lR0p9Bjn.jpg` |
| `/media/dpt/article/D52AE449-8145-4578-B156-12DAD8CAA542-hZsiZcH6.jpg` | `dpt-public-media` | `article/D52AE449-8145-4578-B156-12DAD8CAA542-hZsiZcH6.jpg` |
| `/media/dpt/article/IMG_3343-ObrssFBD.jpg` | `dpt-public-media` | `article/IMG_3343-ObrssFBD.jpg` |

## Upload commands

Upload command templates are written to:

```text
reports/dpt-media-upload-commands.jsonl
```

They use placeholders and are **not executed**:

```text
SUPABASE_URL
UPLOAD_BEARER_TOKEN
```

A future approved upload loop should:

```text
1. Create/choose bucket dpt-public-media.
2. Confirm service-role usage is local/admin-only, never public frontend env.
3. Run upload commands against staging/preview first.
4. Set NEXT_PUBLIC_DPT_MEDIA_BASE_URL to the final public base URL.
5. Run npm run dpt:verify:public.
```

## Vercel/public-CDN alternative

If staying on Vercel static assets for preview, no upload is required: current paths already serve from:

```text
/media/dpt/...
```

A CDN can mirror the same object paths and use `NEXT_PUBLIC_DPT_MEDIA_BASE_URL` later.
