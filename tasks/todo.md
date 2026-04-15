# Plan

- [ ] Audit repo for dev-only artifacts to remove (build outputs, local env, editor settings).
- [ ] Apply minimal production hardening (Next.js config + env hygiene) without changing behavior.
- [ ] Remove confirmed non-required files/directories.
- [ ] Verify lint/build or smoke checks if applicable.
- [ ] Commit and push to GitHub.

# Review

- [ ] Confirm app still runs locally and /api/generate-article returns article text.
- [ ] Confirm repo contains only required files (no build artifacts or local env files).
