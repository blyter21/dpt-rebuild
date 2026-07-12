# DPT Integrated Admin Foundation Verification

## Result

The Dakota Poker Tour replacement now contains public and admin routes in the same Next.js application:

```text
apps/site
```

Admin routes:

```text
/admin
/admin/events
/admin/tournaments
/admin/venues
/admin/articles
```

## Production-derived source

```text
prod_dakotapokertour.sql
```

Source counts displayed by the dashboard:

```text
users: 2,591
tournament entries: 11,019
tournaments: 271
events: 82
venues: 78
articles: 392
```

Current curated repository views:

```text
events: 60
tournaments: 80
venues: 77
articles: 80
```

## Non-mock assertions

```text
No mock-route string
No mockPlayers source
No password reset table exposure
No OTP table exposure
No personal access token exposure
Known production entities render
```

## Verification evidence

```text
Tests: 11 passed
Typecheck: passed
Production build: passed
HTTP routes checked: 7
Browser JS errors: 0
```

Screenshot:

```text
/home/hermes/.hermes/cache/screenshots/browser_screenshot_8ef49ed0a45d4e14b54970d0cf0995c0.png
```

## Deployment boundary

This foundation is read-only and uses curated production-derived records. Supabase Auth is not connected. No private user rows or write operations are exposed. Before any real admin mutation work, create/connect Supabase staging and implement authentication, roles, RLS, transactions, and audit logging.
