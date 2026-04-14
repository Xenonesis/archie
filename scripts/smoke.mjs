const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const ENDPOINT = `${BASE_URL}/api/generate-article`;
const FORWARDED_IP = process.env.SMOKE_CLIENT_IP || '198.51.100.77';
const INTERNAL_KEY = process.env.SMOKE_INTERNAL_API_KEY;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function postJson(body) {
  const headers = {
    'Content-Type': 'application/json',
    'x-forwarded-for': FORWARDED_IP,
  };

  if (INTERNAL_KEY) {
    headers['x-internal-api-key'] = INTERNAL_KEY;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return { response, data };
}

async function run() {
  console.log(`[smoke] Testing ${ENDPOINT}`);

  const validPayload = {
    prompt: 'Write a concise article about edge computing benefits.',
    topic: 'edge computing',
    tone: 'Professional',
  };

  const happy = await postJson(validPayload);
  assert(happy.response.status === 200, `[happy] expected 200, got ${happy.response.status}`);
  assert(typeof happy.data.article === 'string', '[happy] expected article string in response');
  console.log('[smoke] Happy path: OK');

  const invalid = await postJson({ prompt: 'a', topic: '', tone: 'Professional' });
  assert(invalid.response.status === 400, `[invalid] expected 400, got ${invalid.response.status}`);
  assert(invalid.data.code === 'BAD_REQUEST', `[invalid] expected BAD_REQUEST, got ${invalid.data.code}`);
  console.log('[smoke] Invalid input path: OK');

  const remaining = Number.isFinite(happy.data?.rateLimit?.remaining)
    ? Math.max(1, Math.min(happy.data.rateLimit.remaining + 1, 20))
    : 6;

  let saw429 = false;
  for (let i = 0; i < remaining; i += 1) {
    const result = await postJson(validPayload);
    if (result.response.status === 429) {
      saw429 = true;
      break;
    }
  }

  assert(saw429, '[rate-limit] expected at least one 429 response');
  console.log('[smoke] Rate-limit path: OK');

  console.log('[smoke] All checks passed');
}

run().catch((error) => {
  console.error('[smoke] Failed:', error.message);
  process.exit(1);
});
