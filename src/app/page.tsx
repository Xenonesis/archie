"use client";

import { FormEvent, useMemo, useRef, useEffect, useState } from "react";
import Link from "next/link";

type ChatMessage = { role: "user" | "assistant" | "system"; text: string; commentary?: string };

type ResponseFromApi = {
  article?: string;
  commentary?: string;
  rateLimit?: { remaining: number; reset: number };
  error?: string;
  code?: string;
  retryAfter?: number;
};

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
    if (payload.code === "UPSTREAM_EMPTY_RESPONSE")
      return "n8n workflow ran but returned empty output. In n8n, add/configure a Respond to Webhook node and return JSON like { article: \"...\" }.";
    return "Generator service is unavailable or returned an error.";
  }
  if (status >= 500) return "Server error while generating article. Please try again.";
  return payload.error ?? "Unexpected error while generating article.";
}

const ROLE_META = {
  assistant: { label: "AI", color: "#c96442" },
  user: { label: "You", color: "var(--text-secondary)" },
  system: { label: "System", color: "var(--text-tertiary)" },
} as const;

const TONES = ["Professional", "Friendly", "Conversational", "Persuasive", "Academic", "Creative"] as const;

void ROLE_META;

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [thinkingState, setThinkingState] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [feedbackIdx, setFeedbackIdx] = useState<Record<number, "up" | "down" | null>>({});

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);

  const charCount = useMemo(() => inputValue.length, [inputValue]);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [lastPrompt, setLastPrompt] = useState<{ prompt: string; topic: string; tone: string } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages, loading, thinkingState]);

  useEffect(() => {
    if (loading) {
      let step = 1;
      const interval = setInterval(() => {
        step++;
        if (step > 3) clearInterval(interval);
        setThinkingState(step);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setThinkingState(0);
    }
  }, [loading]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const callApi = async (promptPayload: { prompt: string; topic: string; tone: string }) => {
    setLoading(true);
    setError(null);
    try {
      const clientApiKey = process.env.NEXT_PUBLIC_CLIENT_API_KEY;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (clientApiKey) headers["x-internal-api-key"] = clientApiKey;

      const response = await fetch("/api/generate-article", {
        method: "POST",
        headers,
        body: JSON.stringify(promptPayload),
      });

      let data: ResponseFromApi = {};
      try {
        data = (await response.json()) as ResponseFromApi;
      } catch {
        data = { error: "Invalid JSON response from server." };
      }

      if (!response.ok || data.error) {
        setMessages((prev) => [...prev, { role: "system", text: `Error: ${mapApiError(response.status, data)}` }]);
        return;
      }
      if (!data.article?.trim()) {
        setMessages((prev) => [...prev, { role: "system", text: "Generator returned empty content. Please retry." }]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.article as string, commentary: data.commentary }]);

      if (data.rateLimit?.remaining !== undefined && data.rateLimit.remaining <= 1) {
        setMessages((prev) => [...prev, { role: "system", text: "Approaching rate limit. Slow down to avoid throttling." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "system", text: "Network error: unable to reach article generator." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent | React.KeyboardEvent) => {
    event.preventDefault();
    if (loading) return;
    setError(null);

    const cleanInput = inputValue.trim();
    const cleanTone = tone.trim();

    if (!cleanInput) return;
    if (cleanInput.length > 500) {
      setError("Prompt cannot exceed 500 characters.");
      return;
    }

    const isShort = cleanInput.length < 20;
    const cleanTopic = isShort ? cleanInput : "";
    const cleanPrompt = isShort ? "" : cleanInput;

    const payload = { prompt: cleanPrompt, topic: cleanTopic, tone: cleanTone };
    setLastPrompt(payload);

    setMessages((prev) => [...prev, { role: "user", text: cleanInput }]);
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    await callApi(payload);
  };

  const handleRegenerate = async (assistantIdx: number) => {
    if (loading || !lastPrompt) return;
    setMessages((prev) => prev.slice(0, assistantIdx));
    await callApi(lastPrompt);
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleFeedback = (idx: number, vote: "up" | "down") => {
    setFeedbackIdx((prev) => ({ ...prev, [idx]: prev[idx] === vote ? null : vote }));
  };

  const getThinkingText = (state: number) => {
    if (state === 1) return "Analyzing request...";
    if (state === 2) return "Gathering constraints & defining tone...";
    if (state >= 3) return "Structuring draft & writing content...";
    return "Thinking...";
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden font-sans transition-colors duration-200">
      <aside
        className={`${sidebarOpen ? "w-[260px] translate-x-0" : "w-0 -translate-x-full md:w-0 md:translate-x-0 hidden md:flex"}
        ${sidebarOpen ? "absolute" : "hidden"} md:relative z-50 h-screen transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-[var(--bg-elevated)] border-r border-[var(--border-subtle)] flex-col shadow-[var(--shadow-sm)]`}
      >
        <div className="flex flex-col h-full bg-[var(--bg-elevated)] w-[260px] shrink-0">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand)] text-[#fff] font-serif italic font-bold shadow-sm transform transition-transform hover:scale-105 select-none">
                A
              </div>
              <span className="font-serif font-medium text-[18px] tracking-tight text-[var(--text-primary)] select-none">Article Forge</span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
              className="p-1.5 -mr-1.5 hover:bg-[var(--bg-hover)] rounded-md transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          </div>

          <div className="p-3 shrink-0">
            <button
              onClick={() => { setMessages([]); setError(null); setLastPrompt(null); setFeedbackIdx({}); }}
              className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-base)] border border-[var(--border-default)] hover:border-[var(--brand)] rounded-xl w-full text-left transition-all group shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand)]"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
              <span className="font-medium text-[14px] text-[var(--text-primary)] relative top-[0.5px]">Start New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
            <div className="text-[11px] font-bold text-[var(--text-placeholder)] mb-3 px-2 uppercase tracking-wider select-none">Recent Workspace</div>

            <div className="space-y-0.5">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-hover)] rounded-xl text-[13.5px] text-[var(--text-secondary)] transition-colors group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--text-placeholder)] group-hover:text-[var(--text-secondary)] transition-colors"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                <span className="truncate text-left relative top-[0.5px]">Understanding Edge Computing</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-hover)] rounded-xl text-[13.5px] text-[var(--text-secondary)] transition-colors group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--text-placeholder)] group-hover:text-[var(--text-secondary)] transition-colors"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                <span className="truncate text-left relative top-[0.5px]">AR Experiences in 2026</span>
              </button>

              {messages.length > 0 && messages[messages.length - 1].role === "user" && (
                <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl text-[13.5px] font-medium transition-colors shadow-sm mt-3 relative">
                  <span className="absolute left-0 w-1 h-5 bg-[var(--brand)] rounded-r-full -ml-[1px]" />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--brand)] ml-1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <span className="truncate text-left relative top-[0.5px]">Current Draft</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0 space-y-1">
            <Link
              href="/about"
              className="flex items-center w-full gap-3 px-3 py-2.5 hover:bg-[var(--bg-hover)] rounded-xl text-[14px] font-medium text-[var(--text-secondary)] transition-colors group"
            >
              <div className="flex items-center justify-center p-1.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              </div>
              <span className="relative top-[0.5px]">About</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="flex items-center w-full gap-3 px-3 py-2.5 hover:bg-[var(--bg-hover)] rounded-xl text-[14px] font-medium text-[var(--text-secondary)] transition-colors group"
            >
              {theme === "light" ? (
                <>
                  <div className="flex items-center justify-center p-1.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                  </div>
                  <span className="relative top-[0.5px]">Dark Mode</span>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center p-1.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
                  </div>
                  <span className="relative top-[0.5px]">Light Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen relative overflow-hidden transition-all duration-300 bg-[var(--bg-base)]">
        {sidebarOpen && (
          <div
            className="absolute inset-0 z-40 bg-black/40 md:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <header className="flex items-center gap-3 px-4 py-3 shrink-0 select-none border-b border-transparent">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /></svg>
          </button>

          <div className={`flex items-center gap-2 cursor-pointer transition-opacity ${sidebarOpen ? "md:opacity-0 md:pointer-events-none" : "opacity-100"}`}>
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--brand)] text-[#fff] font-serif italic font-bold shadow-sm">
              A
            </div>
            <span className="font-serif font-medium text-[16px] tracking-tight text-[var(--text-primary)]">Article Forge</span>
          </div>

          <div className="ml-auto">
            <Link
              href="/about"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              About
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 pb-48">
          <div ref={outputRef} className="max-w-3xl mx-auto flex flex-col gap-6 pt-4 pb-10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 gap-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)] font-serif italic font-bold text-2xl shadow-sm">
                  A
                </div>
                <h1 className="text-2xl font-serif font-medium text-[var(--text-primary)]">What kind of article should we write?</h1>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm">Type a topic or a detailed prompt below. Choose a tone, then hit send.</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isSystem = msg.role === "system";

              return (
                <div key={idx} className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-up duration-300 w-full`}>
                  {!isUser && !isSystem && (
                    <div className="flex items-center justify-center w-8 h-8 rounded mt-1 shrink-0 bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand)] shadow-sm">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                    </div>
                  )}
                  {isSystem && (
                    <div className="flex items-center justify-center w-8 h-8 rounded mt-1 shrink-0 bg-[var(--error-bg)] text-[var(--error-text)] shadow-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                    </div>
                  )}

                  <div className={`flex flex-col flex-1 max-w-[85%] ${isUser ? "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] px-4 py-3 rounded-2xl shadow-sm" : "w-full"}`}>
                    
                    {isSystem ? (
                      <div className="prose prose-sm md:prose-base leading-relaxed break-words whitespace-pre-wrap max-w-none text-[var(--error-text)]">
                        {msg.text}
                      </div>
                    ) : isUser ? (
                       <div className="prose prose-sm md:prose-base leading-relaxed break-words whitespace-pre-wrap max-w-none text-[var(--text-primary)]">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-4">
                        {msg.commentary && (
                          <div className="text-[14.5px] leading-relaxed text-[var(--text-primary)] animate-in fade-in slide-in-from-bottom-1 px-1">
                            {msg.commentary}
                          </div>
                        )}
                        <div className="rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl w-full flex flex-col font-sans transition-all duration-200">
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0 select-none">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-sm"></div>
                              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-sm"></div>
                              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-sm"></div>
                            </div>
                            <div className="flex items-center gap-2 opacity-90">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                              <span className="text-[12px] font-bold text-[var(--text-secondary)] tracking-wider uppercase font-mono">Article_Document.md</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              title="Copy Article"
                              onClick={() => handleCopy(msg.text, idx)}
                              className="text-[var(--text-tertiary)] hover:text-[var(--brand)] transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
                            >
                              {copiedIdx === idx ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                              )}
                            </button>
                            <div className="w-[1px] h-4 bg-[var(--border-default)] mx-1" />
                            <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-[var(--bg-hover)]" title="Edit Formatting">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <button className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-[var(--bg-hover)]" title="Preview Article">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </button>
                          </div>
                        </div>

                        <div className="p-5 overflow-auto text-[14.5px] leading-relaxed bg-[var(--bg-surface)]">
                           <div className="prose prose-sm md:prose-base max-w-none text-[var(--text-primary)] break-words whitespace-pre-wrap font-mono">
                             {msg.text}
                           </div>
                        </div>
                      </div>
                      </div>
                    )}

                    {!isUser && !isSystem && (
                      <div className="flex mt-2 gap-1.5 items-center text-[var(--text-tertiary)]">
                        <button
                          id={`copy-btn-${idx}`}
                          title={copiedIdx === idx ? "Copied!" : "Copy"}
                          className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${copiedIdx === idx ? "text-[var(--brand)]" : "hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}
                          onClick={() => handleCopy(msg.text, idx)}
                        >
                          {copiedIdx === idx ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                          )}
                        </button>

                        <button
                          id={`thumbs-up-btn-${idx}`}
                          title="Good response"
                          onClick={() => handleFeedback(idx, "up")}
                          className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${feedbackIdx[idx] === "up" ? "text-[var(--brand)] bg-[var(--brand-subtle)]" : "hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                        </button>

                        <button
                          id={`thumbs-down-btn-${idx}`}
                          title="Bad response"
                          onClick={() => handleFeedback(idx, "down")}
                          className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${feedbackIdx[idx] === "down" ? "text-[var(--error-text)] bg-[var(--error-bg)]" : "hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" /></svg>
                        </button>

                        <button
                          id={`share-btn-${idx}`}
                          title="Share"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({ text: msg.text }).catch(() => {});
                            } else {
                              navigator.clipboard?.writeText(msg.text).catch(() => {});
                            }
                          }}
                          className="flex items-center justify-center p-1.5 rounded-md hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                        </button>

                        <button
                          id={`regenerate-btn-${idx}`}
                          title="Regenerate"
                          onClick={() => handleRegenerate(idx)}
                          disabled={loading}
                          className="flex items-center justify-center p-1.5 rounded-md hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        </button>

                        <div className="relative">
                          <button
                            id={`more-btn-${idx}`}
                            title="More actions"
                            onClick={() => setOpenMenuIdx(openMenuIdx === idx ? null : idx)}
                            onBlur={() => setTimeout(() => setOpenMenuIdx(null), 200)}
                            className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${openMenuIdx === idx ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]" : "hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /><circle cx="5" cy="12" r="1.5" /></svg>
                          </button>
                          {openMenuIdx === idx && (
                            <div className="absolute left-0 bottom-full mb-2 w-48 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-[var(--shadow-md)] z-50 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden">
                              <button className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] w-full text-left transition-colors font-medium whitespace-nowrap group">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shrink-0 transition-colors"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                Provide Feedback
                              </button>
                              <button className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[var(--brand)] hover:bg-[var(--error-bg)] hover:text-[var(--error-text)] w-full text-left transition-colors font-medium whitespace-nowrap group">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 group-hover:text-[var(--error-text)] transition-colors"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                                Report Issue
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-4 justify-start animate-in fade-in">
                <div className="flex items-center justify-center w-8 h-8 rounded shrink-0 bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand)] shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin duration-3000"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                </div>
                <div className="flex flex-col w-full max-w-[85%]">
                  <details open className="group mt-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden w-fit shadow-sm">
                    <summary className="cursor-pointer list-none flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] select-none hover:bg-[var(--bg-hover)] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-open:rotate-90 transition-transform text-[var(--text-tertiary)]"><path d="m9 18 6-6-6-6" /></svg>
                      {getThinkingText(thinkingState)}
                    </summary>
                    <div className="px-4 pb-3 pt-1 text-sm text-[var(--text-tertiary)] border-t border-[var(--border-subtle)] animate-in fade-in slide-in-from-top-2">
                      {thinkingState >= 1 && <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-80" /><span className="animate-pulse">Parsing constraints...</span></div>}
                      {thinkingState >= 2 && <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-80" /><span className="animate-pulse">Curating terminology for {tone} tone...</span></div>}
                      {thinkingState >= 3 && <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-80" /><span className="animate-pulse">Synthesizing final draft...</span></div>}
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:absolute p-4 pb-6 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)] to-transparent pointer-events-none z-10">
          <div className="max-w-3xl mx-auto flex flex-col items-center pointer-events-auto">
            {error && (
              <div className="mb-3 px-4 py-2 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] text-sm font-medium flex items-center gap-2 shadow-sm animate-in zoom-in-95">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                {error}
                <button type="button" onClick={() => setError(null)} className="ml-2 hover:opacity-70">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            <div className="w-full relative shadow-[var(--shadow-md)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[rgba(201,100,66,0.12)] transition-all overflow-hidden flex flex-col">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to write an article..."
                className="w-full max-h-[40vh] p-4 pb-3 bg-transparent resize-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] text-[15px] leading-relaxed"
                rows={1}
              />

              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="appearance-none cursor-pointer bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg border border-[var(--border-subtle)] outline-none"
                    >
                      {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                  {charCount > 400 && (
                    <span className={`text-xs ml-2 ${charCount > 500 ? "text-[var(--error-text)] font-semibold" : "text-[var(--text-placeholder)]"}`}>
                      {charCount}/500
                    </span>
                  )}
                </div>

                <button
                  id="send-btn"
                  onClick={(e) => handleSubmit(e)}
                  disabled={loading || !inputValue.trim()}
                  className="flex items-center justify-center p-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[#fff] disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-placeholder)] disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {loading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 text-center text-xs text-[var(--text-placeholder)] font-medium">
              Article Forge can make mistakes. Please verify information.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
