# n8n Website Runtime Stabilization

This app provides a frontend article generator and a Next.js Route Handler proxy that forwards requests to n8n.

## Architecture

- Frontend: `src/app/page.tsx`
- Backend proxy route: `src/app/api/generate-article/route.ts`
- Upstream target: n8n webhook

Expected integration:

- Webhook URL: `https://asnn.app.n8n.cloud/webhook/article-generator`
- n8n auth: no auth (optional bearer token still supported via env)
- Output: plain article text

## Environment Variables

Configure in `.env.local`:

```bash
# Required for production. Must be an n8n webhook URL (path must include /webhook/).
N8N_WEBHOOK_URL=https://asnn.app.n8n.cloud/webhook/article-generator

# Optional bearer token for webhook endpoint if enabled on n8n.
N8N_WEBHOOK_KEY=

# Optional internal guard. If set, client must provide x-internal-api-key.
INTERNAL_API_KEY=

# Optional frontend-provided key for INTERNAL_API_KEY checks.
NEXT_PUBLIC_CLIENT_API_KEY=

# Optional rate limit tuning
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW_MS=60000

# Optional webhook timeout (milliseconds)
WEBHOOK_TIMEOUT_MS=20000
```

Important:

- Do not use n8n workflow editor URLs as `N8N_WEBHOOK_URL`.
- Valid target is the webhook URL only (`/webhook/...`).

## Local Development

1. Install dependencies:

```bash
npm install
```

1. Start dev server:

```bash
npm run dev
```

1. Open:

- `http://localhost:3000`

## API Contract

`POST /api/generate-article`

Request body:

```json
{
  "prompt": "string (5-500 chars)",
  "topic": "string (optional, <=100 chars)",
  "tone": "string (optional, <=40 chars)"
}

Notes:

- Send `prompt` when you want exact control.
- If `prompt` is empty/short but `topic` is provided, the API derives a prompt automatically.
- At least one of `prompt` or `topic` is required.
```

Success response:

```json
{
  "article": "plain text article",
  "rateLimit": { "remaining": 4, "reset": 1713091200000 }
}
```

Error response:

```json
{
  "error": "human-readable message",
  "code": "BAD_REQUEST | UNAUTHORIZED | RATE_LIMIT_EXCEEDED | CONFIG_ERROR | UPSTREAM_ERROR | UPSTREAM_TIMEOUT | UPSTREAM_INVALID_JSON | INTERNAL_ERROR"
}
```

## Troubleshooting Matrix

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `401 UNAUTHORIZED` | `INTERNAL_API_KEY` set but client key missing/mismatch | Set `NEXT_PUBLIC_CLIENT_API_KEY` to same value or unset `INTERNAL_API_KEY` |
| `429 RATE_LIMIT_EXCEEDED` | Too many requests in rate window | Wait for `Retry-After` seconds or increase rate limits |
| `500 CONFIG_ERROR` | Invalid `N8N_WEBHOOK_URL` format/path | Use valid webhook URL, not workflow editor URL |
| `502 UPSTREAM_ERROR` | n8n returned non-2xx | Check n8n execution logs and webhook availability |
| `502 UPSTREAM_TIMEOUT` | n8n response took too long | Optimize n8n workflow or retry |
| `502 UPSTREAM_INVALID_JSON` | n8n returned malformed JSON with JSON content-type | Return valid JSON from n8n or plain text |
| Empty/short article | Upstream returned no content | Improve prompt specificity, verify n8n output mapping |

## Verification Checklist

1. Dev runtime boot:

- `npm run dev` starts cleanly and page loads.

1. API happy path:

- Valid `POST /api/generate-article` returns `200` with `article` text.

1. Negative paths:

- Invalid input -> `400`
- Rate limit -> `429`
- Upstream non-2xx -> `502`
- Upstream timeout/network failure -> `502`/`500`

1. Browser flow:

- Submit prompt from UI
- Assistant article appears as readable plain text
- Actionable error messages appear for failures

1. Deployment parity:

- Deployment env values match local `.env.local` expectations.

## Smoke Test

Run quick runtime checks against a running local app:

```bash
npm run smoke
```

Optional env overrides:

- `SMOKE_BASE_URL` (default: `http://localhost:3000`)
- `SMOKE_INTERNAL_API_KEY` (if internal key auth is enabled)
- `SMOKE_CLIENT_IP` (default fixed IP for deterministic rate-limit check)
