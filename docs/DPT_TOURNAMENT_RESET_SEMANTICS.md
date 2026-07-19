# Loop 2 reset semantics

The legacy Laravel `resetTournament` clears entry result/check-in state, reopens registration, and clears tournament prize aggregates; it preserves registered entries and their add-on history. The local replacement retains those source identities and adds protection for modern materialized payout rows and flight carryover.

`dpt_admin_tournament_reset_preview(tournament_id)` is read-only and administrator-gated. It reports exact counts and a deterministic MD5 confirmation token of the tournament id, current `updated_at`, and canonical counts. `dpt_admin_reset_tournament(tournament_id, token)` locks the tournament, recomputes the preview under that lock, and fails closed if the token is stale.

The atomic reset records a recoverable before snapshot in `dpt_tournament_reset_snapshots`, retains audit history, reopens registration, clears entry runtime/result fields, and preserves configuration, profiles, roles, legacy import identities, entries, add-ons, updates, and materialized payout structure rows. It unwinds active flight contributions via provenance and recomputes remaining active-flight contributions so a main baseline or another flight is never damaged.
