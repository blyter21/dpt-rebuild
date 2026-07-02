# DPT Production SQL Safe Inventory

Source: uploaded `prod_dakotapokertour.sql` (raw data not reproduced here).

## Summary

- SQL file size: 5,844,065 bytes (5.57 MB)
- Tables detected: 32
- Tables with INSERT data: 30
- Total inserted rows detected: 28,699

## Table row counts

| Table | Rows | Columns | FK constraints |
|---|---:|---:|---:|
| `dpt_tournament_players` | 11,019 | 26 | 5 |
| `dpt_tournament_players_addon` | 7,832 | 10 | 4 |
| `model_has_roles` | 2,606 | 3 | 1 |
| `users` | 2,591 | 37 | 0 |
| `dpt_tournament_payout_distributions` | 1,940 | 13 | 4 |
| `users_otp_auth` | 604 | 9 | 0 |
| `notifications` | 401 | 11 | 0 |
| `articles` | 392 | 27 | 4 |
| `role_has_permissions` | 320 | 2 | 2 |
| `dpt_tournaments` | 271 | 69 | 7 |
| `permissions` | 169 | 5 | 0 |
| `dpt_payout_structures` | 130 | 12 | 4 |
| `jobs` | 105 | 7 | 0 |
| `dpt_events` | 82 | 19 | 5 |
| `dpt_venues` | 78 | 25 | 3 |
| `migrations` | 73 | 3 | 0 |
| `dpt_tournament_updates` | 24 | 15 | 4 |
| `password_resets` | 14 | 3 | 0 |
| `dpt_blind_structures` | 8 | 13 | 3 |
| `personal_access_tokens` | 7 | 9 | 0 |
| `dpt_payout_distributions` | 5 | 11 | 3 |
| `dpt_seasons` | 5 | 17 | 4 |
| `roles` | 5 | 5 | 0 |
| `contacts` | 4 | 8 | 0 |
| `dpt_tournament_types` | 4 | 9 | 3 |
| `failed_jobs` | 4 | 7 | 0 |
| `dpt_leagues` | 2 | 11 | 3 |
| `notification_entities` | 2 | 9 | 3 |
| `categories` | 1 | 20 | 3 |
| `configurations` | 1 | 9 | 0 |
| `mail_templates` | 0 | 11 | 0 |
| `model_has_permissions` | 0 | 3 | 1 |

## Likely media/path columns

| Table | Column |
|---|---|
| `articles` | `logo` |
| `articles` | `banner` |
| `articles` | `video_url` |
| `categories` | `path` |
| `dpt_events` | `logo` |
| `dpt_events` | `banner_image` |
| `dpt_seasons` | `logo` |
| `dpt_seasons` | `banner_image` |
| `dpt_tournament_updates` | `image` |
| `dpt_tournament_updates` | `video_url` |
| `dpt_tournaments` | `logo` |
| `dpt_tournaments` | `banner_image` |
| `dpt_venues` | `logo` |
| `dpt_venues` | `banner_image` |
| `users` | `avatar` |

## Schema notes

- `articles`: 27 columns, 392 rows. First columns: `id`, `title`, `alias`, `category_id`, `tournament_id`, `introtext`, `fulltext`, `logo`, `banner`, `meta_keywords`, `meta_description`, `status`, …
- `categories`: 20 columns, 1 rows. First columns: `id`, `title`, `alias`, `description`, `status`, `parent_id`, `lft`, `rgt`, `level`, `path`, `meta_description`, `meta_keywords`, …
- `configurations`: 9 columns, 1 rows. First columns: `id`, `recipient_email_address`, `sales_recipient_email`, `contact_recipient_email`, `country_code`, `mailchimp_api_key`, `mailchimp_audience_id`, `created_at`, `updated_at`
- `contacts`: 8 columns, 4 rows. First columns: `id`, `name`, `email`, `phone`, `subject`, `message`, `created_at`, `updated_at`
- `dpt_blind_structures`: 13 columns, 8 rows. First columns: `id`, `name`, `blind_info`, `blind_intervals`, `status`, `description`, `copied_blind`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, …
- `dpt_events`: 19 columns, 82 rows. First columns: `id`, `season_id`, `venue_id`, `name`, `alias`, `description`, `logo`, `banner_image`, `start_date`, `end_date`, `status`, `rules_description`, …
- `dpt_leagues`: 11 columns, 2 rows. First columns: `id`, `name`, `alias`, `description`, `status`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`
- `dpt_payout_distributions`: 11 columns, 5 rows. First columns: `id`, `name`, `tournament_type_id`, `type`, `point_distribution_type`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`
- `dpt_payout_structures`: 12 columns, 130 rows. First columns: `id`, `payout_id`, `player_count_start`, `player_count_end`, `winners_count`, `structures`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`
- `dpt_seasons`: 17 columns, 5 rows. First columns: `id`, `league_id`, `name`, `alias`, `description`, `default`, `logo`, `banner_image`, `start_date`, `end_date`, `status`, `created_by`, …
- `dpt_tournament_payout_distributions`: 13 columns, 1,940 rows. First columns: `id`, `tournament_id`, `structure_id`, `standing`, `payout_percentage`, `payout_amount`, `prize_description`, `points`, `created_by`, `updated_by`, `created_at`, `updated_at`, …
- `dpt_tournament_players`: 26 columns, 11,019 rows. First columns: `id`, `user_id`, `tournament_id`, `pre_registration`, `initial_buyin`, `initial_chips_count`, `rank`, `checked_in`, `checked_in_by`, `no_of_addons_buy`, `score`, `total_buy_in_amount`, …
- `dpt_tournament_players_addon`: 10 columns, 7,832 rows. First columns: `id`, `user_id`, `tournament_id`, `addon_buy_in_amount`, `addon_chips_count`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`
- `dpt_tournament_types`: 9 columns, 4 rows. First columns: `id`, `name`, `config`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, `deleted_at`
- `dpt_tournament_updates`: 15 columns, 24 rows. First columns: `id`, `tournament_id`, `title`, `description`, `update_date`, `image`, `video_url`, `featured`, `status`, `created_by`, `updated_by`, `deleted_by`, …
- `dpt_tournaments`: 69 columns, 271 rows. First columns: `id`, `season_id`, `event_id`, `venue_id`, `blind_id`, `tournament_type_id`, `qualifier_tournament`, `qualifier_tournament_ids`, `qualifier_prize`, `name`, `alias`, `featured`, …
- `dpt_venues`: 25 columns, 78 rows. First columns: `id`, `name`, `alias`, `address`, `city`, `state`, `zip`, `phone`, `status`, `logo`, `banner_image`, `fb_url`, …
- `failed_jobs`: 7 columns, 4 rows. First columns: `id`, `uuid`, `connection`, `queue`, `payload`, `exception`, `failed_at`
- `jobs`: 7 columns, 105 rows. First columns: `id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`
- `mail_templates`: 11 columns, 0 rows. First columns: `id`, `title`, `status`, `type`, `mailable`, `subject`, `html_template`, `attachments`, `text_template`, `created_at`, `updated_at`
- `migrations`: 3 columns, 73 rows. First columns: `id`, `migration`, `batch`
- `model_has_permissions`: 3 columns, 0 rows. First columns: `permission_id`, `model_type`, `model_id`
- `model_has_roles`: 3 columns, 2,606 rows. First columns: `role_id`, `model_type`, `model_id`
- `notification_entities`: 9 columns, 2 rows. First columns: `id`, `entity_name`, `alias`, `status`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`
- `notifications`: 11 columns, 401 rows. First columns: `id`, `type`, `notifiable_type`, `notifiable_id`, `data`, `email_sent`, `sms_sent`, `created_by`, `read_at`, `created_at`, `updated_at`
- `password_resets`: 3 columns, 14 rows. First columns: `email`, `token`, `created_at`
- `permissions`: 5 columns, 169 rows. First columns: `id`, `name`, `guard_name`, `created_at`, `updated_at`
- `personal_access_tokens`: 9 columns, 7 rows. First columns: `id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `created_at`, `updated_at`
- `role_has_permissions`: 2 columns, 320 rows. First columns: `permission_id`, `role_id`
- `roles`: 5 columns, 5 rows. First columns: `id`, `name`, `guard_name`, `created_at`, `updated_at`
- `users`: 37 columns, 2,591 rows. First columns: `id`, `first_name`, `middle_name`, `last_name`, `nick_name`, `is_registered`, `alias`, `email`, `status`, `birth_date`, `country_code`, `mobile`, …
- `users_otp_auth`: 9 columns, 604 rows. First columns: `id`, `mobile`, `email`, `otp`, `expiry`, `reason`, `created_at`, `updated_at`, `deleted_at`