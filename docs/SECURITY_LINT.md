# Pre-deploy security-lint gate

A GitHub Actions workflow (`.github/workflows/supabase-security-lint.yml`) runs
the Supabase database linter on every PR and push to `main`. It **fails the
build** — and therefore blocks deploy — when:

- any **ERROR**-level finding exists, or
- a **new** WARN/INFO finding appears that is not in the baseline
  (`.supabase-lint-baseline.json`).

## One-time setup

Add two repository secrets (GitHub → Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_REF`  | `atxqvdrapkvqluryjota` |

## Accepting a new finding

If a new warning is intentional (e.g. another helper used in RLS policies):

```bash
SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=atxqvdrapkvqluryjota \
  node scripts/supabase-lint-check.mjs --update
git add .supabase-lint-baseline.json
```

Document the reason in the security memory so future scans know it's expected.

## Currently accepted (5 findings)

- `rate_limits` has RLS on with no policies — only the service role writes via the rate-limit edge function.
- `has_role` / `owns_brewery` are executable by `public`/`authenticated` — required as helpers inside RLS policies.
