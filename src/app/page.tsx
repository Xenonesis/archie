"use client";

import { FormEvent, useMemo, useState } from 'react';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; text: string };

type ResponseFromApi = {
  article?: string;
  rateLimit?: { remaining: number; reset: number };
  error?: string;
  code?: string;
  retryAfter?: number;
};

function mapApiError(status: number, payload: ResponseFromApi): string {
  if (status === 400) return payload.error ?? 'Invalid request. Please check your prompt and inputs.';
  if (status === 401) return 'Unauthorized request. Internal API key is missing or invalid.';
  if (status === 429) {
    if (typeof payload.retryAfter === 'number') {
      return `Rate limit reached. Retry in ${payload.retryAfter} seconds.`;
    }
    return 'Rate limit reached. Please wait and try again.';
  }
  if (status === 502) {
    if (payload.code === 'UPSTREAM_TIMEOUT') return 'n8n webhook timed out. Please retry in a few seconds.';
    if (payload.code === 'UPSTREAM_INVALID_JSON') return 'n8n returned malformed JSON. Check workflow response format.';
    return 'n8n webhook is unavailable or returned an error.';
  }
  if (status >= 500) return 'Server error while generating article. Please try again.';
  return payload.error ?? 'Unexpected error while generating article.';
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', text: 'Enter a prompt and click Generate for instant article output.' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = useMemo(() => prompt.length, [prompt]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanPromptInput = prompt.trim();
    const cleanTopic = topic.trim();
    const cleanTone = tone.trim();

    if (!cleanPromptInput && !cleanTopic) {
      setError('Add a topic or write a prompt to generate an article.');
      return;
    }

    const cleanPrompt = cleanPromptInput.length >= 5 ? cleanPromptInput : '';

    if (cleanPromptInput.length > 500) {
      setError('Prompt cannot exceed 500 characters.');
      return;
    }

    setLoading(true);
    const userRequestSummary = cleanPrompt || `Topic: ${cleanTopic}${cleanTone ? ` | Tone: ${cleanTone}` : ''}`;
    setMessages((prev) => [...prev, { role: 'user', text: userRequestSummary }]);

    try {
      const clientApiKey = process.env.NEXT_PUBLIC_CLIENT_API_KEY;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (clientApiKey) {
        headers['x-internal-api-key'] = clientApiKey;
      }

      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: cleanPrompt, topic: cleanTopic, tone: cleanTone }),
      });

      let data: ResponseFromApi = {};
      try {
        data = (await response.json()) as ResponseFromApi;
      } catch {
        data = { error: 'Invalid JSON response from server.' };
      }

      if (!response.ok || data.error) {
        setError(mapApiError(response.status, data));
        return;
      }

      if (!data.article || !data.article.trim()) {
        setError('Generator returned empty content. Please retry.');
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: data.article as string }]);
      setPrompt('');

      if (data.rateLimit?.remaining !== undefined && data.rateLimit.remaining <= 1) {
        setError('Approaching rate limit. Slow down to avoid throttling.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error: unable to reach article generator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,_rgba(52,211,153,0.2),_rgba(15,23,42,0.95)_44%)] text-cyan-50">
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cfilter id=\'a\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%\' height=\'100%\' filter=\'url(%23a)\' opacity=\'0.05\'/%3E%3C/svg%3E')]" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col p-6 md:p-10">
        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-cyan-400/30 bg-slate-900/30 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-cyan-50 sm:text-4xl">AI Article Forge</h1>
            <p className="mt-1 text-sm text-cyan-200/90">Server-side secured article generator with rate limiting under the hood.</p>
          </div>
          <kbd className="rounded-lg border border-cyan-300/40 bg-cyan-950/40 px-2 py-1 text-xs text-cyan-100">5 req/min</kbd>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-emerald-300/20 bg-slate-900/50 p-6 shadow-[0_12px_42px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <label className="space-y-2 text-sm">
            <span className="text-cyan-100">Topic</span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., next-generation AR experiences"
              className="w-full rounded-lg border border-cyan-400/40 bg-slate-950/50 px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-cyan-300 focus:border-cyan-200 focus:ring-2 focus:ring-cyan-500/40"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-cyan-100">Tone</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-cyan-400/40 bg-slate-950/50 px-3 py-2 text-sm text-cyan-50 outline-none focus:border-cyan-200 focus:ring-2 focus:ring-cyan-500/40"
            >
              <option>Professional</option>
              <option>Friendly</option>
              <option>Conversational</option>
              <option>Persuasive</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-cyan-100">Prompt</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Frame a 500-word explainer on why edge computing is the future..."
              rows={5}
              className="w-full resize-none rounded-lg border border-cyan-400/40 bg-slate-950/50 px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-cyan-300 focus:border-cyan-200 focus:ring-2 focus:ring-cyan-500/40"
            />
            <small className={`text-xs font-medium ${charCount > 450 ? 'text-rose-300' : 'text-cyan-200'}`}>
              {charCount}/500 characters (optional if Topic is filled)
            </small>
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate Article'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPrompt('');
                setTopic('');
                setTone('Professional');
                setError(null);
              }}
              className="rounded-xl border border-cyan-400/50 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-950/30"
            >
              Reset
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-rose-400/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</p>
          )}
        </form>

        <section className="mt-6 space-y-3">
          {messages.map((message, idx) => (
            <article
              key={`${message.role}-${idx}`}
              className={`rounded-2xl p-4 ${
                message.role === 'assistant'
                  ? 'bg-cyan-950/40 border border-cyan-300/20'
                  : message.role === 'user'
                  ? 'bg-slate-900/70 border border-cyan-500/30'
                  : 'bg-slate-800/65 border border-amber-400/20'
              }`}
            >
              <header className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-200/90">
                <span className={message.role === 'assistant' ? 'text-cyan-300' : message.role === 'user' ? 'text-emerald-200' : 'text-amber-200'}>
                  {message.role}
                </span>
                <span>•</span>
                <span>{message.role === 'assistant' ? 'AI' : message.role === 'user' ? 'You' : 'System'}</span>
              </header>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-100">
                {message.text}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
