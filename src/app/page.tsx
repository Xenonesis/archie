"use client";

import { FormEvent, useMemo, useRef, useEffect, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────── */
type ChatMessage = { role: "user" | "assistant" | "system"; text: string };

type ResponseFromApi = {
  article?: string;
  rateLimit?: { remaining: number; reset: number };
  error?: string;
  code?: string;
  retryAfter?: number;
};

/* ─── Error mapper ───────────────────────────────────────────────────── */
function mapApiError(status: number, payload: ResponseFromApi): string {
  if (status === 400) return payload.error ?? "Invalid request. Please check your inputs.";
  if (status === 401) return "Unauthorized. Internal API key is missing or invalid.";
  if (status === 429) {
    if (typeof payload.retryAfter === "number")
      return `Rate limit reached. Please retry in ${payload.retryAfter} seconds.`;
    return "Rate limit reached. Please wait a moment and try again.";
  }
  if (status === 502) {
    if (payload.code === "UPSTREAM_TIMEOUT")
      return "The generation service timed out. Please retry in a few seconds.";
    if (payload.code === "UPSTREAM_INVALID_JSON")
      return "Received malformed data from generator. Check workflow response format.";
    return "Generator service is unavailable or returned an error.";
  }
  if (status >= 500) return "Server error while generating article. Please try again.";
  return payload.error ?? "Unexpected error while generating article.";
}

/* ─── Role badge config ──────────────────────────────────────────────── */
const ROLE_META = {
  assistant: { label: "AI", color: "#c96442" },
  user:      { label: "You", color: "var(--text-secondary)" },
  system:    { label: "System", color: "var(--text-tertiary)" },
} as const;

/* ─── Tone options ───────────────────────────────────────────────────── */
const TONES = ["Professional", "Friendly", "Conversational", "Persuasive", "Academic", "Creative"] as const;

/* ─── Main component ─────────────────────────────────────────────────── */
export default function Home() {
  const [prompt, setPrompt]   = useState("");
  const [topic, setTopic]     = useState("");
  const [tone, setTone]       = useState<string>("Professional");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      text: "Welcome! Fill in a topic or write a custom prompt below, then click Generate to create an article.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const charCount = useMemo(() => prompt.length, [prompt]);
  const outputRef = useRef<HTMLDivElement>(null);

  /* Scroll to latest message */
  useEffect(() => {
    if (messages.length > 1 && outputRef.current) {
      outputRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages]);

  /* ─── Submit ─────────────────────────────────────────────────────── */
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanPromptInput = prompt.trim();
    const cleanTopic       = topic.trim();
    const cleanTone        = tone.trim();

    if (!cleanPromptInput && !cleanTopic) {
      setError("Please enter a topic or write a prompt to generate an article.");
      return;
    }
    if (cleanPromptInput.length > 500) {
      setError("Prompt cannot exceed 500 characters.");
      return;
    }

    const cleanPrompt = cleanPromptInput.length >= 5 ? cleanPromptInput : "";

    setLoading(true);
    const summary =
      cleanPrompt || `Topic: ${cleanTopic}${cleanTone ? ` · Tone: ${cleanTone}` : ""}`;
    setMessages((prev) => [...prev, { role: "user", text: summary }]);

    try {
      const clientApiKey = process.env.NEXT_PUBLIC_CLIENT_API_KEY;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (clientApiKey) headers["x-internal-api-key"] = clientApiKey;

      const response = await fetch("/api/generate-article", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: cleanPrompt, topic: cleanTopic, tone: cleanTone }),
      });

      let data: ResponseFromApi = {};
      try {
        data = (await response.json()) as ResponseFromApi;
      } catch {
        data = { error: "Invalid JSON response from server." };
      }

      if (!response.ok || data.error) {
        setError(mapApiError(response.status, data));
        return;
      }
      if (!data.article?.trim()) {
        setError("Generator returned empty content. Please retry.");
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.article as string }]);
      setPrompt("");

      if (data.rateLimit?.remaining !== undefined && data.rateLimit.remaining <= 1) {
        setError("Approaching rate limit. Slow down to avoid throttling.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error: unable to reach article generator.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Reset ──────────────────────────────────────────────────────── */
  const handleReset = () => {
    setPrompt("");
    setTopic("");
    setTone("Professional");
    setError(null);
  };

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 80px",
      }}
    >
      {/* ── Topbar ── */}
      <header
        style={{
          width: "100%",
          maxWidth: 760,
          padding: "28px 0 0",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            {/* Anthropic-style logo mark */}
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--brand)",
                flexShrink: 0,
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 500,
                fontFamily: "var(--font-serif)",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              AI Article Forge
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--text-tertiary)",
              lineHeight: 1.5,
            }}
          >
            Generate polished articles with your n8n-powered AI workflow.
          </p>
        </div>

        {/* Rate limit badge */}
        <span
          title="Maximum 5 requests per minute"
          style={{
            flexShrink: 0,
            marginTop: 4,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "4px 10px",
            background: "var(--bg-elevated)",
          }}
        >
          5 req / min
        </span>
      </header>

      {/* ── Divider ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          height: 1,
          background: "var(--border-subtle)",
          margin: "20px 0 28px",
        }}
      />

      {/* ── Form card ── */}
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden",
        }}
      >
        <form onSubmit={handleSubmit} noValidate>
          {/* Card header */}
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-elevated)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "0.02em",
              }}
            >
              New Article
            </p>
          </div>

          {/* Fields */}
          <div style={{ padding: "24px", display: "grid", gap: 20 }}>
            {/* Topic + Tone row */}
            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "1fr auto",
              }}
            >
              {/* Topic */}
              <div>
                <label htmlFor="topic-input">
                  <span className="label-text">Topic</span>
                </label>
                <input
                  id="topic-input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., next-generation AR experiences"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Tone */}
              <div style={{ minWidth: 160 }}>
                <label htmlFor="tone-select">
                  <span className="label-text">Tone</span>
                </label>
                <select
                  id="tone-select"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label htmlFor="prompt-textarea">
                <span className="label-text">
                  Custom Prompt
                  <span
                    style={{
                      marginLeft: 6,
                      fontWeight: 400,
                      letterSpacing: 0,
                      textTransform: "none",
                      color: "var(--text-placeholder)",
                    }}
                  >
                    (optional if Topic is filled)
                  </span>
                </span>
              </label>
              <textarea
                id="prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Frame a 500-word explainer on why edge computing is the future of cloud infrastructure..."
                rows={5}
                style={{ resize: "vertical" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: charCount > 450 ? "var(--error-text)" : "var(--text-placeholder)",
                    transition: "color 0.15s",
                  }}
                >
                  {charCount} / 500
                </span>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="animate-in"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 14px",
                  background: "var(--error-bg)",
                  border: "1px solid var(--error-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  color: "var(--error-text)",
                  lineHeight: 1.5,
                }}
              >
                {/* icon */}
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11" r="0.75" fill="currentColor" />
                </svg>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <span className="loading-spinner" aria-hidden="true" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg
                      aria-hidden="true"
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                    >
                      <path
                        d="M1 7.5L7.5 1L14 7.5M7.5 2v11"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Generate Article
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary"
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Messages ── */}
      {messages.length > 0 && (
        <div
          ref={outputRef}
          role="log"
          aria-live="polite"
          style={{
            width: "100%",
            maxWidth: 760,
            marginTop: 32,
            display: "grid",
            gap: 16,
          }}
        >
          {messages.map((msg, idx) => {
            const meta = ROLE_META[msg.role];
            const isAssistant = msg.role === "assistant";
            const isSystem    = msg.role === "system";

            return (
              <article
                key={`${msg.role}-${idx}`}
                className="animate-in card"
                style={{
                  padding: "0",
                  overflow: "hidden",
                  animationDelay: `${idx * 0.04}s`,
                  opacity: isSystem ? 0.8 : 1,
                }}
              >
                {/* Message header */}
                <header
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: isAssistant
                      ? "var(--brand-subtle)"
                      : "var(--bg-elevated)",
                  }}
                >
                  {/* Role dot */}
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: meta.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: isAssistant ? "var(--brand)" : "var(--text-tertiary)",
                    }}
                  >
                    {meta.label}
                  </span>

                  {/* Copy button for assistant */}
                  {isAssistant && (
                    <button
                      type="button"
                      aria-label="Copy article to clipboard"
                      title="Copy to clipboard"
                      onClick={() =>
                        navigator.clipboard?.writeText(msg.text).catch(() => {})
                      }
                      style={{
                        marginLeft: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--text-tertiary)",
                        background: "transparent",
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-sm)",
                        padding: "3px 8px",
                        cursor: "pointer",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseOver={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "var(--bg-hover)";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "var(--text-primary)";
                      }}
                      onMouseOut={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "transparent";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "var(--text-tertiary)";
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <rect x="1" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M3.5 3V2a1 1 0 0 1 1-1h4.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      Copy
                    </button>
                  )}
                </header>

                {/* Message body */}
                <p
                  style={{
                    margin: 0,
                    padding: "16px 18px",
                    fontSize: isAssistant ? 14.5 : 13.5,
                    lineHeight: isAssistant ? 1.75 : 1.6,
                    color: isSystem
                      ? "var(--text-tertiary)"
                      : "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: isAssistant ? "var(--font-sans)" : undefined,
                  }}
                >
                  {msg.text}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <footer
        style={{
          width: "100%",
          maxWidth: 760,
          marginTop: 48,
          paddingTop: 20,
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-placeholder)" }}>
          AI Article Forge · Powered by n8n
        </span>
        <span style={{ fontSize: 12, color: "var(--text-placeholder)" }}>
          Responses may not be accurate. Always review generated content.
        </span>
      </footer>
    </main>
  );
}
