# wetlands — PR review guide
Firebase-hosted static ArcGIS JS 4.17/4.24 map app (index.html + map.js) for Utah wetlands/NWI data.
LEGACY per house rules — being retired; do the minimum. Review ONLY the changed lines (general
bug/security/quality assumed). Cite file:line; group nits; prefer minimal, in-style fixes over
refactors — no rewrites on retiring code.

## Match the existing code
- jQuery / ArcGIS-4 era single-file map.js. Match surrounding patterns; no new frameworks/build steps.

## Security (the priority for a public legacy app)
- NO secrets, API keys, or ArcGIS tokens committed in client-side JS/HTML — flag any hardcoded
  credential or `token=`. The Firebase web `apiKey` (index.html:24) is designed to be public — don't
  false-flag it.
- Firebase Storage download links embed `?token=<uuid>` (index.html ~549-562). These are share
  tokens, not app secrets, but confirm any new one points only to an intentionally-public asset.
- XSS / DOM injection: popups/panels are built from feature attributes via `innerHTML` — escape any
  new field rendered from a Feature/API response or a URL query param.

## Correctness
- Fail loud on fetch/query errors — don't silently blank the map; handle empty/failed responses.

## Data ownership
- Wetlands/NWI data changes route to the data owner (Nate) — flag data/schema edits for his sign-off.

## Review scope & severity
- Skip (don't post findings): nothing to skip — ArcGIS and other libs load from the CDN; no vendored bundles, minified files, or lockfiles are committed.
- Blocking here (not a nit): merge to `master` auto-deploys hosting to prod; no server-side SQL surface (the Cloud Function only mints ArcGIS tokens), so a committed credential / API key / token is the blocker.
