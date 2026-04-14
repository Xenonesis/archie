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
  const [inputValue, setInputValue] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [thinkingState, setThinkingState] = useState(0); 
  const [error, setError] = useState<string | null>(null);

  const charCount = useMemo(() => inputValue.length, [inputValue]);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Scroll to latest message */
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages, loading, thinkingState]);

  /* Thinking progression */
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /* ─── Submit ─────────────────────────────────────────────────────── */
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

    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: cleanInput }]);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
        setMessages((prev) => [...prev, { role: "system", text: `Error: ${mapApiError(response.status, data)}` }]);
        return;
      }
      if (!data.article?.trim()) {
        setMessages((prev) => [...prev, { role: "system", text: "Generator returned empty content. Please retry." }]);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.article as string }]);

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

  const getThinkingText = (state: number) => {
    if (state === 1) return "Analyzing request...";
    if (state === 2) return "Gathering constraints & defining tone...";
    if (state >= 3) return "Structuring draft & writing content...";
    return "Thinking...";
  };

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <main className="flex flex-col h-screen text-[var(--text-primary)] font-sans bg-[#FAF8F5] dark:bg-[var(--bg-base)]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[#D97757] text-[#FAF8F5] font-serif italic font-bold">
            A
          </div>
          <span className="font-serif font-medium text-[17px] tracking-tight">Article Forge</span>
        </div>
      </header>

      {/* ── Messages Feed ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-36">
        <div ref={outputRef} className="max-w-3xl mx-auto flex flex-col gap-6 pt-8 pb-10">
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 gap-4 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#E8E1CF] dark:bg-[#342f26] text-[#D97757] font-serif italic font-bold text-2xl">
                A
              </div>
              <h1 className="text-2xl font-serif font-medium text-[#1A1814] dark:text-[#f0ece4]">What kind of article should we write?</h1>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isSystem = msg.role === "system";

            return (
              <div key={idx} className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
                
                {/* Assistant Avatar */}
                {!isUser && !isSystem && (
                  <div className="flex items-center justify-center w-8 h-8 rounded shrink-0 bg-[#E8E1CF] dark:bg-[#342f26] text-[#D97757]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  </div>
                )}
                {isSystem && (
                  <div className="flex items-center justify-center w-8 h-8 rounded shrink-0 bg-[#fef3ee] dark:bg-[#251410] text-[#9e3a1a] dark:text-[#f5a080]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  </div>
                )}

                {/* Message Content */}
                <div 
                  className={`flex flex-col max-w-[85%] ${isUser ? "bg-[#F3EFE6] dark:bg-[#2c2820] text-[#1A1814] dark:text-[#f0ece4] px-4 py-3 rounded-2xl" : "text-[#1A1814] dark:text-[#f0ece4]"}`}
                >
                  <div 
                    className="prose prose-sm md:prose-base leading-relaxed break-words whitespace-pre-wrap"
                    style={{ color: isSystem ? "var(--error-text)" : "inherit" }}
                  >
                    {msg.text}
                  </div>
                  
                  {/* Actions (for assistant) */}
                  {!isUser && !isSystem && (
                    <div className="flex mt-3 gap-2">
                       <button
                         title="Copy text"
                         className="flex items-center justify-center p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[#7A726A] dark:text-[#8a8070] transition-colors"
                         onClick={() => navigator.clipboard?.writeText(msg.text).catch(() => {})}
                       >
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                       </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking Block */}
          {loading && (
             <div className="flex gap-4 justify-start">
                <div className="flex items-center justify-center w-8 h-8 rounded shrink-0 bg-[#E8E1CF] dark:bg-[#342f26] text-[#D97757]">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                </div>
                <div className="flex flex-col w-full max-w-[85%]">
                   <details open className="group mt-1 rounded-xl border border-[#E5E1DA] dark:border-[#3a352b] bg-[#FAF8F5]/50 dark:bg-[var(--bg-surface)]/50 overflow-hidden w-fit">
                      <summary className="cursor-pointer list-none flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#7A726A] dark:text-[#8a8070] select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-open:rotate-90 transition-transform text-[#B5AE9E] dark:text-[#504840]"><path d="m9 18 6-6-6-6"/></svg>
                         {getThinkingText(thinkingState)}
                      </summary>
                      <div className="px-4 pb-3 pt-1 text-sm text-[#8A8070] dark:text-[#a09890] border-t border-[#E5E1DA]/50 dark:border-[#3a352b]/50 animate-in fade-in slide-in-from-top-2">
                         {thinkingState >= 1 && <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-80"/><span className="animate-pulse">Parsing constraints...</span></div>}
                         {thinkingState >= 2 && <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-80"/><span className="animate-pulse">Curating terminology for {tone} tone...</span></div>}
                         {thinkingState >= 3 && <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-80"/><span className="animate-pulse">Synthesizing final draft...</span></div>}
                      </div>
                   </details>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] dark:from-[var(--bg-base)] dark:via-[var(--bg-base)] to-transparent">
         <div className="max-w-3xl mx-auto flex flex-col items-center">
            
            {error && (
               <div className="mb-3 px-4 py-2 rounded-lg bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] text-sm font-medium flex items-center gap-2 shadow-sm animate-in zoom-in-95">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                 {error}
                 <button type="button" onClick={() => setError(null)} className="ml-2 hover:opacity-70"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
               </div>
            )}

            <div className="w-full relative shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] bg-white dark:bg-[var(--bg-surface)] border border-[#E5E1DA] dark:border-[var(--border-default)] rounded-2xl focus-within:border-[#B5AE9E] dark:focus-within:border-[var(--border-strong)] transition-colors overflow-hidden flex flex-col">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to write an article..."
                className="w-full max-h-[40vh] p-4 pb-3 bg-transparent resize-none outline-none text-[#1A1814] dark:text-[#f0ece4] placeholder:text-[#A09890] dark:placeholder:text-[#5a5448] text-[15px] leading-relaxed"
                rows={1}
              />
              
              <div className="flex items-center justify-between px-3 pb-3">
                 <div className="flex items-center gap-2">
                    <div className="relative group">
                       <select 
                         value={tone}
                         onChange={(e) => setTone(e.target.value)}
                         className="appearance-none cursor-pointer bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-[#4A4540] dark:text-[#c8c0b0] text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg border-none outline-none"
                       >
                          {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#7A726A] dark:text-[#8a8070]"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                    {charCount > 400 && (
                      <span className={`text-xs ml-2 ${charCount > 500 ? 'text-[#9e3a1a] dark:text-[#f5a080]' : 'text-[#A09890] dark:text-[#5a5448]'}`}>
                        {charCount}/500
                      </span>
                    )}
                 </div>
                 
                 <button 
                   onClick={(e) => handleSubmit(e)}
                   disabled={loading || !inputValue.trim()}
                   className="flex items-center justify-center p-2 rounded-xl bg-[#D97757] hover:bg-[#C96442] text-white disabled:bg-[#E5E1DA] disabled:text-[#A09890] dark:disabled:bg-[#3a352b] dark:disabled:text-[#5a5448] disabled:cursor-not-allowed transition-all"
                 >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                 </button>
              </div>
            </div>
            
            <div className="mt-3 text-center text-xs text-[#A09890] dark:text-[#5a5448]">
               Article Forge can make mistakes. Please verify information.
            </div>
         </div>
      </div>
    </main>
  );
}
