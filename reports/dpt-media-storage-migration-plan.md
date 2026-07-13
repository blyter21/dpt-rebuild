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
totalFiles: 1338
totalBytes: 55,027,580
```

| Type | Files | Bytes |
|---|---:|---:|
| `article` | 384 | 21,295,850 |
| `event` | 79 | 6,493,496 |
| `logo` | 1 | 16,196 |
| `profile` | 556 | 8,518,594 |
| `slider` | 1 | 22,569 |
| `tournament` | 240 | 14,895,836 |
| `venue` | 75 | 3,726,614 |
| `video` | 2 | 58,425 |

## Sample mappings

| Local public path | Bucket | Object path |
|---|---|---|
| `/media/dpt/article/02F5E6EA-87AE-4A14-8986-CE8DFA03F852-38tNPuVp.jpg` | `dpt-public-media` | `article/02F5E6EA-87AE-4A14-8986-CE8DFA03F852-38tNPuVp.jpg` |
| `/media/dpt/article/03MqTehEjXv2udYinlCiVuxwU2ZJ68Ea8d6kba3Z.jpg` | `dpt-public-media` | `article/03MqTehEjXv2udYinlCiVuxwU2ZJ68Ea8d6kba3Z.jpg` |
| `/media/dpt/article/0P938YrG0lDSFIBidcjjxaaHXv8LZBR8dPnlMffw.jpg` | `dpt-public-media` | `article/0P938YrG0lDSFIBidcjjxaaHXv8LZBR8dPnlMffw.jpg` |
| `/media/dpt/article/0l1wcBawchyLQju5MsAWlvLp3FExViDUxDSl8aUB.jpg` | `dpt-public-media` | `article/0l1wcBawchyLQju5MsAWlvLp3FExViDUxDSl8aUB.jpg` |
| `/media/dpt/article/1000009645-DQhgVS71.jpg` | `dpt-public-media` | `article/1000009645-DQhgVS71.jpg` |
| `/media/dpt/article/1000010529-AcCsJmae.jpg` | `dpt-public-media` | `article/1000010529-AcCsJmae.jpg` |
| `/media/dpt/article/1288B9D9-277C-4648-AA14-A928DCCCF1B6-29pTVY6F.jpg` | `dpt-public-media` | `article/1288B9D9-277C-4648-AA14-A928DCCCF1B6-29pTVY6F.jpg` |
| `/media/dpt/article/12AB3E88-DC1D-4BCE-9414-1CD9FCDB4C6E-HMptV7ZT.jpg` | `dpt-public-media` | `article/12AB3E88-DC1D-4BCE-9414-1CD9FCDB4C6E-HMptV7ZT.jpg` |
| `/media/dpt/article/14D65D73-8A7F-41E7-B265-55E5D60BB7E7-uju3fKto.jpg` | `dpt-public-media` | `article/14D65D73-8A7F-41E7-B265-55E5D60BB7E7-uju3fKto.jpg` |
| `/media/dpt/article/16652488850273720979211254261633-Bzl9Xxuv.jpg` | `dpt-public-media` | `article/16652488850273720979211254261633-Bzl9Xxuv.jpg` |
| `/media/dpt/article/199E8651-0849-476C-844F-FCA4C60DD9F3-RbZ83G3s.jpg` | `dpt-public-media` | `article/199E8651-0849-476C-844F-FCA4C60DD9F3-RbZ83G3s.jpg` |
| `/media/dpt/article/1DfTtMloSEUTwxhXxaA99LGmXUlk2YmuWJGQqE6d.jpg` | `dpt-public-media` | `article/1DfTtMloSEUTwxhXxaA99LGmXUlk2YmuWJGQqE6d.jpg` |

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
