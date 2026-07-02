# Loop 070 — Visual Parity Pass

## Goal

Run a visual parity pass against the live DakotaPokerTour.com homepage and core public routes, capture screenshots side-by-side, then adjust header/nav/hero/card/footer spacing and mobile responsiveness to more closely match the current production site.

## Live reference captured

```text
Live homepage screenshot:
/home/hermes/.hermes/cache/screenshots/browser_screenshot_4449cbc7d0964744becb2eac31711691.png
```

Live key traits observed:

```text
black logo block + cream nav bar
red Join/Login button + red-outline Live Updates button
social icon cluster at far right
full-width poker-table slider hero image
horizontal Player of the Year strip directly below hero
light blush page background
main content + right sidebar layout
cyan News / Latest Posts sidebar headers
white rounded event/video/news cards with soft shadows
multi-column dark footer
```

## Side-by-side artifact

```text
reports/dpt-homepage-parity-side-by-side.png
```

## Adjustments made

```text
Downloaded live hero slider asset to /media/dpt/slider/slider1.jpg
Reworked header into black logo block + cream nav + compact CTA/social cluster
Converted hero from gradient panel to slider-image banner
Moved Player of the Year into horizontal strip below hero
Rebuilt homepage body as main column + right sidebar
Changed News / Latest Posts panels to cyan headers
Tightened event cards to 2-column main-grid cards with red outline buttons and Facebook share chip
Reworked footer to dark 4-column live-style footer with bottom legal/copyright bar
Added responsive breakpoints for header stacking, single-column content, and collapsed grids
Replaced unsupported metadata emoji with stable text/icon badges
```

## Verification

```text
npm --workspace apps/site test
npm --workspace apps/site run typecheck
npm --workspace apps/site run build
HTTP/CSS parity checks
Core route smoke checks
Browser DOM style/media checks
Browser visual screenshot
```

Actual results:

```text
@dpt/site-replacement test: 1 file / 7 tests passed
@dpt/site-replacement typecheck: passed
@dpt/site-replacement build: passed
Core route smoke checks: /, /events, /leaderboard, /venues, /news, /champions, /videos passed
Desktop DOM: heroImg=/media/dpt/slider/slider1.jpg, poyDisplay=grid, remoteStorageImages=0
Responsive CSS: 1100px and 800px breakpoints present for header/page/grids
```

Current local URL/process:

```text
http://localhost:3001
proc_7b4758495637
```

Final local screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_0c2eac13a37d466dbd03d6745d42d782.png
```

## Remaining parity gaps

```text
Hero uses the exact live slider image but crop/overlay still differs slightly.
Player of the Year strip is static/horizontal-scroll rather than the live carousel behavior.
Video cards still show iframe/blank YouTube areas rather than polished thumbnails.
Metadata icons are now stable but not identical Font Awesome-style icons.
Some venue/logo image crops remain inconsistent.
Mobile responsiveness was verified by CSS breakpoints, not a true mobile screenshot because Playwright/Puppeteer are not installed.
```

## Next recommended loop

```text
Replace placeholder/static social and metadata symbols with proper SVG/icon components, add YouTube thumbnail previews for video cards, and run an interactive link/playback QA pass across homepage, Events, News, Videos, Venues, Leaderboard, Champions, and representative detail routes.
```
