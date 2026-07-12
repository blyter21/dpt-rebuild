# DPT Production SQL Source Handling

## Durable source

The production SQL dump uploaded by Brook is stored outside the Git repository at:

```text
/home/hermes/.hermes/private/dpt/prod_dakotapokertour.sql
```

Dated protected copy:

```text
/home/hermes/.hermes/private/dpt/prod_dakotapokertour_2026-07-11.sql
```

Permissions:

```text
directory: 700
files: 600
owner: hermes:hermes
```

Metadata:

```text
filename: prod_dakotapokertour.sql
bytes: 5,844,065
SHA-256: 7ac5abcaddb8a786dffd482ad576bda6bbd8f763c96ad45c517f709fbbe7abd1
CREATE TABLE count: 32
INSERT table count: 30
```

The raw SQL file must never be committed to Git or deployed to Vercel.

## Extraction

`scripts/extract_public_dpt_data.py` reads the durable source by default.

Optional override:

```bash
DPT_PRODUCTION_SQL_PATH=/secure/path/prod_dakotapokertour.sql python3 scripts/extract_public_dpt_data.py
```

The extractor outputs only curated public-site data and intentionally omits passwords, OTP records, tokens, emails, and phone numbers.

## Verification completed

```text
public leaderboard: 25
public events: 60
public tournaments: 80
public venues: 77
public articles: 80
public champions: 40
videos: 2
site tests: 10 passed
site typecheck: passed
```
