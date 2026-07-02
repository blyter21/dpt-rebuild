# DPT Vercel Preview Live Verification

## URL

```text
https://dpt-rebuild-site.vercel.app
```

## Deployment evidence

Vercel dashboard screenshot from Brook showed:

```text
Project: dpt-rebuild-site
Status: Ready
Source branch: main
Commit: 4e7e6fd
Commit message: Initial DPT rebuild Next.js preview package
```

## HTTP route smoke

Ran live checks against:

```text
https://dpt-rebuild-site.vercel.app
```

Routes passed:

```text
/
/events
/leaderboard
/venues
/news
/videos
/champions
/players
/login
```

Result:

```text
9 public routes passed
```

Media checks:

```text
localMediaPaths: 33
oldStorageImages: 0
heroSliderLocal: true
videoThumbLocal: true
```

## Browser DOM check

```text
title: Dakota Poker Tour
hasHero: true
hasPoy: true
localImages: 33
remoteStorageImages: 0
vercel: true
```

## Browser visual check

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_5717fff142d84c3699229452c3b968fa.png
```

Visual sections verified:

```text
header/nav
hero
Player of the Year strip
Past Events cards
Videos cards
News sidebar
Latest Posts sidebar
Venues grid
footer
```

## Known visual concern

```text
Player of the Year strip appears slightly clipped/overflowing at the right edge on desktop.
```

No major broken UI, CAPTCHA, login wall, or Vercel protection challenge was visible.
