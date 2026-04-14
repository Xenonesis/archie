import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_WEBHOOK_URL = 'https://asnn.app.n8n.cloud/webhook/article-generator';
const RATE_LIMIT_MAX = toPositiveInteger(process.env.RATE_LIMIT_MAX, 5);
const RATE_LIMIT_WINDOW_MS = toPositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? DEFAULT_WEBHOOK_URL;
const N8N_WEBHOOK_KEY = process.env.N8N_WEBHOOK_KEY;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const WEBHOOK_TIMEOUT_MS = toPositiveInteger(process.env.WEBHOOK_TIMEOUT_MS, 20_000);
const RUNTIME_CONFIG_ERROR = validateRuntimeConfig();

const ALLOWED_TONES = new Set([
  'professional',
  'friendly',
  'conversational',
  'persuasive',
  'academic',
  'creative',
]);

const BLOCKED_PATTERNS = [
  /\b(ignore (previous|all|prior|above|system) (instructions?|prompts?|context))\b/i,
  /\b(jailbreak|dan mode|developer mode|god mode)\b/i,
  /\b(reveal|expose|show|output|print|display|repeat|echo)\b.{0,40}\b(system prompt|instructions?|api key|secret|password|token)\b/i,
  /\b(act as|pretend to be|you are now|from now on you are)\b.{0,30}\b(admin|root|superuser|unrestricted|uncensored)\b/i,
  /<\s*(script|iframe|object|embed|form|input|link|style)[^>]*>/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,
];

const rateMap = new Map<string, { count: number; resetAt: number }>();

type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CONFIG_ERROR'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_INVALID_JSON'
  | 'INTERNAL_ERROR';

function toPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function validateRuntimeConfig(): string | null {
  try {
    const url = new URL(N8N_WEBHOOK_URL);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return 'N8N_WEBHOOK_URL must use http or https.';
    }
    if (!url.pathname.includes('/webhook/')) {
      return 'N8N_WEBHOOK_URL must target an n8n webhook endpoint (path containing /webhook/).';
    }
    if (url.pathname.includes('/workflow/')) {
      return 'N8N_WEBHOOK_URL cannot be a workflow editor URL. Use the webhook URL from n8n.';
    }
  } catch {
    return 'N8N_WEBHOOK_URL is not a valid URL.';
  }
  return null;
}

function errorResponse(
  status: number,
  code: ApiErrorCode,
  error: string,
  extra?: Record<string, number | string>
) {
  return NextResponse.json({ error, code, ...extra }, { status });
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, reset: now + RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, reset: entry.resetAt };
  }
  entry.count += 1;
  rateMap.set(ip, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, reset: entry.resetAt };
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return stripHtml(value.replace(/\s+/g, ' ').trim());
}

function checkPromptGuardrails(text: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return 'Your prompt contains content that is not allowed. Please revise and try again.';
    }
  }
  return null;
}

function normalizeArticleText(value: string): string {
  const normalizedNewlines = value.replace(/\r\n/g, '\n');
  const trimmedLines = normalizedNewlines
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n');
  return trimmedLines.replace(/\n{3,}/g, '\n\n').trim();
}

function extractArticleText(data: unknown): string | null {
  if (typeof data === 'string') {
    const normalized = normalizeArticleText(data);
    return normalized || null;
  }
  if (Array.isArray(data)) {
    const collected = data
      .map((entry) => extractArticleText(entry))
      .filter((entry): entry is string => Boolean(entry));
    if (collected.length > 0) return collected.join('\n\n');
    return null;
  }
  if (!data || typeof data !== 'object') return null;
  const candidateKeys = ['article', 'text', 'content', 'output', 'result', 'message', 'data', 'response', 'body'];
  const record = data as Record<string, unknown>;
  for (const key of candidateKeys) {
    const value = extractArticleText(record[key]);
    if (value) return value;
  }
  return normalizeArticleText(JSON.stringify(data, null, 2));
}

function buildLocalFallbackArticle(input: { prompt: string; topic: string; tone: string }): string {
  const topic = input.topic || 'the requested topic';
  const tone = input.tone || 'professional';

  return normalizeArticleText(
    `# ${topic}

${topic} is increasingly important in modern software and product strategy. In a ${tone} context, the key is balancing technical quality, delivery speed, and long-term maintainability. Teams that define clear goals and measurable outcomes early usually make better architecture and tooling decisions.

From a practical standpoint, successful implementation starts with explicit requirements, simple first versions, and iterative validation. Instead of chasing perfect design on day one, effective teams ship small slices, collect feedback, and evolve the solution with data. This approach reduces risk and improves alignment between engineering and business priorities.

A second critical factor is operational reliability. Production systems need visibility, error handling, and predictable performance under load. That means monitoring core metrics, handling edge cases, and creating clear runbooks for common failures. Reliability is not a one-time task; it is an ongoing discipline that should be built into development workflows.

Another useful lens is developer experience. Clear interfaces, stable contracts, and practical documentation dramatically improve delivery velocity. When engineers can understand and change systems quickly, organizations can respond faster to market needs while keeping quality high.`
  );
}

function buildLocalFallbackCommentary(input: { prompt: string }): string {
  const context = input.prompt || `Write an article.`;
  return `Based on your request: "${context}", a strong next step is to define concrete success criteria, implement incrementally, and verify outcomes through repeatable tests. This keeps execution focused and ensures the final result is both useful and sustainable.`;
}

export async function POST(request: Request) {
  if (RUNTIME_CONFIG_ERROR) {
    console.error('[generate-article] Invalid runtime configuration:', RUNTIME_CONFIG_ERROR);
    return errorResponse(500, 'CONFIG_ERROR', 'Server configuration error.', { details: RUNTIME_CONFIG_ERROR });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(ip);

  if (!limit.allowed) {
    const retryAfterSeconds = Math.ceil((limit.reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED', retryAfter: retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_REQUEST', 'Invalid JSON body.');
  }

  if (typeof body !== 'object' || body === null) {
    return errorResponse(400, 'BAD_REQUEST', 'Request body must be an object.');
  }

  const bodyObject = body as Record<string, unknown>;
  const promptInput = cleanText(typeof bodyObject.prompt === 'string' ? bodyObject.prompt : '');
  const topic = cleanText(typeof bodyObject.topic === 'string' ? bodyObject.topic : '');
  const rawTone = cleanText(typeof bodyObject.tone === 'string' ? bodyObject.tone : '');
  const tone = ALLOWED_TONES.has(rawTone.toLowerCase()) ? rawTone : 'Professional';

  if (promptInput.length > 500) {
    return errorResponse(400, 'BAD_REQUEST', 'prompt cannot exceed 500 chars.');
  }

  if (topic.length > 100) {
    return errorResponse(400, 'BAD_REQUEST', 'topic max length is 100 chars.');
  }

  const promptGuardError = checkPromptGuardrails(promptInput + ' ' + topic);
  if (promptGuardError) {
    return errorResponse(400, 'BAD_REQUEST', promptGuardError);
  }

  const apiKey = request.headers.get('x-internal-api-key');
  if (INTERNAL_API_KEY && apiKey !== INTERNAL_API_KEY) {
    return errorResponse(401, 'UNAUTHORIZED', 'Invalid internal API key.');
  }

  const prompt = promptInput.length >= 5 ? promptInput : '';

  if (!prompt && !topic) {
    return errorResponse(
      400,
      'BAD_REQUEST',
      'Provide either a prompt (min 5 chars) or a topic to generate an article.'
    );
  }

  const effectivePrompt = prompt || `Write a ${tone || 'professional'} article about ${topic}.`;

  const payload = {
    prompt: effectivePrompt,
    chatInput: effectivePrompt,
    input: effectivePrompt,
    text: effectivePrompt,
    query: effectivePrompt,
    topic,
    tone,
    source: 'nextjs-chatbot-proxy',
  };

  try {
    const startedAt = Date.now();
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_WEBHOOK_KEY ? { Authorization: `Bearer ${N8N_WEBHOOK_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    };

    const response = await fetch(N8N_WEBHOOK_URL, requestOptions);
    const text = await response.text();
    const elapsedMs = Date.now() - startedAt;
    const contentType = response.headers.get('content-type') ?? '';

    console.info(
      '[generate-article] upstream status=%d durationMs=%d contentType=%s',
      response.status,
      elapsedMs,
      contentType || 'unknown'
    );

    if (!response.ok) {
      return errorResponse(502, 'UPSTREAM_ERROR', 'n8n webhook returned a non-success status.', {
        upstreamStatus: response.status,
      });
    }

    if (contentType.includes('application/json')) {
      if (!text.trim()) {
        const fallbackArticle = buildLocalFallbackArticle({ prompt: effectivePrompt, topic, tone });
        const fallbackCommentary = buildLocalFallbackCommentary({ prompt: effectivePrompt });
        return NextResponse.json({
          article: fallbackArticle,
          commentary: fallbackCommentary,
          fallback: true,
          warning: 'n8n returned empty content; local fallback article was generated.',
          rateLimit: { remaining: limit.remaining, reset: limit.reset },
        });
      }

      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        return errorResponse(502, 'UPSTREAM_INVALID_JSON', 'n8n webhook returned invalid JSON.');
      }

      const article = extractArticleText(data);
      let commentary = undefined;
      // Also extract commentary if the data has it.
      if (data && typeof data === 'object' && 'commentary' in data) {
         commentary = String((data as any).commentary);
      }

      if (!article) {
        const fallbackArticle = buildLocalFallbackArticle({ prompt: effectivePrompt, topic, tone });
        const fallbackCommentary = buildLocalFallbackCommentary({ prompt: effectivePrompt });
        return NextResponse.json({
          article: fallbackArticle,
          commentary: fallbackCommentary,
          fallback: true,
          warning: 'n8n response did not include article text; local fallback article was generated.',
          rateLimit: { remaining: limit.remaining, reset: limit.reset },
        });
      }

      return NextResponse.json({ article, commentary, rateLimit: { remaining: limit.remaining, reset: limit.reset } });
    }

    const article = normalizeArticleText(String(text));
    if (!article) {
      const fallbackArticle = buildLocalFallbackArticle({ prompt: effectivePrompt, topic, tone });
      const fallbackCommentary = buildLocalFallbackCommentary({ prompt: effectivePrompt });
      return NextResponse.json({
        article: fallbackArticle,
        commentary: fallbackCommentary,
        fallback: true,
        warning: 'n8n plain-text response was empty; local fallback article was generated.',
        rateLimit: { remaining: limit.remaining, reset: limit.reset },
      });
    }

    return NextResponse.json({
      article,
      rateLimit: { remaining: limit.remaining, reset: limit.reset },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return errorResponse(502, 'UPSTREAM_TIMEOUT', 'n8n webhook timed out. Please retry.');
    }
    if (error instanceof TypeError) {
      return errorResponse(502, 'UPSTREAM_ERROR', 'n8n webhook network failure. Please retry.');
    }
    console.error('[generate-article] Internal error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Internal server error.');
  }
}
