# Dakota Poker Tour Rebuild Lab

Safe local test workspace for rebuilding DakotaPokerTour.com from the Laravel reference app.

## Safety boundaries

- Reference Laravel repo: `/home/hermes/projects/dpt-web`
- Rebuild lab: `/home/hermes/projects/dpt-rebuild-lab`
- Do not push to GitHub without Brook's explicit request.
- Do not deploy to Vercel/Supabase production.
- Do not use production credentials in this lab.
- Treat the Laravel repo as read-only reference except local reports/spec files.

## Strategy

1. Convert the Laravel codebase into a formal rebuild spec.
2. Build a standalone tested tournament engine before UI.
3. Draft Supabase schema and RLS around tested domain rules.
4. Build admin/public prototypes only after core logic is proven.
5. Use loop checkpoints: goal, work performed, tests run, next loop.

## Current handoff

Start here before continuing the rebuild:

- `HANDOFF.md`
- `PROJECT_STATUS.md`
- `DPT_CURRENT_PLATFORM_MAP.md`
- `DPT_REPLACEMENT_SITE_RESULTS.md`

## Current source reports

- `/home/hermes/projects/dpt-web/PEDRO_TRIAGE_PRELIM.md`
- `/home/hermes/projects/dpt-web/PEDRO_DEEP_DIVE_DPT_BACKEND.md`
