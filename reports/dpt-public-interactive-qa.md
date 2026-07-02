# DPT Public Interactive QA — Icons, Videos, Links

## Scope

Interactive/browser QA after replacing placeholder symbols with SVG icons and converting video embeds to YouTube thumbnail preview cards.

## Environment

```text
Local URL: http://localhost:3001
Process: proc_9d2bad49625e
App: apps/site
```

## Routes checked

```text
/
/events
/events/dakota-poker-tour-2026-poker-brat-black-chip-bounty-tournament
/tournaments/dakota-poker-tour-2026-poker-brat-black-chip-bounty-tournament-black-chip-bounty-06-07-2026
/news
/videos
/venues
/leaderboard
/champions
/players
/login
```

## Results

```text
Core route smoke checks: 11 passed
Homepage local media: passed
Homepage remote storage dependency: 0 remote dakotapokertour.com/storage image srcs
SVG icon rendering: passed
Video thumbnail rendering: passed
YouTube playback link targets: passed
Event detail route: passed
Tournament detail route: passed
Console JS errors: 0
```

## Video QA details

Verified on `/videos`:

```text
Thumbnail 1: /media/dpt/video/TUj5rdgBHZQ.jpg
Thumbnail 2: /media/dpt/video/UJvMmjhOXFc.jpg
Thumbnail naturalWidth: 480 / 480
Play icon SVG path: M9 6.5v11l9-5.5-9-5.5Z
YouTube links:
https://www.youtube.com/watch?v=TUj5rdgBHZQ
https://www.youtube.com/watch?v=UJvMmjhOXFc
```

## Console

Only dev-mode info message:

```text
Download the React DevTools for a better development experience
```

No JavaScript errors.

## Screenshot

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_047272540a3a493191c3c5070f86fbb3.png
```

## Remaining notes

```text
Video cards link to YouTube rather than embedding playback inline.
External social/video URLs were not clicked through to leave the local QA context.
Login route is still a public placeholder until auth/admin rebuild begins.
```
