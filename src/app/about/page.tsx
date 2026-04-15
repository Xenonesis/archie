"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type GitHubRepo = {
  stargazers_count: number;
  forks_count: number;
  owner: { login: string; avatar_url: string };
  description: string;
};

export default function AboutPage() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") return "dark";
    if (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [repoLoading, setRepoLoading] = useState(true);
  const [repoError, setRepoError] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    fetch("https://api.github.com/repos/Xenonesis/archie", {
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json() as Promise<GitHubRepo>;
      })
      .then((data) => {
        setRepo(data);
        setRepoLoading(false);
      })
      .catch(() => {
        setRepoError(true);
        setRepoLoading(false);
      });
  }, []);

  const steps = [
    {
      num: "01",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      title: "Write Your Prompt",
      body: "Enter a topic or detailed instruction in the chat input. Choose your preferred tone — Professional, Friendly, Conversational, Persuasive, Academic, or Creative — to shape how the article reads.",
    },
    {
      num: "02",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: "Secure Server Proxy",
      body: "Your request never touches an AI API directly from the browser. It is validated, sanitized, rate-limited, and forwarded to a secured Next.js API route that acts as a proxy — keeping secrets server-side.",
    },
    {
      num: "03",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
      title: "n8n Workflow Engine",
      body: "The proxy calls an n8n webhook which orchestrates an AI workflow — building system prompts, invoking a language model, and returning structured article content back to the proxy.",
    },
    {
      num: "04",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      ),
      title: "AI Generation",
      body: "Inside n8n, a large language model (such as GPT-4 or Claude) receives a context-enriched prompt including your tone preference and crafts a well-structured, publication-ready article.",
    },
    {
      num: "05",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      title: "Article Delivered",
      body: "The n8n response is extracted, normalized, and returned to the frontend where it appears inline in the chat. You can copy it, give feedback, or start a new request immediately.",
    },
  ];

  const guardrails = [
    { label: "Input Sanitization", desc: "All prompts are stripped of HTML/scripts before processing." },
    { label: "Length Limits", desc: "Prompts are capped at 500 characters; topics at 100; tones at 40." },
    { label: "Tone Allowlist", desc: "Only predefined tone values are accepted — arbitrary values are rejected." },
    { label: "Rate Limiting", desc: "IP-based rate limiter (5 req / min by default) blocks abuse and cost runaway." },
    { label: "Internal API Key", desc: "Optional shared secret between frontend and backend to prevent direct API abuse." },
    { label: "Timeout Guard", desc: "Upstream n8n calls time out after 20 s, returning a clear error instead of hanging." },
    { label: "Fallback Article", desc: "If n8n returns empty or malformed content, a structured fallback article is generated server-side." },
    { label: "No Secrets in Browser", desc: "AI API keys, webhook auth tokens, and n8n URLs live only in server environment variables." },
  ];

  return (
    <div className="flex min-h-dvh w-full bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden font-sans transition-colors duration-200">
      <main className="flex-1 flex min-h-dvh flex-col overflow-y-auto">
        <header className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 md:py-4 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10 shadow-[var(--shadow-sm)]">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="w-px h-5 bg-[var(--border-subtle)] hidden sm:block" />
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--brand)] text-[#fff] font-serif italic font-bold shadow-sm">
                A
              </div>
              <span className="truncate font-serif font-medium text-[16px] md:text-[17px] tracking-tight text-[var(--text-primary)]">
                Article Forge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-semibold text-[var(--text-secondary)]">About</span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded-md transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {theme === "light" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8 md:py-12 pb-16 md:pb-20">
          <div className="mb-12 md:mb-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand)] text-xs font-semibold mb-5 uppercase tracking-wider">
              How it works
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-[var(--text-primary)] mb-4 leading-tight">
              Article Forge — AI Writing Engine
            </h1>
            <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              A secure, rate-limited article generator that connects a chat-style interface to an n8n-orchestrated AI workflow. No API keys in the browser, no runaway costs.
            </p>
          </div>

          <section className="mb-12 md:mb-16">
            <h2 className="text-xl md:text-2xl font-serif font-medium text-[var(--text-primary)] mb-6 md:mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87.18 6.26L12 17.77l-5.18 2.63L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
              Key Features
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Conversational Article Generation", desc: "Submit article requests through a chat-like interface and receive formatted articles instantly" },
                { title: "Tone Selection", desc: "Choose from six writing tones — Professional, Friendly, Conversational, Persuasive, Academic, Creative" },
                { title: "Chat History", desc: "Persistent chat sessions with rename/delete functionality and message history" },
                { title: "Dark/Light Theme", desc: "Beautiful theme system with system preference detection and localStorage persistence" },
                { title: "Real-Time Feedback", desc: "Thinking progression indicators showing analysis, curation, and synthesis phases" },
                { title: "Responsive Design", desc: "Mobile-first layout with collapsible sidebar and adaptive breakpoints" },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-3.5 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:border-[var(--brand-border)] hover:shadow-[var(--shadow-md)] transition-all duration-200">
                  <div className="shrink-0 mt-0.5 text-[var(--brand)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[var(--text-primary)] mb-0.5">{feature.title}</div>
                    <div className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12 md:mb-16">
            <h2 className="text-xl md:text-2xl font-serif font-medium text-[var(--text-primary)] mb-6 md:mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><path d="M8 21h8" /><path d="M12 17v4" />
                </svg>
              </span>
              Architecture Overview
            </h2>

            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)] mb-3 mx-auto">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><path d="M8 21h8M12 17v4" />
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">Frontend</h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 with chat interface and theme system</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)] mb-3 mx-auto">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">Backend Proxy</h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">Next.js API routes with rate limiting, validation, and n8n webhook integration</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)] mb-3 mx-auto">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                  </div>
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">AI Workflow</h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">n8n orchestrates AI models (GPT-4, Claude, etc.) with system prompts and article generation</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12 md:mb-16">
            <h2 className="text-xl md:text-2xl font-serif font-medium text-[var(--text-primary)] mb-6 md:mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                </svg>
              </span>
              Request Lifecycle
            </h2>

            <div className="relative">
              <div className="absolute left-[19px] top-10 bottom-10 w-px bg-[var(--border-subtle)] hidden md:block" />
              <div className="flex flex-col gap-6">
                {steps.map((step) => (
                  <div key={step.num} className="flex gap-5 group">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand)] shadow-sm z-10 group-hover:bg-[var(--brand)] group-hover:text-white transition-colors duration-200">
                        {step.icon}
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-[var(--text-placeholder)] uppercase tracking-widest">{step.num}</span>
                        <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">{step.title}</h3>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-12 md:mb-16">
            <h2 className="text-xl md:text-2xl font-serif font-medium text-[var(--text-primary)] mb-6 md:mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              Guardrails & Safety
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {guardrails.map((g) => (
                <div key={g.label} className="flex gap-3.5 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:border-[var(--brand-border)] hover:shadow-[var(--shadow-md)] transition-all duration-200">
                  <div className="shrink-0 mt-0.5 text-[var(--brand)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-[var(--text-primary)] mb-0.5">{g.label}</div>
                    <div className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">{g.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12 md:mb-16">
            <h2 className="text-xl md:text-2xl font-serif font-medium text-[var(--text-primary)] mb-6 md:mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </span>
              Open Source Repository
            </h2>

            <a
              href="https://github.com/Xenonesis/archie"
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:border-[var(--brand-border)] hover:shadow-[var(--shadow-md)] transition-all duration-200">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {repoLoading ? (
                      <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] animate-pulse" />
                    ) : repo ? (
                      <Image
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full border border-[var(--border-subtle)] shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[var(--text-tertiary)] text-sm">
                          {repoLoading ? (
                            <span className="inline-block w-20 h-3 bg-[var(--bg-elevated)] rounded animate-pulse" />
                          ) : repo ? (
                            repo.owner.login
                          ) : (
                            "Xenonesis"
                          )}
                        </span>
                        <span className="text-[var(--border-strong)]">/</span>
                        <span className="text-[var(--text-primary)] font-semibold text-[15px]">archie</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                        {repoLoading ? (
                          <span className="inline-block w-48 h-3 bg-[var(--bg-elevated)] rounded animate-pulse" />
                        ) : repo?.description ? (
                          repo.description
                        ) : (
                          "AI Article Forge — a secure, rate-limited article generator powered by n8n."
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[13px] font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {repoLoading ? (
                        <span className="inline-block w-6 h-3 bg-[var(--bg-elevated)] rounded animate-pulse" />
                      ) : repoError ? (
                        "—"
                      ) : (
                        (repo?.stargazers_count ?? 0).toLocaleString()
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-[13px] font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9M12 12v3" />
                      </svg>
                      {repoLoading ? (
                        <span className="inline-block w-6 h-3 bg-[var(--bg-elevated)] rounded animate-pulse" />
                      ) : repoError ? (
                        "—"
                      ) : (
                        (repo?.forks_count ?? 0).toLocaleString()
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand)] text-[13px] font-semibold group-hover:bg-[var(--brand)] group-hover:text-white transition-colors duration-200">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      View on GitHub
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Developer:</span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {repoLoading ? (
                      <span className="inline-block w-16 h-2.5 bg-[var(--bg-elevated)] rounded animate-pulse" />
                    ) : repo ? (
                      repo.owner.login
                    ) : (
                      "Xenonesis"
                    )}
                  </span>
                  <span className="mx-1 text-[var(--border-strong)]">·</span>
                  <span>github.com/Xenonesis/archie</span>
                </div>
              </div>
            </a>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-serif font-medium text-[var(--text-primary)] mb-6 md:mb-8 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><path d="M8 21h8M12 17v4" />
                </svg>
              </span>
              Tech Stack
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Next.js 16", sub: "App Router · SSR · API Routes" },
                { name: "React 19", sub: "Client Components · Hooks" },
                { name: "TypeScript 5.x", sub: "End-to-end type safety" },
                { name: "Tailwind CSS 4", sub: "Utility-first · Design tokens" },
                { name: "n8n", sub: "Workflow automation · AI integration" },
                { name: "Node.js 20+", sub: "Server runtime · npm ecosystem" },
              ].map((tech) => (
                <div key={tech.name} className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] text-center hover:border-[var(--brand-border)] transition-colors">
                  <div className="text-[14px] font-semibold text-[var(--text-primary)] mb-0.5">{tech.name}</div>
                  <div className="text-[11.5px] text-[var(--text-tertiary)]">{tech.sub}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="shrink-0 py-6 text-center text-xs text-[var(--text-placeholder)] border-t border-[var(--border-subtle)]">
          Article Forge · Built by{" "}
          <a href="https://github.com/Xenonesis" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--brand)] transition-colors font-medium">
            Xenonesis
          </a>{" "}
          · Open source on{" "}
          <a href="https://github.com/Xenonesis/archie" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--brand)] transition-colors font-medium">
            GitHub
          </a>
        </footer>
      </main>
    </div>
  );
}
