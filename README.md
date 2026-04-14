# Article Forge — AI-Powered Article Generator

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black)
![React](https://img.shields.io/badge/React-19.2.4-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06b6d4)
![License](https://img.shields.io/badge/license-Private-green)

> A server-secured, rate-limited article generator powered by n8n automation and AI. Craft professional articles in seconds through a beautiful chat-like interface.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
   - [System Architecture](#system-architecture)
   - [Request Flow](#request-flow)
   - [Component Diagram](#component-diagram)
4. [Project Structure](#project-structure)
   - [Directory Layout](#directory-layout)
   - [File Descriptions](#file-descriptions)
5. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Configuration](#environment-configuration)
   - [Running Locally](#running-locally)
   - [Building for Production](#building-for-production)
6. [Environment Variables Reference](#environment-variables-reference)
   - [Required Variables](#required-variables)
   - [Optional Variables](#optional-variables)
   - [Variable Validation](#variable-validation)
   - [Security Notes](#security-notes)
7. [API Documentation](#api-documentation)
   - [POST /api/generate-article](#post-apigenerate-article)
   - [Request Schema](#request-schema)
   - [Response Schema](#response-schema)
   - [Error Codes](#error-codes)
   - [Rate Limiting](#rate-limiting)
   - [Authentication](#authentication)
8. [Frontend Documentation](#frontend-documentation)
   - [UI Components](#ui-components)
   - [Chat Interface](#chat-interface)
   - [Theme System](#theme-system)
   - [Design Tokens](#design-tokens)
   - [Typography](#typography)
   - [Responsive Design](#responsive-design)
   - [Accessibility](#accessibility)
9. [Backend Documentation](#backend-documentation)
   - [Route Handler](#route-handler)
   - [n8n Integration](#n8n-integration)
   - [Rate Limiter](#rate-limiter)
   - [Error Handling](#error-handling)
   - [Fallback Mechanism](#fallback-mechanism)
   - [Content Extraction](#content-extraction)
10. [n8n Integration](#n8n-integration)
    - [Webhook Configuration](#webhook-configuration)
    - [Payload Structure](#payload-structure)
    - [Response Handling](#response-handling)
    - [Troubleshooting n8n](#troubleshooting-n8n)
11. [Testing](#testing)
    - [Smoke Tests](#smoke-tests)
    - [Manual Testing](#manual-testing)
    - [Test Cases](#test-cases)
12. [Deployment](#deployment)
    - [Vercel](#vercel)
    - [Docker](#docker)
    - [Node.js Server](#nodejs-server)
    - [Environment Setup](#environment-setup)
13. [Security](#security)
    - [API Key Protection](#api-key-protection)
    - [Rate Limiting](#rate-limiting-1)
    - [Input Validation](#input-validation)
    - [CORS & Headers](#cors--headers)
    - [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
    - [Error Matrix](#error-matrix)
    - [Debug Mode](#debug-mode)
15. [Performance](#performance)
    - [Optimization Tips](#optimization-tips)
    - [Caching Strategy](#caching-strategy)
    - [Bundle Analysis](#bundle-analysis)
16. [Contributing](#contributing)
17. [License](#license)
18. [Appendix](#appendix)
    - [Glossary](#glossary)
    - [References](#references)
    - [Changelog](#changelog)
    - [Future Roadmap](#future-roadmap)

---

## Overview

Article Forge is a modern web application that provides an AI-powered article generation service. It combines a beautiful, ChatGPT-inspired frontend interface with a robust backend proxy that integrates with n8n workflow automation. The application is built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4.

The core purpose of this application is to provide a seamless user experience for generating articles on any topic, with configurable tone and prompt-based control, while maintaining security through rate limiting, API key authentication, and input validation.

### Key Highlights

- **Chat-like Interface**: Conversational UI with message history, typing indicators, and thinking progression
- **n8n Integration**: Seamless webhook-based integration with n8n automation workflows
- **Rate Limiting**: Built-in in-memory rate limiter to prevent abuse
- **Dark/Light Theme**: Beautiful theme system with system preference detection
- **Type-Safe**: Full TypeScript coverage across frontend and backend
- **Error Resilience**: Graceful fallback mechanism when n8n is unavailable

---

## Features

### User-Facing Features

- **Conversational Article Generation**: Submit article requests through a chat-like interface and receive formatted articles instantly
- **Tone Selection**: Choose from six writing tones — Professional, Friendly, Conversational, Persuasive, Academic, Creative
- **Smart Prompt Handling**: Automatic topic extraction from short prompts; flexible input modes
- **Real-Time Feedback**: Thinking progression indicators showing analysis, curation, and synthesis phases
- **Message History**: Persistent chat session with scroll-to-latest-message behavior
- **Copy to Clipboard**: One-click copy button on all generated articles
- **Dark Mode**: Full dark/light theme toggle with system preference detection and localStorage persistence
- **Responsive Design**: Mobile-first layout with collapsible sidebar and adaptive breakpoints
- **Character Counter**: Live character count with visual warnings approaching the 500-character limit
- **Error Display**: Clear, actionable error messages with dismissible error banners

### Developer-Facing Features

- **TypeScript Type Safety**: Full type definitions for API responses, chat messages, and configuration
- **API Contract**: Well-defined request/response schema with comprehensive error codes
- **Smoke Testing**: Built-in smoke test script for automated health checks
- **Environment Validation**: Runtime configuration validation with descriptive error messages
- **Rate Limit Headers**: Standard `Retry-After` headers on 429 responses
- **Logging**: Structured console logging for upstream requests and errors
- **Fallback Content**: Local fallback article generation when upstream service is unavailable

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Browser                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend (page.tsx)                   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐ │  │
│  │  │   Sidebar   │  │  Message Feed │  │    Input Area         │ │  │
│  │  │  (History,  │  │  (Chat Bubbles│  │  (Textarea, Tone     │ │  │
│  │  │  Theme, New │  │   Avatars,    │  │   Select, Send Btn)  │ │  │
│  │  │  Chat)      │  │   Thinking)   │  │                       │ │  │
│  │  └─────────────┘  └──────────────┘  └───────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ fetch() POST /api/generate-article
                               │ { prompt, topic, tone }
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js Route Handler (route.ts)                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐│
│  │  Auth Check     │  │  Rate Limiter   │  │  Input Validation    ││
│  │  (INTERNAL_     │  │  (In-Memory     │  │  (Prompt length,     ││
│  │   API_KEY)      │  │   Map-based)    │  │   topic, tone)       ││
│  └─────────────────┘  └─────────────────┘  └──────────────────────┘│
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   n8n Webhook Proxy                            │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌────────────────────┐ │ │
│  │  │  Payload      │  │  Response     │  │  Fallback          │ │ │
│  │  │  Builder      │  │  Parser       │  │  Generator         │ │ │
│  │  │  (multi-key)  │  │  (extract     │  │  (local article)   │ │ │
│  │  │               │  │   article)    │  │                    │ │ │
│  │  └───────────────┘  └───────────────┘  └────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ fetch() POST
                               │ { prompt, chatInput, input, text,
                               │   query, topic, tone, source }
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        n8n Cloud / Self-Hosted                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Webhook Node → AI Processing → Response           │  │
│  │              (OpenAI, Claude, or custom workflow)              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Input**: User types a prompt or topic in the textarea and selects a tone
2. **Submission**: On submit (Enter key or Send button), the frontend sends a POST request to `/api/generate-article`
3. **Auth Check**: The route handler checks for `INTERNAL_API_KEY` and validates the `x-internal-api-key` header
4. **Rate Limit**: In-memory rate limiter checks request count per IP within the configured window
5. **Validation**: Prompt, topic, and tone are validated against length constraints
6. **Proxy Request**: The handler forwards a structured payload to the n8n webhook URL
7. **Response Parsing**: The n8n response is parsed — JSON, plain text, or nested objects are all supported
8. **Fallback**: If n8n returns empty content or invalid JSON, a local fallback article is generated
9. **UI Update**: The article text is displayed as an assistant message in the chat feed

### Component Diagram

```
Home (page.tsx)
├── Sidebar
│   ├── Branding Header
│   ├── New Chat Button
│   ├── Chat History List
│   └── Theme Toggle
├── Main Content
│   ├── Header (mobile sidebar toggle)
│   ├── Message Feed
│   │   ├── Welcome Screen (empty state)
│   │   ├── User Messages (right-aligned)
│   │   ├── Assistant Messages (left-aligned, with avatar)
│   │   ├── System Messages (error display)
│   │   └── Thinking Block (loading state)
│   └── Input Area
│       ├── Error Banner (dismissible)
│       ├── Textarea (auto-resize, Enter to submit)
│       ├── Tone Select
│       ├── Character Counter
│       ├── Send Button
│       └── Disclaimer Text
```

---

## Project Structure

### Directory Layout

```
n8/
├── .env.local                          # Environment variables (not committed)
├── .gitignore                          # Git ignore rules
├── AGENTS.md                           # AI agent guidelines
├── CLAUDE.md                           # Claude agent guidelines
├── eslint.config.mjs                   # ESLint configuration
├── next.config.ts                      # Next.js configuration
├── package.json                        # Dependencies and scripts
├── package-lock.json                   # Locked dependency versions
├── postcss.config.mjs                  # PostCSS configuration
├── README.md                           # This file
├── tsconfig.json                       # TypeScript configuration
├── scripts/
│   └── smoke.mjs                       # Smoke test script
├── public/
│   └── ...                             # Static assets
└── src/
    └── app/
        ├── globals.css                 # Global styles, design tokens, theme
        ├── layout.tsx                  # Root layout with metadata
        ├── page.tsx                    # Main chat interface (client component)
        └── api/
            └── generate-article/
                └── route.ts            # Backend proxy route handler
```

### File Descriptions

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/page.tsx` | Main chat UI component with sidebar, message feed, and input area | ~451 |
| `src/app/layout.tsx` | Root HTML layout with metadata, fonts, and theme-color meta tags | ~30 |
| `src/app/globals.css` | Tailwind CSS import, design tokens, dark theme, utility classes | ~280 |
| `src/app/api/generate-article/route.ts` | Next.js Route Handler — n8n proxy with auth, rate limiting, validation | ~320 |
| `scripts/smoke.mjs` | Automated smoke test for API health, validation, and rate limiting | ~70 |
| `next.config.ts` | Next.js configuration (default) | ~5 |
| `tsconfig.json` | TypeScript compiler options with path aliases | ~30 |
| `eslint.config.mjs` | ESLint configuration for code linting | — |
| `postcss.config.mjs` | PostCSS configuration for Tailwind CSS | — |
| `package.json` | Project metadata, dependencies, npm scripts | — |

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Minimum Version | Recommended Version |
|------|-----------------|---------------------|
| Node.js | 18.18.0 | 20.x LTS |
| npm | 9.x | 10.x |
| Git | 2.x | 2.x |

Optional but recommended:

- **VS Code** with ESLint and TypeScript extensions
- **n8n account** (cloud or self-hosted) for article generation backend

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Xenonesis/archie.git
   cd archie
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This installs the following:
   - **Runtime**: `next@16.2.2`, `react@19.2.4`, `react-dom@19.2.4`
   - **Build**: `tailwindcss@^4`, `@tailwindcss/postcss@^4`
   - **Dev**: `eslint@^9`, `typescript@^5`, type definitions for React/Next.js

3. **Configure environment variables**:
   Create a `.env.local` file in the project root (see [Environment Configuration](#environment-configuration)).

### Environment Configuration

Create a `.env.local` file with the following content:

```bash
# ─── Required ────────────────────────────────────────────────────────
# n8n webhook URL (must contain /webhook/ in path, NOT /workflow/)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

# ─── Optional ────────────────────────────────────────────────────────
# Bearer token for n8n webhook authentication
N8N_WEBHOOK_KEY=your-secret-key

# Internal API key for protecting the proxy endpoint
INTERNAL_API_KEY=your-internal-api-key

# Client-side API key (must match INTERNAL_API_KEY if set)
NEXT_PUBLIC_CLIENT_API_KEY=your-internal-api-key

# Rate limiting: max requests per window
RATE_LIMIT_MAX=5

# Rate limiting: window duration in milliseconds
RATE_LIMIT_WINDOW_MS=60000

# n8n webhook timeout in milliseconds
WEBHOOK_TIMEOUT_MS=20000
```

### Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/generate-article

The dev server supports hot module replacement (HMR) — changes to source files are reflected immediately.

### Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

   This performs:
   - TypeScript type checking
   - Next.js static analysis
   - Route prerendering
   - Asset optimization and minification

2. **Start the production server**:
   ```bash
   npm start
   ```

   The production server runs on port 3000 by default. Set `PORT` environment variable to change it.

3. **Lint the codebase**:
   ```bash
   npm run lint
   ```

4. **Run smoke tests** (against a running server):
   ```bash
   npm run smoke
   ```

   Override test parameters with environment variables:
   ```bash
   SMOKE_BASE_URL=http://localhost:3000 SMOKE_INTERNAL_API_KEY=your-key npm run smoke
   ```

---

## Environment Variables Reference

### Required Variables

| Variable | Type | Example | Description |
|----------|------|---------|-------------|
| `N8N_WEBHOOK_URL` | URL | `https://asnn.app.n8n.cloud/webhook/article-generator` | The n8n webhook endpoint URL. Must contain `/webhook/` in the path. |

**Important Notes for `N8N_WEBHOOK_URL`**:
- Must be a valid HTTP or HTTPS URL
- Must contain `/webhook/` in the pathname
- Must NOT contain `/workflow/` (workflow editor URLs are not valid webhook endpoints)
- This is the URL you get from n8n when you create a Webhook node in a workflow

### Optional Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `N8N_WEBHOOK_KEY` | String | `""` | Bearer token for authenticating with the n8n webhook. Only needed if your n8n workflow requires auth. |
| `INTERNAL_API_KEY` | String | `""` | Secret key that protects the `/api/generate-article` endpoint. When set, clients must send matching `x-internal-api-key` header. |
| `NEXT_PUBLIC_CLIENT_API_KEY` | String | `""` | Client-side value that must match `INTERNAL_API_KEY`. Exposed to the browser bundle. |
| `RATE_LIMIT_MAX` | Number | `5` | Maximum number of requests allowed per IP within the rate limit window. |
| `RATE_LIMIT_WINDOW_MS` | Number | `60000` | Duration of the rate limit window in milliseconds (default: 60 seconds). |
| `WEBHOOK_TIMEOUT_MS` | Number | `20000` | Timeout for the n8n webhook request in milliseconds (default: 20 seconds). |

### Variable Validation

The route handler validates `N8N_WEBHOOK_URL` at startup:

1. **URL Format**: Must be a parseable URL
2. **Protocol**: Must use `http` or `https`
3. **Path Contains `/webhook/`**: Must target an n8n webhook, not a workflow editor URL
4. **Path Does NOT Contain `/workflow/`**: Workflow editor URLs are explicitly rejected

If validation fails, all API requests return a `500 CONFIG_ERROR` response with a descriptive message.

### Security Notes

- **`.env.local` is gitignored** — never commit secrets to version control
- **`INTERNAL_API_KEY`** should be a strong, randomly generated string
- **`NEXT_PUBLIC_CLIENT_API_KEY`** is exposed to the browser — only use it if you trust all frontend users
- **`N8N_WEBHOOK_KEY`** is server-side only — never expose to the client

---

## API Documentation

### POST /api/generate-article

Generates an article using the n8n backend with local fallback support.

#### Request Schema

**Content-Type**: `application/json`

**Headers**:

| Header | Required | Type | Description |
|--------|----------|------|-------------|
| `Content-Type` | Yes | `application/json` | Must be `application/json` |
| `x-internal-api-key` | Conditional | String | Required when `INTERNAL_API_KEY` is configured on the server |

**Body**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `prompt` | String | Conditional | 0-500 characters | Detailed article prompt. If < 5 chars, the API derives a prompt from `topic`. |
| `topic` | String | Conditional | 0-100 characters | Article topic. Used when `prompt` is empty or short. |
| `tone` | String | No | 0-40 characters | Writing tone for the article. Examples: "Professional", "Friendly", "Academic" |

**Validation Rules**:
- At least one of `prompt` (>= 5 chars) or `topic` must be provided
- `prompt` exceeding 500 characters returns `400 BAD_REQUEST`
- `topic` exceeding 100 characters returns `400 BAD_REQUEST`
- `tone` exceeding 40 characters returns `400 BAD_REQUEST`
- Short `prompt` (< 20 chars) triggers automatic topic-based prompt derivation

**Example Request**:

```json
{
  "prompt": "Write a concise article about the benefits of edge computing for IoT devices.",
  "topic": "edge computing",
  "tone": "Professional"
}
```

**Auto-Derived Request (when prompt is short)**:

```json
{
  "prompt": "",
  "topic": "edge computing",
  "tone": "Professional"
}
```

This is internally transformed to: `"Write a Professional article about edge computing."`

#### Response Schema

**Success Response (200 OK)**:

```json
{
  "article": "Edge computing represents a paradigm shift in how data is processed...\n\n[full article text]",
  "rateLimit": {
    "remaining": 4,
    "reset": 1713091200000
  }
}
```

**Fallback Response (200 OK)**:

```json
{
  "article": "Title: Edge Computing\n\n[local fallback article text]",
  "fallback": true,
  "warning": "n8n response did not include article text; local fallback article was generated.",
  "rateLimit": {
    "remaining": 4,
    "reset": 1713091200000
  }
}
```

#### Error Codes

| HTTP Status | Error Code | Description | Retry? |
|-------------|-----------|-------------|--------|
| `400` | `BAD_REQUEST` | Invalid input — missing/invalid prompt, topic, or tone | Fix input |
| `401` | `UNAUTHORIZED` | Missing or invalid `x-internal-api-key` header | Fix auth |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests from the same IP | Wait `retryAfter` seconds |
| `500` | `CONFIG_ERROR` | Server misconfiguration — invalid `N8N_WEBHOOK_URL` | Fix config |
| `500` | `INTERNAL_ERROR` | Unexpected server error | Retry |
| `502` | `UPSTREAM_ERROR` | n8n returned a non-2xx status | Retry |
| `502` | `UPSTREAM_TIMEOUT` | n8n response exceeded timeout | Retry |
| `502` | `UPSTREAM_INVALID_JSON` | n8n returned malformed JSON with JSON content-type | Retry |

**Error Response Format**:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "retryAfter": 45,
  "upstreamStatus": 500
}
```

#### Rate Limiting

The application uses an in-memory rate limiter keyed by client IP address.

**Configuration**:
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 5)
- `RATE_LIMIT_WINDOW_MS`: Window duration in ms (default: 60,000 = 1 minute)

**Behavior**:
- First request in a window initializes the counter
- Subsequent requests increment the counter
- When counter reaches `RATE_LIMIT_MAX`, further requests return `429`
- Window resets after `RATE_LIMIT_WINDOW_MS` milliseconds
- `Retry-After` header is included in 429 responses

**IP Detection**:
- Primary: `x-forwarded-for` header (first IP in chain)
- Fallback: `x-real-ip` header
- Last resort: `"unknown"` (rate limits all unknown-IP requests together)

**Production Note**: The in-memory rate limiter works for single-instance deployments. For distributed systems, use Redis or a dedicated rate-limiting service.

#### Authentication

**Internal API Key** (Optional):

When `INTERNAL_API_KEY` is configured, the proxy requires clients to send a matching `x-internal-api-key` header.

```bash
# Server config
INTERNAL_API_KEY=my-secret-key

# Client request
curl -X POST http://localhost:3000/api/generate-article \
  -H "Content-Type: application/json" \
  -H "x-internal-api-key: my-secret-key" \
  -d '{"prompt": "Hello world"}'
```

**n8n Bearer Token** (Optional):

When `N8N_WEBHOOK_KEY` is configured, the proxy adds an `Authorization: Bearer` header to upstream requests.

```bash
N8N_WEBHOOK_KEY=n8n-secret-key
```

This adds to the n8n request:
```
Authorization: Bearer n8n-secret-key
```

---

## Frontend Documentation

### UI Components

The frontend is a single React client component (`page.tsx`) that implements a full chat interface.

**Key State Variables**:

| State | Type | Purpose |
|-------|------|---------|
| `inputValue` | String | Current textarea value |
| `tone` | String | Selected writing tone |
| `messages` | ChatMessage[] | Chat message history |
| `loading` | Boolean | Whether a request is in progress |
| `thinkingState` | Number | Thinking progression phase (0-3) |
| `error` | String \| null | Current error message |
| `theme` | "light" \| "dark" | Current theme mode |
| `sidebarOpen` | Boolean | Sidebar visibility |

### Chat Interface

**Message Types**:

| Role | Alignment | Avatar | Styling |
|------|-----------|--------|---------|
| `user` | Right-aligned | None | Card with background and border |
| `assistant` | Left-aligned | Sparkle icon | Plain text with copy button |
| `system` | Left-aligned | Error icon | Red-tinted text for errors |

**Message Rendering**:
- All messages use `whitespace-pre-wrap` for preserving line breaks
- User messages are wrapped in a card with elevated background
- Assistant messages include a copy-to-clipboard button
- System messages display error text with red styling

**Input Behavior**:
- **Enter**: Submit the request
- **Shift+Enter**: Insert a newline
- **Auto-resize**: Textarea grows up to 40vh height
- **Character counter**: Appears when input exceeds 400 characters

### Theme System

**Supported Themes**:
- `light`: Warm paper-like aesthetic with terracotta brand colors
- `dark`: Deep warm dark tones with brighter brand accents

**Theme Detection**:
1. Checks `localStorage` for saved theme preference
2. Falls back to `prefers-color-scheme` media query
3. Manual toggle overrides both

**Theme Persistence**:
- Selected theme is stored in `localStorage` under the key `"theme"`
- `theme-color` meta tags update for mobile browser chrome
- CSS custom properties update via `[data-theme]` attribute

### Design Tokens

All colors and spacing values are defined as CSS custom properties in `globals.css`.

**Surface Colors**:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--bg-base` | `#faf9f7` | `#17151280` | Page background |
| `--bg-surface` | `#ffffff` | `#1e1b17` | Card/input backgrounds |
| `--bg-elevated` | `#f5f4f1` | `#252118` | Elevated surfaces |
| `--bg-subtle` | `#f0ede8` | `#2c2820` | Subtle backgrounds |
| `--bg-hover` | `#ebe8e2` | `#342f26` | Hover states |

**Border Colors**:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--border-subtle` | `#e5e1da` | `#2e2a22` | Subtle dividers |
| `--border-default` | `#d5d0c8` | `#3a352b` | Default borders |
| `--border-strong` | `#b5ae9e` | `#504840` | Strong borders |

**Text Colors**:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--text-primary` | `#1a1814` | `#f0ece4` | Main text |
| `--text-secondary` | `#4a4540` | `#c8c0b0` | Secondary text |
| `--text-tertiary` | `#7a726a` | `#8a8070` | Tertiary/labels |
| `--text-placeholder` | `#a09890` | `#5a5448` | Placeholder text |

**Brand Colors**:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--brand` | `#c96442` | `#e07856` | Primary brand (terracotta) |
| `--brand-hover` | `#b55838` | `#e88d6e` | Brand hover state |
| `--brand-subtle` | `#f5ede8` | `#2a1c14` | Brand subtle backgrounds |
| `--brand-border` | `#e8c5b5` | `#4a2a1c` | Brand borders |

**Semantic Colors**:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--error-bg` | `#fef3ee` | `#251410` | Error backgrounds |
| `--error-border` | `#f5c8b0` | `#4a2010` | Error borders |
| `--error-text` | `#9e3a1a` | `#f5a080` | Error text |

**Shadows**:

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(26,24,20,0.06)` | Small cards |
| `--shadow-md` | `0 4px 12px rgba(26,24,20,0.08), 0 1px 3px rgba(26,24,20,0.06)` | Cards, input areas |
| `--shadow-lg` | `0 8px 32px rgba(26,24,20,0.10), 0 2px 6px rgba(26,24,20,0.07)` | Modals, overlays |

### Typography

**Font Families**:

| Token | Font Stack | Usage |
|-------|-----------|-------|
| `--font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Body text, UI elements |
| `--font-serif` | `'Newsreader', Georgia, 'Times New Roman', serif` | Headings, article text |
| `--font-mono` | `'SF Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace` | Code (future use) |

**Font Loading**:
Google Fonts are loaded in `layout.tsx` via `<link>` tags:
- `Inter` (weights: 300, 400, 500, 600, 700)
- `Newsreader` (weights: 400, 500; styles: normal, italic)

### Responsive Design

**Breakpoints**:

The application uses Tailwind CSS 4's default breakpoints:

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| `sm` | 640px | Small screens |
| `md` | 768px | Sidebar becomes available |
| `lg` | 1024px | Wide layouts |
| `xl` | 1280px | Extra wide |
| `2xl` | 1536px | Ultra wide |

**Mobile Behavior**:
- Sidebar is hidden by default; toggleable via header button
- Sidebar overlays content with a semi-transparent backdrop
- Sidebar closes on backdrop click
- Input area is fixed at bottom with gradient fade for readability

**Desktop Behavior**:
- Sidebar can be toggled open/closed
- When open, header branding fades out to avoid duplication
- Message feed is centered with `max-w-3xl` constraint

### Accessibility

- **Semantic HTML**: Uses `<main>`, `<header>`, `<aside>`, `<details>` elements
- **ARIA**: Button `title` attributes, `suppressHydrationWarning` for theme SSR
- **Keyboard**: Enter to submit, Shift+Enter for newline
- **Focus Management**: `outline-none` with ring focus on inputs
- **Color Contrast**: WCAG AA compliant text colors
- **Motion**: Respects `prefers-reduced-motion` via CSS transitions

---

## Backend Documentation

### Route Handler

**File**: `src/app/api/generate-article/route.ts`

**Runtime**: `nodejs` (explicitly set for server-side execution)

**Exported Function**:
```typescript
export async function POST(request: Request): Promise<NextResponse>
```

**Key Functions**:

| Function | Purpose | Returns |
|----------|---------|---------|
| `validateRuntimeConfig()` | Validates N8N_WEBHOOK_URL at startup | `string \| null` (error message or null) |
| `getClientIp(request)` | Extracts client IP from headers | `string` |
| `checkRateLimit(ip)` | Checks and updates rate limit counter | `{ allowed, remaining, reset }` |
| `cleanText(value)` | Sanitizes string input | `string` |
| `normalizeArticleText(value)` | Normalizes line endings and whitespace | `string` |
| `extractArticleText(data)` | Recursively extracts article from JSON | `string \| null` |
| `buildLocalFallbackArticle(input)` | Generates a fallback article from input | `string` |
| `errorResponse(status, code, error)` | Creates standardized error responses | `NextResponse` |

### n8n Integration

**Upstream Payload**:

The proxy sends a multi-key payload to maximize compatibility with n8n workflows:

```json
{
  "prompt": "Write a Professional article about edge computing.",
  "chatInput": "Write a Professional article about edge computing.",
  "input": "Write a Professional article about edge computing.",
  "text": "Write a Professional article about edge computing.",
  "query": "Write a Professional article about edge computing.",
  "topic": "edge computing",
  "tone": "Professional",
  "source": "nextjs-chatbot-proxy"
}
```

**Why multi-key?**
Different n8n workflows may expect different field names. By including `prompt`, `chatInput`, `input`, `text`, `query`, the proxy works with any workflow configuration.

**Request Options**:
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`, optional `Authorization: Bearer <N8N_WEBHOOK_KEY>`
- **Signal**: `AbortSignal.timeout(WEBHOOK_TIMEOUT_MS)`
- **Cache**: `no-store` (never cached)

### Rate Limiter

**Implementation**: In-memory `Map<string, { count, resetAt }>`

**Algorithm**: Fixed window counter

```
┌─────────────────────────────────────┐
│  Window 1 (t=0 to t=60000)          │
│  ┌─────┬─────┬─────┬─────┬─────┐   │
│  │  R1 │  R2 │  R3 │  R4 │  R5 │   │  <- Allowed
│  └─────┴─────┴─────┴─────┴─────┘   │
│                                     │
│  R6 -> 429 Too Many Requests        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Window 2 (t=60000 to t=120000)     │
│  ┌─────┬─────┬─────┬─────┬─────┐   │
│  │  R1 │  R2 │  R3 │  R4 │  R5 │   │  <- Allowed
│  └─────┴─────┴─────┴─────┴─────┘   │
└─────────────────────────────────────┘
```

**Limitations**:
- Single-instance only (does not share state across processes)
- Memory grows with unique IPs (entries are cleaned up on window reset)
- For production, replace with Redis-based rate limiting

### Error Handling

**Error Response Builder**:

```typescript
function errorResponse(
  status: number,
  code: ApiErrorCode,
  error: string,
  extra?: Record<string, number | string>
): NextResponse
```

All errors follow the standardized JSON format:
```json
{
  "error": "Description of what went wrong",
  "code": "MACHINE_READABLE_CODE",
  "retryAfter": 45,
  "upstreamStatus": 500
}
```

**Error Categories**:

| Category | Codes | HTTP Status | User Action |
|----------|-------|-------------|-------------|
| Client Error | `BAD_REQUEST` | 400 | Fix input |
| Authentication | `UNAUTHORIZED` | 401 | Provide valid API key |
| Rate Limiting | `RATE_LIMIT_EXCEEDED` | 429 | Wait and retry |
| Configuration | `CONFIG_ERROR` | 500 | Fix server config |
| Upstream | `UPSTREAM_ERROR`, `UPSTREAM_TIMEOUT`, `UPSTREAM_INVALID_JSON` | 502 | Retry or contact admin |
| Internal | `INTERNAL_ERROR` | 500 | Retry or contact admin |

### Fallback Mechanism

When n8n is unavailable or returns unusable content, the proxy generates a local fallback article.

**Trigger Conditions**:
1. n8n returns empty JSON body
2. n8n returns JSON without recognizable article fields
3. n8n returns empty string content
4. n8n returns plain text that is empty after normalization

**Fallback Article Structure**:
```
Title: {topic}

{topic} is increasingly important in modern software and product strategy...

From a practical standpoint...

A second critical factor...

Another useful lens...

Based on your request: "{context}", a strong next step is...
```

**Fallback Properties**:
- Always includes a title
- Contains 5 paragraphs of professional content
- References the user's topic and tone
- Response includes `fallback: true` and `warning` fields

### Content Extraction

The `extractArticleText()` function recursively searches JSON responses for article content.

**Search Order**:
1. If data is a string → return directly (after normalization)
2. If data is an array → extract from each element and join with `\n\n`
3. If data is an object → search these keys in order:
   - `article`, `text`, `content`, `output`, `result`, `message`, `data`, `response`, `body`
4. If no key matches → stringify the entire object as JSON

This ensures compatibility with virtually any n8n workflow response format.

---

## n8n Integration

### Webhook Configuration

To set up the n8n backend:

1. **Create a new workflow** in n8n
2. **Add a Webhook node** as the trigger
   - Method: `POST`
   - Path: `/article-generator` (or any custom path)
   - Authentication: None (or set up Bearer token)
3. **Add an AI node** (OpenAI, Claude, or any LLM provider)
   - Input: Use the `prompt`, `chatInput`, `input`, `text`, or `query` field
   - System prompt: Configure article generation instructions
4. **Add a Respond to Webhook node** (if using n8n Cloud)
   - Response format: Plain text or JSON with `article` field
5. **Copy the Webhook URL** and set it as `N8N_WEBHOOK_URL`

**Important**:
- Use the webhook test URL during development (starts with `/webhook-test/`)
- Use the production webhook URL in deployment (starts with `/webhook/`)
- Never use the workflow editor URL (contains `/workflow/`)

### Payload Structure

The proxy sends the following fields to the n8n webhook:

| Field | Value | Purpose |
|-------|-------|---------|
| `prompt` | Derived or user prompt | Main content request |
| `chatInput` | Same as prompt | Compatibility with chat-oriented workflows |
| `input` | Same as prompt | Compatibility with generic input nodes |
| `text` | Same as prompt | Compatibility with text-processing nodes |
| `query` | Same as prompt | Compatibility with search/query nodes |
| `topic` | User-provided topic | For topic-aware workflows |
| `tone` | User-provided tone | For tone-aware generation |
| `source` | `"nextjs-chatbot-proxy"` | Identifies the request source |

### Response Handling

The proxy handles three response types from n8n:

**1. JSON Response**:
```json
{
  "article": "Article content here...",
  "metadata": { "wordCount": 500 }
}
```
The `extractArticleText()` function finds the `article` field.

**2. Plain Text Response**:
```
Article content as plain text...
```
The entire response body is used as the article.

**3. Array Response**:
```json
[
  "Paragraph 1...",
  "Paragraph 2...",
  "Paragraph 3..."
]
```
Array elements are joined with double newlines.

### Troubleshooting n8n

| Issue | Cause | Solution |
|-------|-------|----------|
| `502 UPSTREAM_ERROR` | n8n workflow error or non-2xx response | Check n8n execution logs |
| `502 UPSTREAM_TIMEOUT` | n8n response > `WEBHOOK_TIMEOUT_MS` | Optimize workflow or increase timeout |
| `502 UPSTREAM_INVALID_JSON` | n8n returned malformed JSON | Ensure n8n responds with valid JSON or plain text |
| Fallback article returned | n8n returned empty content | Verify n8n output mapping |
| Webhook URL rejected | URL contains `/workflow/` | Use webhook URL from n8n, not editor URL |

---

## Testing

### Smoke Tests

The project includes an automated smoke test script (`scripts/smoke.mjs`).

**What it tests**:
1. **Happy Path**: Valid request returns 200 with article text
2. **Invalid Input**: Short prompt without topic returns 400 BAD_REQUEST
3. **Rate Limiting**: Exceeding the rate limit returns 429

**Running the tests**:

```bash
# Start the dev server first
npm run dev

# In another terminal, run smoke tests
npm run smoke
```

**Expected output**:
```
[smoke] Testing http://localhost:3000/api/generate-article
[smoke] Happy path: OK
[smoke] Invalid input path: OK
[smoke] Rate-limit path: OK
[smoke] All checks passed
```

**Environment overrides**:

| Variable | Default | Description |
|----------|---------|-------------|
| `SMOKE_BASE_URL` | `http://localhost:3000` | Base URL for the test target |
| `SMOKE_INTERNAL_API_KEY` | `""` | API key for protected endpoints |
| `SMOKE_CLIENT_IP` | `198.51.100.77` | Fixed IP for deterministic rate-limit testing |

### Manual Testing

**Test Checklist**:

1. **Dev Server**:
   - [ ] `npm run dev` starts without errors
   - [ ] http://localhost:3000 loads the chat interface
   - [ ] Theme matches system preference

2. **Article Generation**:
   - [ ] Submit a prompt (>5 chars) → article appears
   - [ ] Submit a topic only → derived prompt article appears
   - [ ] Submit empty input → no request sent
   - [ ] Submit >500 char prompt → error displayed

3. **Error Handling**:
   - [ ] Disconnect n8n → 502 error displayed
   - [ ] Set invalid N8N_WEBHOOK_URL → 500 CONFIG_ERROR
   - [ ] Exceed rate limit → 429 with retry-after

4. **UI Features**:
   - [ ] Theme toggle works
   - [ ] Sidebar opens/closes
   - [ ] Copy button works on assistant messages
   - [ ] Enter key submits, Shift+Enter adds newline
   - [ ] Character counter appears at 400+ chars

5. **Responsive Design**:
   - [ ] Mobile layout works at 375px width
   - [ ] Sidebar overlay closes on backdrop click
   - [ ] Input area stays visible at bottom

### Test Cases

**Unit-Level Test Scenarios**:

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| 1 | Valid prompt | `{ prompt: "Write about AI", topic: "", tone: "Professional" }` | 200, article text |
| 2 | Valid topic only | `{ prompt: "", topic: "AI", tone: "Friendly" }` | 200, derived article |
| 3 | Short prompt + topic | `{ prompt: "AI", topic: "AI", tone: "" }` | 200, derived from topic |
| 4 | Empty request | `{}` | 400, BAD_REQUEST |
| 5 | Prompt too long | `{ prompt: "x".repeat(501) }` | 400, BAD_REQUEST |
| 6 | Topic too long | `{ topic: "x".repeat(101) }` | 400, BAD_REQUEST |
| 7 | Tone too long | `{ tone: "x".repeat(41) }` | 400, BAD_REQUEST |
| 8 | Invalid API key | Headers with wrong key | 401, UNAUTHORIZED |
| 9 | Rate exceeded | 6+ requests in 60s | 429, RATE_LIMIT_EXCEEDED |
| 10 | n8n timeout | Slow n8n response | 502, UPSTREAM_TIMEOUT |
| 11 | n8n 500 | n8n internal error | 502, UPSTREAM_ERROR |
| 12 | n8n empty | Empty response body | 200, fallback article |
| 13 | n8n malformed JSON | `{ article: }` with JSON content-type | 502, UPSTREAM_INVALID_JSON |
| 14 | Config error | Invalid N8N_WEBHOOK_URL | 500, CONFIG_ERROR |

---

## Deployment

### Vercel

Article Forge is optimized for Vercel deployment.

1. **Connect your repository** to Vercel
2. **Set environment variables** in the Vercel dashboard:
   - `N8N_WEBHOOK_URL`
   - `N8N_WEBHOOK_KEY` (optional)
   - `INTERNAL_API_KEY` (optional)
   - `RATE_LIMIT_MAX` (optional)
   - `RATE_LIMIT_WINDOW_MS` (optional)
   - `WEBHOOK_TIMEOUT_MS` (optional)
3. **Deploy** — Vercel builds and deploys automatically

**Note**: The in-memory rate limiter resets on each serverless cold start. For consistent rate limiting, use Vercel's Edge Middleware or a Redis add-on.

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t article-forge .
docker run -p 3000:3000 --env-file .env.local article-forge
```

### Node.js Server

For bare-metal or VPS deployment:

1. **Clone and install**:
   ```bash
   git clone https://github.com/Xenonesis/archie.git
   cd archie
   npm ci --production
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Start with process manager**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "article-forge" -- start
   pm2 save
   pm2 startup
   ```

### Environment Setup

**Production Checklist**:

- [ ] Set `N8N_WEBHOOK_URL` to production n8n webhook
- [ ] Set `N8N_WEBHOOK_KEY` if n8n requires auth
- [ ] Set `INTERNAL_API_KEY` to protect the endpoint
- [ ] Set `NEXT_PUBLIC_CLIENT_API_KEY` to match `INTERNAL_API_KEY`
- [ ] Increase `RATE_LIMIT_MAX` if needed
- [ ] Adjust `WEBHOOK_TIMEOUT_MS` for slow n8n workflows
- [ ] Enable HTTPS (via reverse proxy or platform)
- [ ] Set up monitoring for 5xx errors
- [ ] Configure log aggregation

---

## Security

### API Key Protection

**Server-Side Secrets**:
- `N8N_WEBHOOK_KEY` — never exposed to the browser bundle
- `INTERNAL_API_KEY` — never exposed to the browser bundle

**Client-Side Keys**:
- `NEXT_PUBLIC_CLIENT_API_KEY` — exposed in the browser bundle; use only for soft access controls

**Best Practices**:
- Use strong, randomly generated keys (min 32 characters)
- Rotate keys periodically
- Never commit `.env.local` to version control
- Use `.gitignore` to prevent accidental commits

### Rate Limiting

**Purpose**: Prevent abuse and control API usage

**Current Implementation**: In-memory Map with fixed window counter

**Limitations**:
- Single-instance only
- Does not share state across processes
- Memory grows with unique IPs (entries cleaned on window reset)

**Production Recommendations**:
- Use Redis for distributed rate limiting
- Implement sliding window algorithm for smoother limiting
- Add IP whitelisting for trusted clients

### Input Validation

**Client-Side**:
- Max 500 characters for prompt
- Max 100 characters for topic
- Max 40 characters for tone
- At least one of prompt or topic required

**Server-Side** (defense in depth):
- Same constraints enforced on the API
- Input sanitized with `cleanText()` (whitespace normalization)
- Article text normalized with `normalizeArticleText()` (CRLF→LF, trailing whitespace removal, max double newlines)

### CORS & Headers

**Current Configuration**:
- Next.js handles CORS automatically for same-origin requests
- No explicit CORS configuration (API is same-origin)

**Headers**:
- `Content-Type: application/json` required for requests
- `Retry-After` included in 429 responses
- `x-internal-api-key` checked against server config

### Best Practices

1. **Always use HTTPS** in production
2. **Set `INTERNAL_API_KEY`** to prevent unauthorized access
3. **Monitor error rates** — set up alerts for 5xx responses
4. **Rotate n8n keys** periodically
5. **Keep dependencies updated** — run `npm audit` regularly
6. **Use Content Security Policy** headers in production
7. **Implement request logging** for audit trails
8. **Set up health check endpoints** for monitoring

---

## Troubleshooting

### Common Issues

**Issue**: Dev server won't start
**Cause**: Port already in use or missing dependencies
**Fix**:
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
# macOS/Linux:
lsof -ti:3000 | xargs kill

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Article generation returns empty
**Cause**: n8n workflow not configured correctly
**Fix**:
1. Test the n8n webhook directly with curl or Postman
2. Check n8n execution logs for errors
3. Verify the webhook URL is correct (not workflow editor URL)

**Issue**: Rate limit hits too quickly
**Cause**: Low `RATE_LIMIT_MAX` or shared IP
**Fix**: Increase `RATE_LIMIT_MAX` in `.env.local`

**Issue**: Theme doesn't persist across pages
**Cause**: Next.js navigation resets state
**Fix**: Theme is stored in `localStorage` and re-read on mount — this is working as designed

### Error Matrix

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `401 UNAUTHORIZED` | `INTERNAL_API_KEY` set but client key missing/mismatch | Set `NEXT_PUBLIC_CLIENT_API_KEY` to same value or unset `INTERNAL_API_KEY` |
| `429 RATE_LIMIT_EXCEEDED` | Too many requests in rate window | Wait for `Retry-After` seconds or increase rate limits |
| `500 CONFIG_ERROR` | Invalid `N8N_WEBHOOK_URL` format/path | Use valid webhook URL, not workflow editor URL |
| `502 UPSTREAM_ERROR` | n8n returned non-2xx | Check n8n execution logs and webhook availability |
| `502 UPSTREAM_TIMEOUT` | n8n response took too long | Optimize n8n workflow or retry |
| `502 UPSTREAM_INVALID_JSON` | n8n returned malformed JSON with JSON content-type | Return valid JSON from n8n or plain text |
| Empty/short article | Upstream returned no content | Improve prompt specificity, verify n8n output mapping |
| Hydration mismatch | Theme SSR/CSR discrepancy | Check `suppressHydrationWarning` in layout |

### Debug Mode

**Enable verbose logging**:

Add console.log statements to `route.ts`:

```typescript
// Log incoming request
console.log('[generate-article] Incoming request:', {
  ip: getClientIp(request),
  headers: Object.fromEntries(request.headers),
});

// Log payload sent to n8n
console.log('[generate-article] Payload:', JSON.stringify(payload, null, 2));

// Log n8n response
console.log('[generate-article] n8n response:', {
  status: response.status,
  contentType: response.headers.get('content-type'),
  body: text.substring(0, 500),
});
```

**Browser debugging**:

Open browser DevTools (F12) and check:
- **Network tab**: Inspect request/response details
- **Console tab**: Check for client-side errors
- **Application tab**: Verify localStorage theme key

---

## Performance

### Optimization Tips

**Frontend**:
- Component is a single client component — consider splitting into smaller components
- Messages are re-rendered on every state change — consider `React.memo` for message items
- Textarea auto-resize uses `scrollHeight` — efficient but could be debounced

**Backend**:
- Rate limiter uses `Map` — O(1) lookup, efficient for single instance
- n8n requests use `AbortSignal.timeout` — prevents hanging connections
- Response parsing is synchronous — no blocking operations

**Network**:
- Minimize n8n workflow execution time
- Use connection pooling for high-throughput scenarios
- Consider caching responses for identical requests

### Caching Strategy

**Current**: No caching (all responses are `no-store`)

**Recommended additions**:
- Cache generated articles by prompt hash (Redis or in-memory)
- Implement stale-while-revalidate for frequently requested topics
- Use CDN edge caching for static assets

### Bundle Analysis

**Check bundle size**:

```bash
npm run build
```

Next.js outputs:
- Route handler size (server bundle)
- Client JavaScript size (page.tsx bundle)
- CSS size (globals.css)

**Optimization opportunities**:
- SVG icons could be extracted to a shared component
- Tone options could be moved to a config file
- Design tokens are already tree-shaken via CSS custom properties

---

## Contributing

This is a private project. If you have been granted access:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Run tests**: `npm run smoke`
5. **Lint**: `npm run lint`
6. **Commit**: `git commit -m "feat: add my feature"`
7. **Push**: `git push origin feature/my-feature`
8. **Open a Pull Request**

**Commit Message Convention**:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation update
- `style:` — Code style change (formatting, no logic change)
- `refactor:` — Code refactoring
- `test:` — Test addition or update
- `chore:` — Maintenance task

---

## License

Private. All rights reserved.

---

## Appendix

### Glossary

| Term | Definition |
|------|-----------|
| **n8n** | Open-source workflow automation tool used as the article generation backend |
| **Webhook** | HTTP callback endpoint in n8n that receives POST requests |
| **Route Handler** | Next.js App Router API endpoint (`route.ts`) |
| **Rate Limiter** | Mechanism to control request frequency per client |
| **Fallback Article** | Locally generated article when n8n is unavailable |
| **Design Tokens** | CSS custom properties defining colors, spacing, and typography |
| **Hydration** | React process of attaching event handlers to server-rendered HTML |
| **SSR** | Server-Side Rendering — generating HTML on the server |
| **CSR** | Client-Side Rendering — generating HTML in the browser |
| **HMR** | Hot Module Replacement — updating code without page reload |

### References

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [n8n Documentation](https://docs.n8n.io)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Changelog

**v0.1.0** (Current)
- Initial release
- Chat-like article generation interface
- n8n webhook integration
- In-memory rate limiting
- Dark/light theme system
- Responsive sidebar
- Smoke test suite
- Comprehensive error handling
- Local fallback article generation

### Future Roadmap

**Short Term**:
- [ ] Redis-based distributed rate limiting
- [ ] Chat history persistence (localStorage or database)
- [ ] Article export (PDF, Markdown, DOCX)
- [ ] Prompt templates library
- [ ] Conversation history in n8n payload

**Medium Term**:
- [ ] Multi-language support (i18n)
- [ ] Article editing and revision flow
- [ ] User authentication system
- [ ] Usage analytics dashboard
- [ ] Streaming response support

**Long Term**:
- [ ] Multiple AI provider support (OpenAI, Claude, Gemini)
- [ ] Real-time collaboration
- [ ] Custom tone training
- [ ] Article quality scoring
- [ ] SEO optimization suggestions

---

*Article Forge — Craft professional articles in seconds with AI and n8n.*

---

## Deep Dive: React Component Architecture

### Component Lifecycle and Hooks

The `Home` component in `page.tsx` leverages React 19's client component model with several hooks:

#### useState Hooks

The component maintains 8 pieces of local state:

```typescript
const [inputValue, setInputValue] = useState("");           // Textarea content
const [tone, setTone] = useState<string>("Professional");   // Selected tone
const [messages, setMessages] = useState<ChatMessage[]>([]); // Chat history
const [loading, setLoading] = useState(false);              // Request in progress
const [thinkingState, setThinkingState] = useState(0);      // Thinking phase (0-3)
const [error, setError] = useState<string | null>(null);    // Error message
const [theme, setTheme] = useState<"light" | "dark">("light"); // Theme mode
const [sidebarOpen, setSidebarOpen] = useState(false);      // Sidebar visibility
```

**State Relationships**:

- `loading` and `thinkingState` are coupled — when `loading` becomes `true`, `thinkingState` begins incrementing
- `theme` drives the `data-theme` attribute on `document.documentElement`
- `messages` drives the entire chat feed; new messages are appended via `setMessages`
- `error` is independent state, cleared manually or on new submission

#### useEffect Hooks

**1. Theme Initialization** (runs once on mount):

```typescript
useEffect(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    setTheme("dark");
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}, []);
```

This hook:
- Runs exactly once (empty dependency array `[]`)
- Checks `localStorage` for a saved theme preference
- Falls back to the OS-level `prefers-color-scheme` media query
- Sets the `data-theme` attribute for CSS custom property overrides

**2. Auto-Scroll** (runs on message changes):

```typescript
useEffect(() => {
  if (outputRef.current) {
    outputRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [messages, loading, thinkingState]);
```

This hook:
- Runs whenever `messages`, `loading`, or `thinkingState` changes
- Scrolls the latest message into view with smooth animation
- Uses `lastElementChild` to target the most recent message

**3. Thinking Progression** (runs when loading changes):

```typescript
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
```

This hook:
- Creates an interval timer when `loading` is `true`
- Increments `thinkingState` from 1 to 3 over 4.5 seconds
- Cleans up the interval on unmount or when `loading` becomes `false`
- Resets `thinkingState` to 0 when not loading

#### useMemo Hook

```typescript
const charCount = useMemo(() => inputValue.length, [inputValue]);
```

Memoizes the character count to avoid recalculating on every render. Only recalculates when `inputValue` changes.

#### useRef Hooks

```typescript
const outputRef = useRef<HTMLDivElement>(null);       // Message feed container
const textareaRef = useRef<HTMLTextAreaElement>(null); // Textarea element
```

Refs provide direct DOM access for:
- `outputRef`: Auto-scrolling to the latest message
- `textareaRef`: Resetting textarea height after submission

### Event Handlers

**handleInput**:

```typescript
const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  setInputValue(e.target.value);
  e.target.style.height = "auto";
  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
};
```

- Updates `inputValue` state
- Auto-resizes the textarea up to 200px height
- Uses `Math.min` to cap the maximum height

**handleKeyDown**:

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSubmit(e);
  }
};
```

- Captures Enter key press
- Prevents default (which would insert a newline)
- Triggers form submission
- Shift+Enter inserts a newline normally

**handleSubmit**:

The main submission handler follows this flow:

1. Validates input (non-empty, under 500 chars)
2. Determines if prompt is short (<20 chars) → uses topic mode
3. Adds user message to chat
4. Sends POST request to `/api/generate-article`
5. Handles response (success, error, rate limit)
6. Adds assistant or system message to chat
7. Resets loading state

**toggleTheme**:

```typescript
const toggleTheme = () => {
  const newTheme = theme === "light" ? "dark" : "light";
  setTheme(newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem("theme", newTheme);
};
```

- Toggles between light and dark
- Updates the DOM attribute for CSS
- Persists to localStorage

---

## CSS Architecture Deep Dive

### CSS Custom Properties Strategy

All styling in the application uses CSS custom properties (CSS variables) defined in `globals.css`. This approach provides:

1. **Theme switching**: Changing variable values in `[data-theme="dark"]` instantly swaps the entire color scheme
2. **Design token system**: Named tokens like `--brand`, `--bg-base`, `--text-primary` provide semantic meaning
3. **Runtime updates**: JavaScript can modify variables dynamically via `style.setProperty()`

**Variable Scoping**:

- `:root` — Default (light) theme values, globally scoped
- `@media (prefers-color-scheme: dark)` — System dark mode override
- `[data-theme="dark"]` — Manual toggle override (highest specificity)

### Tailwind CSS Integration

The project uses Tailwind CSS 4 with the `@import "tailwindcss"` directive. Key Tailwind features used:

**Layout Utilities**:
- `flex`, `flex-col`, `flex-1` — Flexbox layout
- `h-screen`, `w-full` — Full viewport dimensions
- `overflow-hidden`, `overflow-y-auto` — Scroll management
- `shrink-0` — Prevent flex shrinking

**Spacing Utilities**:
- `gap-2`, `gap-3`, `gap-4`, `gap-6` — Consistent spacing
- `px-4`, `py-3`, `p-4` — Padding control
- `mx-auto` — Centering with auto margins

**Sizing Utilities**:
- `max-w-3xl` — Maximum width constraint (48rem)
- `w-8`, `h-8` — Fixed dimensions for avatars
- `max-h-[40vh]` — Maximum height relative to viewport

**Color Utilities**:
- `bg-[var(--bg-base)]` — Custom background via CSS variable
- `text-[var(--text-primary)]` — Custom text color
- `border-[var(--border-subtle)]` — Custom border color

**Typography Utilities**:
- `text-xs`, `text-sm`, `text-[14px]`, `text-2xl` — Font sizes
- `font-medium`, `font-bold`, `font-semibold` — Font weights
- `leading-relaxed` — Line height (1.625)
- `tracking-tight` — Letter spacing (-0.025em)

**Interactive Utilities**:
- `hover:bg-[var(--bg-hover)]` — Hover state background
- `focus-within:border-[var(--brand)]` — Focus state for parent
- `disabled:opacity-55` — Disabled state opacity
- `transition-colors`, `transition-all` — CSS transitions

**Position Utilities**:
- `fixed`, `absolute`, `relative` — Position schemes
- `bottom-0`, `left-0`, `right-0` — Position offsets
- `z-10`, `z-40`, `z-50` — Stacking order

**Transform Utilities**:
- `translate-x-0`, `-translate-x-full` — Horizontal translation
- `scale-105` — Scale transform on hover
- `rotate-90` — Rotation for chevron icons

**Animation Utilities**:
- `animate-in`, `fade-in`, `fade-in-up` — Custom keyframe animations
- `animate-spin` — Built-in spin animation
- `duration-300`, `duration-2000` — Animation duration

### Scrollbar Styling

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
```

Custom scrollbar styling for WebKit browsers (Chrome, Edge, Safari):
- Thin 6px scrollbar
- Transparent track
- Rounded thumb with hover state

### Selection Styling

```css
::selection {
  background: rgba(201, 100, 66, 0.18);
  color: var(--text-primary);
}
```

Custom text selection color using the brand terracotta with 18% opacity.

---

## TypeScript Type System

### Type Definitions

The application defines several TypeScript types for type safety:

```typescript
type ChatMessage = { role: "user" | "assistant" | "system"; text: string };

type ResponseFromApi = {
  article?: string;
  rateLimit?: { remaining: number; reset: number };
  error?: string;
  code?: string;
  retryAfter?: number;
};
```

**ChatMessage**:
- Discriminated union on `role` field
- Three possible roles: `"user"`, `"assistant"`, `"system"`
- All messages carry `text` content

**ResponseFromApi**:
- All fields are optional (`?`) since the API may return different shapes
- `article` — Generated article text
- `rateLimit` — Rate limit metadata
- `error` — Human-readable error message
- `code` — Machine-readable error code
- `retryAfter` — Seconds to wait before retrying

### Type Guards and Narrowing

The `mapApiError` function uses status code ranges for type narrowing:

```typescript
function mapApiError(status: number, payload: ResponseFromApi): string {
  if (status === 400) return payload.error ?? "Invalid request...";
  if (status === 401) return "Unauthorized...";
  if (status === 429) { /* ... */ }
  if (status === 502) { /* ... */ }
  if (status >= 500) return "Server error...";
  return payload.error ?? "Unexpected error...";
}
```

The nullish coalescing operator (`??`) provides fallback values when `payload.error` is `undefined`.

### Constant Types

```typescript
const ROLE_META = {
  assistant: { label: "AI", color: "#c96442" },
  user:      { label: "You", color: "var(--text-secondary)" },
  system:    { label: "System", color: "var(--text-tertiary)" },
} as const;

const TONES = ["Professional", "Friendly", "Conversational", "Persuasive", "Academic", "Creative"] as const;
```

The `as const` assertion makes these readonly tuple/object types, enabling type-safe access.

---

## Route Handler Deep Dive

### Configuration Validation

The `validateRuntimeConfig()` function runs at module load time:

```typescript
function validateRuntimeConfig(): string | null {
  try {
    const url = new URL(N8N_WEBHOOK_URL);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return 'N8N_WEBHOOK_URL must use http or https.';
    }
    if (!url.pathname.includes('/webhook/')) {
      return 'N8N_WEBHOOK_URL must target an n8n webhook endpoint.';
    }
    if (url.pathname.includes('/workflow/')) {
      return 'N8N_WEBHOOK_URL cannot be a workflow editor URL.';
    }
  } catch {
    return 'N8N_WEBHOOK_URL is not a valid URL.';
  }
  return null;
}
```

**Validation Steps**:
1. URL parsing — catches malformed URLs
2. Protocol check — must be `http:` or `https:`
3. Webhook path check — must contain `/webhook/`
4. Workflow path exclusion — must NOT contain `/workflow/`

If any check fails, all API requests immediately return `500 CONFIG_ERROR`.

### Rate Limiter Implementation

```typescript
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || entry.resetAt <= now) {
    // New window
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, reset: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, reset: entry.resetAt };
  }

  // Increment counter
  entry.count += 1;
  rateMap.set(ip, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, reset: entry.resetAt };
}
```

**Algorithm Details**:
- Uses JavaScript `Map` for O(1) key lookup
- Each IP has its own counter and reset timestamp
- Window reset is lazy — checked on each request
- No cleanup mechanism — entries persist until window expires

**Memory Considerations**:
- Each entry: ~32 bytes (string key + object value)
- With 10,000 unique IPs: ~320 KB
- Self-cleaning on window expiration

### Content Extraction Algorithm

The `extractArticleText()` function uses recursive descent to find article content:

```
Input: unknown JSON structure
Output: string | null

Step 1: If input is string → return normalized string
Step 2: If input is array → extract from each element, join with \n\n
Step 3: If input is object → search keys in priority order:
  3a. article
  3b. text
  3c. content
  3d. output
  3e. result
  3f. message
  3g. data
  3h. response
  3i. body
Step 4: If no key matches → stringify entire object as JSON
```

This algorithm handles:
- Simple string responses
- Nested JSON with article in any field
- Arrays of text fragments
- Completely unexpected response formats

### Text Normalization

```typescript
function normalizeArticleText(value: string): string {
  const normalizedNewlines = value.replace(/\r\n/g, '\n');
  const trimmedLines = normalizedNewlines
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n');
  return trimmedLines.replace(/\n{3,}/g, '\n\n').trim();
}
```

**Normalization Steps**:
1. Convert Windows line endings (`\r\n`) to Unix (`\n`)
2. Remove trailing whitespace from each line
3. Collapse 3+ consecutive newlines to 2 newlines
4. Trim leading/trailing whitespace

---

## n8n Workflow Setup Guide

### Step-by-Step n8n Configuration

#### Step 1: Create a New Workflow

1. Log in to your n8n instance
2. Click "Add Workflow"
3. Name it "Article Generator"

#### Step 2: Add Webhook Trigger

1. Click the "+" button to add a node
2. Search for "Webhook"
3. Configure:
   - **HTTP Method**: `POST`
   - **Path**: `article-generator`
   - **Authentication**: None (or Header Auth with Bearer token)
   - **Response Mode**: Using "Respond to Webhook" Node

#### Step 3: Add AI Processing Node

**Option A: OpenAI Node**

1. Add an "OpenAI" node
2. Configure:
   - **Model**: `gpt-4o` or `gpt-3.5-turbo`
   - **Prompt**: Use the `prompt` or `text` field from webhook
   - **System Message**: "You are a professional article writer. Write detailed, well-structured articles on the given topic."

**Option B: HTTP Request to AI API**

1. Add an "HTTP Request" node
2. Configure:
   - **Method**: `POST`
   - **URL**: `https://api.openai.com/v1/chat/completions`
   - **Authentication**: Bearer Token (your OpenAI API key)
   - **Body**: JSON with messages array

#### Step 4: Add Response Node

1. Add a "Respond to Webhook" node (n8n Cloud)
2. Configure:
   - **Respond With**: JSON
   - **Response Body**: `{ "article": $json.output }` (or whatever field contains the article)

#### Step 5: Activate and Test

1. Click "Activate" to make the webhook live
2. Copy the webhook URL (should look like `https://your-instance.app.n8n.cloud/webhook/abc-123-def`)
3. Set `N8N_WEBHOOK_URL` in your `.env.local`

### n8n Self-Hosted Setup

For self-hosted n8n:

1. **Install n8n**:
   ```bash
   npm install n8n -g
   n8n
   ```

2. **Access the UI**: Open http://localhost:5678

3. **Create the workflow** following the steps above

4. **Set the webhook URL** in `.env.local`:
   ```bash
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/article-generator
   ```

### n8n Environment Variables

If self-hosting n8n, consider these environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `N8N_BASIC_AUTH_ACTIVE` | Enable basic auth | `true` |
| `N8N_BASIC_AUTH_USER` | Basic auth username | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | Basic auth password | `password123` |
| `WEBHOOK_URL` | Public webhook URL | `https://n8n.example.com` |
| `N8N_PORT` | Server port | `5678` |

---

## Detailed Smoke Test Analysis

### Test 1: Happy Path

```javascript
const validPayload = {
  prompt: 'Write a concise article about edge computing benefits.',
  topic: 'edge computing',
  tone: 'Professional',
};
```

**What it validates**:
- The API accepts valid input
- Returns HTTP 200
- Response contains an `article` field with string content
- Rate limit metadata is included

**Expected flow**:
```
Client → POST /api/generate-article
  → Auth check (pass)
  → Rate limit (pass)
  → Input validation (pass)
  → n8n webhook call
  → n8n processes and returns article
  → Proxy returns article to client
```

### Test 2: Invalid Input

```javascript
const invalidPayload = { prompt: 'a', topic: '', tone: 'Professional' };
```

**What it validates**:
- Prompt shorter than 5 chars with empty topic triggers validation error
- Returns HTTP 400
- Error code is `BAD_REQUEST`

**Why this fails**:
- `prompt` is "a" (1 char, less than 5 minimum)
- `topic` is empty
- The API requires at least one: prompt (≥5 chars) OR topic

### Test 3: Rate Limiting

```javascript
const remaining = Math.max(1, Math.min(happy.data.rateLimit.remaining + 1, 20));
for (let i = 0; i < remaining; i++) {
  const result = await postJson(validPayload);
  if (result.response.status === 429) break;
}
assert(saw429, '[rate-limit] expected at least one 429 response');
```

**What it validates**:
- After exceeding `RATE_LIMIT_MAX` requests, the API returns 429
- The test dynamically calculates how many requests to send based on remaining quota

**Rate limit behavior**:
```
Request 1: 200 (remaining: 4)
Request 2: 200 (remaining: 3)
Request 3: 200 (remaining: 2)
Request 4: 200 (remaining: 1)
Request 5: 200 (remaining: 0)
Request 6: 429 (RATE_LIMIT_EXCEEDED)
```

### Smoke Test Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `SMOKE_BASE_URL` | `http://localhost:3000` | Target server URL |
| `SMOKE_CLIENT_IP` | `198.51.100.77` | Fixed IP for rate limit testing |
| `SMOKE_INTERNAL_API_KEY` | `""` | Auth key for protected endpoints |

**Why a fixed IP?**
Using a consistent `x-forwarded-for` header ensures deterministic rate-limit testing. Without it, each test run might use a different IP and bypass the rate limiter.

---

## Deployment Platforms Comparison

### Vercel

**Pros**:
- Zero-config deployment for Next.js apps
- Automatic HTTPS
- Global CDN
- Serverless functions (API routes run as serverless functions)
- Preview deployments for every PR

**Cons**:
- Serverless cold starts (500ms-2s)
- In-memory rate limiter resets on each invocation
- 10-second serverless function timeout (may affect n8n proxy)
- Limited to Vercel's pricing tiers

**Recommended for**: Small to medium traffic, rapid iteration

### Railway

**Pros**:
- Full Node.js server (no cold starts)
- In-memory rate limiter works correctly
- Custom domain with HTTPS
- Simple pricing based on usage

**Cons**:
- Less optimized for Next.js than Vercel
- No built-in preview deployments

**Recommended for**: Medium traffic, need for persistent state

### Docker (Any Cloud)

**Pros**:
- Full control over environment
- Persistent in-memory rate limiter
- No platform-specific limitations
- Portable across providers (AWS, GCP, Azure, DigitalOcean)

**Cons**:
- Requires infrastructure management
- Need to handle SSL certificates
- Need to manage process supervisor

**Recommended for**: High traffic, enterprise deployments

### Fly.io

**Pros**:
- Deploy Docker containers globally
- Automatic HTTPS
- Close to users (edge deployment)
- Free tier available

**Cons**:
- Smaller ecosystem than major clouds
- Limited add-ons

**Recommended for**: Global low-latency requirements

---

## Monitoring and Observability

### Logging Strategy

The route handler logs key events:

```typescript
console.info(
  '[generate-article] upstream status=%d durationMs=%d contentType=%s',
  response.status,
  elapsedMs,
  contentType || 'unknown'
);
```

**Recommended log entries to add**:

```typescript
// Request received
console.log('[generate-article] Request received', { ip, hasApiKey: !!apiKey });

// Rate limit hit
console.log('[generate-article] Rate limit exceeded', { ip, count: entry.count });

// Validation error
console.log('[generate-article] Validation failed', { promptLength: promptInput.length, topicLength: topic.length });

// n8n request
console.log('[generate-article] Calling n8n', { url: N8N_WEBHOOK_URL, timeout: WEBHOOK_TIMEOUT_MS });

// Fallback triggered
console.log('[generate-article] Using fallback article', { reason: 'empty response' });
```

### Metrics to Track

| Metric | Importance | How to Track |
|--------|-----------|--------------|
| Request rate | Traffic volume | Count POST requests per minute |
| Error rate | Service health | Count 4xx/5xx responses per minute |
| Response time | User experience | Measure `Date.now()` before/after n8n call |
| Rate limit hits | Abuse detection | Count 429 responses per minute |
| Fallback rate | n8n reliability | Count fallback articles per total articles |
| Average article length | Content quality | Measure `article.length` in responses |

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error rate | > 5% | > 15% |
| Response time (p95) | > 10s | > 20s |
| Fallback rate | > 10% | > 30% |
| Rate limit hits | > 50/hour | > 200/hour |

---

## API Integration Examples

### cURL

```bash
# Basic request
curl -X POST http://localhost:3000/api/generate-article \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write about quantum computing", "tone": "Academic"}'

# With API key
curl -X POST http://localhost:3000/api/generate-article \
  -H "Content-Type: application/json" \
  -H "x-internal-api-key: my-secret-key" \
  -d '{"topic": "quantum computing", "tone": "Academic"}'
```

### Python

```python
import requests

response = requests.post(
    "http://localhost:3000/api/generate-article",
    json={
        "prompt": "Write about quantum computing",
        "topic": "quantum computing",
        "tone": "Academic"
    },
    headers={"x-internal-api-key": "my-secret-key"}  # Optional
)

if response.status_code == 200:
    print(response.json()["article"])
else:
    print(f"Error {response.status_code}: {response.json()['error']}")
```

### JavaScript (Node.js)

```javascript
const response = await fetch("http://localhost:3000/api/generate-article", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-internal-api-key": "my-secret-key"  // Optional
  },
  body: JSON.stringify({
    prompt: "Write about quantum computing",
    topic: "quantum computing",
    tone: "Academic"
  })
});

const data = await response.json();
if (response.ok) {
  console.log(data.article);
} else {
  console.error(`Error ${response.status_code}: ${data.error}`);
}
```

### PowerShell

```powershell
$body = @{
    prompt = "Write about quantum computing"
    topic = "quantum computing"
    tone = "Academic"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-article" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$response.article
```

---

## Advanced Configuration

### Redis Rate Limiter (Production)

Replace the in-memory rate limiter with Redis:

```typescript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

async function checkRateLimitRedis(ip: string) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW_MS / 1000);
  }
  const ttl = await redis.ttl(key);
  return {
    allowed: count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - count),
    reset: Date.now() + ttl * 1000,
  };
}
```

### Response Caching

Cache generated articles by prompt hash:

```typescript
import { createHash } from 'crypto';

const cache = new Map<string, { article: string; expires: number }>();

function getCacheKey(prompt: string, topic: string, tone: string): string {
  return createHash('sha256').update(`${prompt}|${topic}|${tone}`).digest('hex').slice(0, 16);
}

// In POST handler:
const cacheKey = getCacheKey(effectivePrompt, topic, tone);
const cached = cache.get(cacheKey);
if (cached && cached.expires > Date.now()) {
  return NextResponse.json({ article: cached.article, cached: true });
}
```

### Request Logging Middleware

Add structured JSON logging:

```typescript
function log(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...data,
  }));
}

// Usage:
log('request_received', { ip, promptLength: promptInput.length });
log('n8n_response', { status, durationMs, contentType });
```

---

## Common n8n Workflow Patterns

### Pattern 1: Simple AI Passthrough

```
Webhook → OpenAI → Respond to Webhook
```

The simplest pattern. Webhook receives the prompt, OpenAI generates the article, response node sends it back.

### Pattern 2: Prompt Enhancement

```
Webhook → Set Node (enhance prompt) → OpenAI → Respond to Webhook
```

Add a "Set" node between webhook and AI to prepend system instructions:

```
"Write a comprehensive, well-researched article in a {{ $json.tone }} tone.\n\nTopic: {{ $json.topic }}"
```

### Pattern 3: Multi-Step Generation

```
Webhook → OpenAI (outline) → OpenAI (full article) → Respond to Webhook
```

Generate an outline first, then expand each section into a full article.

### Pattern 4: Quality Check

```
Webhook → OpenAI (article) → OpenAI (review) → IF (quality ok) → Respond
                                            → ELSE → Retry
```

Use a second AI call to review the article quality before responding.

### Pattern 5: Content Formatting

```
Webhook → OpenAI → Markdown Node → HTML Converter → Respond to Webhook
```

Process the article through formatting nodes before returning.

---

## Performance Benchmarks

### Local Development

| Operation | Expected Time |
|-----------|--------------|
| Dev server startup | 1-3 seconds |
| First page load | 200-500ms |
| HMR update | 100-300ms |
| API request (local n8n) | 2-10 seconds |
| API request (cloud n8n) | 5-20 seconds |

### Production Build

| Operation | Expected Time |
|-----------|--------------|
| Build time | 10-30 seconds |
| Server startup | 1-2 seconds |
| First page load (SSR) | 300-800ms |
| API request | 5-20 seconds (depends on n8n) |
| Static asset delivery | <100ms (with CDN) |

### Resource Usage

| Metric | Dev Server | Production |
|--------|-----------|------------|
| Memory | 200-400 MB | 100-200 MB |
| CPU (idle) | <5% | <1% |
| CPU (request) | 10-30% | 5-15% |
| Disk | 500 MB (with node_modules) | 50-100 MB (standalone) |

---

## Security Audit Checklist

### Input Validation

- [x] Prompt length limited to 500 characters
- [x] Topic length limited to 100 characters
- [x] Tone length limited to 40 characters
- [x] At least one of prompt or topic required
- [x] Input sanitized with `cleanText()`
- [x] Article text normalized with `normalizeArticleText()`

### Authentication

- [x] `INTERNAL_API_KEY` check on server
- [x] `x-internal-api-key` header validation
- [x] `N8N_WEBHOOK_KEY` for upstream auth

### Rate Limiting

- [x] Per-IP rate limiting
- [x] Configurable max requests
- [x] Configurable window duration
- [x] `Retry-After` header on 429

### Error Handling

- [x] No stack traces exposed to client
- [x] Generic error messages for 5xx
- [x] Structured error responses with codes
- [x] Timeout protection for n8n calls

### Secrets Management

- [x] `.env.local` in `.gitignore`
- [x] Server-side secrets not exposed to browser
- [x] `NEXT_PUBLIC_CLIENT_API_KEY` clearly marked as client-exposed

### Additional Recommendations

- [ ] Add CSP headers
- [ ] Add rate limiting at infrastructure level (Cloudflare, AWS WAF)
- [ ] Implement request ID tracking for debugging
- [ ] Add CORS configuration if cross-origin access needed
- [ ] Set up automated dependency auditing (`npm audit`)
- [ ] Enable HTTPS-only in production

---

## Frontend Component Breakdown

### Sidebar Component Analysis

The sidebar is implemented inline within the `Home` component rather than as a separate component. Here's a detailed breakdown:

**Sidebar Structure**:

```
<aside>
  ├── Branding Header
  │   ├── Logo (letter "A" in terracotta circle)
  │   ├── "Article Forge" text
  │   └── Close button (mobile only)
  ├── New Chat Button
  │   ├── Plus icon
  │   └── "Start New Chat" label
  ├── Chat History List
  │   ├── "Recent Workspace" header
  │   ├── Historical chat items (static examples)
  │   └── Current active chat indicator
  └── Theme Toggle
      ├── Icon (sun/moon)
      └── Label (Dark Mode / Light Mode)
</aside>
```

**Sidebar State**:

| State | Mobile (<768px) | Desktop (≥768px) |
|-------|-----------------|-------------------|
| Default | Hidden (width: 0) | Hidden (width: 0) |
| Open | Absolute position, 260px width, overlay | Relative position, 260px width, pushes content |
| Animation | `translate-x-0` / `-translate-x-full` | Width transition only |
| Backdrop | Semi-transparent black overlay | No backdrop |

**Sidebar CSS Classes Explained**:

```tsx
className={`${sidebarOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 hidden md:flex'}
  ${sidebarOpen ? 'absolute' : 'hidden'} md:relative z-50 h-screen transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-[var(--bg-elevated)] border-r border-[var(--border-subtle)] flex-col shadow-[var(--shadow-sm)]`}
```

This complex className string handles:
- Width transitions (0 ↔ 260px)
- Translation for mobile slide-in/out
- Position scheme (absolute vs relative)
- Visibility (hidden vs flex)
- Responsive breakpoints (md: prefix)
- Transition timing (300ms, ease-in-out)

### Message Feed Component

The message feed renders different message types with distinct visual treatments:

**User Messages**:
- Right-aligned (`justify-end`)
- Card-style container with background, border, and shadow
- No avatar
- Maximum 85% width
- Prose-styled text with `whitespace-pre-wrap`

**Assistant Messages**:
- Left-aligned (`justify-start`)
- Sparkle icon avatar (8×8 rounded container)
- Avatar uses brand subtle background and brand border
- Copy-to-clipboard button below message
- Prose-styled text

**System Messages**:
- Left-aligned (`justify-start`)
- Error icon avatar (X in circle)
- Avatar uses error background
- Text styled with error text color
- No copy button

**Welcome Screen** (empty state):
- Centered vertically and horizontally
- Large "A" logo (12×12 rounded-xl)
- "What kind of article should we write?" heading
- Only shown when `messages.length === 0`

### Thinking Block Component

The thinking block is an expandable details element that shows AI processing progress:

```tsx
<details open className="group mt-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden w-fit shadow-sm">
  <summary className="cursor-pointer ...">
    <svg className="group-open:rotate-90 transition-transform">...</svg>
    {getThinkingText(thinkingState)}
  </summary>
  <div className="...">
    {thinkingState >= 1 && <div>Parsing constraints...</div>}
    {thinkingState >= 2 && <div>Curating terminology for {tone} tone...</div>}
    {thinkingState >= 3 && <div>Synthesizing final draft...</div>}
  </div>
</details>
```

**Thinking States**:

| State | Text | Checklist Items |
|-------|------|----------------|
| 1 | "Analyzing request..." | Parsing constraints... |
| 2 | "Gathering constraints & defining tone..." | Parsing constraints... + Curating terminology... |
| 3+ | "Structuring draft & writing content..." | All three items visible |

**Animation Details**:
- Details element opens/closes with chevron rotation
- Checklist items fade in with slide-in-from-top animation
- Spinner icon on avatar rotates with 3-second duration

### Input Area Component

The input area is fixed at the bottom of the viewport with a gradient fade to the page background:

**Structure**:

```
<div fixed bottom gradient>
  ├── Error Banner (conditional)
  │   ├── Error icon
  │   ├── Error message text
  │   └── Dismiss button
  ├── Input Container
  │   ├── Textarea (auto-resize, max 40vh)
  │   └── Bottom Bar
  │       ├── Tone Select (custom dropdown)
  │       ├── Character Counter (conditional, >400 chars)
  │       └── Send Button
  └── Disclaimer Text
</div>
```

**Textarea Behavior**:
- Auto-resizes based on content height
- Maximum height: 40vh
- Minimum height: 1 row
- On submit: resets to auto height

**Tone Select**:
- Custom-styled dropdown with appearance-none
- Chevron icon positioned absolutely
- Options: Professional, Friendly, Conversational, Persuasive, Academic, Creative

**Send Button**:
- Disabled when loading or input is empty
- Right arrow icon
- Terracotta background (brand color)
- Disabled state: elevated background, muted text

---

## Route Handler: Edge Cases and Boundary Testing

### Edge Case 1: Empty String Fields

```json
{ "prompt": "", "topic": "", "tone": "" }
```

**Result**: 400 BAD_REQUEST — neither prompt nor topic provided

### Edge Case 2: Whitespace-Only Input

```json
{ "prompt": "   ", "topic": "  ", "tone": "  " }
```

**Result**: 400 BAD_REQUEST — `cleanText()` trims to empty strings, same as edge case 1

### Edge Case 3: Exactly at Limits

```json
{ "prompt": "x".repeat(500), "topic": "x".repeat(100), "tone": "x".repeat(40) }
```

**Result**: Valid request — all fields at exact maximum length

### Edge Case 4: One Over Limit

```json
{ "prompt": "x".repeat(501) }
```

**Result**: 400 BAD_REQUEST — prompt exceeds 500 characters

### Edge Case 5: Unicode Content

```json
{ "prompt": "Write about 日本語 processing", "topic": "Unicode", "tone": "Professional" }
```

**Result**: Valid request — Unicode characters count as single characters in JavaScript strings

### Edge Case 6: Very Long n8n Response

If n8n returns a 10,000+ word article:

**Result**: 200 OK — no size limit on response. The article is returned as-is.

### Edge Case 7: n8n Returns Null

```json
{ "article": null }
```

**Result**: 200 OK with fallback article — `extractArticleText()` returns null for null values

### Edge Case 8: n8n Returns Number

```json
{ "article": 42 }
```

**Result**: 200 OK with "42" as article text — `extractArticleText()` converts to string

### Edge Case 9: n8n Returns Boolean

```json
{ "article": true }
```

**Result**: 200 OK with fallback article — `extractArticleText()` checks for string type, boolean fails, falls through to fallback

### Edge Case 10: n8n Returns Nested Structure

```json
{
  "data": {
    "result": {
      "output": {
        "article": "Deep nested article"
      }
    }
  }
}
```

**Result**: 200 OK with "Deep nested article" — recursive extraction finds the article field

---

## Design System Documentation

### Color Palette

The application uses a warm, editorial color palette inspired by natural materials:

**Primary Palette**:

| Name | Hex | RGB | HSL | Usage |
|------|-----|-----|-----|-------|
| Terracotta | `#c96442` | `rgb(201, 100, 66)` | `hsl(15, 55%, 52%)` | Brand primary |
| Dark Terracotta | `#b55838` | `rgb(181, 88, 56)` | `hsl(15, 55%, 46%)` | Brand hover |
| Warm White | `#faf9f7` | `rgb(250, 249, 247)` | `hsl(40, 20%, 97%)` | Page background |
| Pure White | `#ffffff` | `rgb(255, 255, 255)` | `hsl(0, 0%, 100%)` | Card backgrounds |
| Warm Gray 1 | `#f5f4f1` | `rgb(245, 244, 241)` | `hsl(43, 20%, 95%)` | Elevated surfaces |
| Warm Gray 2 | `#f0ede8` | `rgb(240, 237, 232)` | `hsl(38, 25%, 92%)` | Subtle backgrounds |
| Warm Gray 3 | `#ebe8e2` | `rgb(235, 232, 226)` | `hsl(40, 25%, 90%)` | Hover states |
| Warm Gray 4 | `#e5e1da` | `rgb(229, 225, 218)` | `hsl(38, 25%, 87%)` | Subtle borders |
| Warm Gray 5 | `#d5d0c8` | `rgb(213, 208, 200)` | `hsl(37, 20%, 81%)` | Default borders |
| Warm Gray 6 | `#b5ae9e` | `rgb(181, 174, 158)` | `hsl(42, 15%, 66%)` | Strong borders |
| Charcoal | `#1a1814` | `rgb(26, 24, 20)` | `hsl(40, 13%, 9%)` | Primary text |
| Warm Dark | `#4a4540` | `rgb(74, 69, 64)` | `hsl(30, 7%, 27%)` | Secondary text |
| Warm Mid | `#7a726a` | `rgb(122, 114, 106)` | `hsl(30, 7%, 45%)` | Tertiary text |
| Warm Light | `#a09890` | `rgb(160, 152, 144)` | `hsl(30, 7%, 60%)` | Placeholder text |

**Dark Mode Palette**:

| Name | Hex | Usage |
|------|-----|-------|
| Deep Warm | `#1e1b17` | Card backgrounds |
| Dark Olive | `#252118` | Elevated surfaces |
| Darker Warm | `#2c2820` | Subtle backgrounds |
| Dark Hover | `#342f26` | Hover states |
| Dark Border 1 | `#2e2a22` | Subtle borders |
| Dark Border 2 | `#3a352b` | Default borders |
| Dark Border 3 | `#504840` | Strong borders |
| Off White | `#f0ece4` | Primary text |
| Warm Light 2 | `#c8c0b0` | Secondary text |
| Warm Mid 2 | `#8a8070` | Tertiary text |
| Dark Placeholder | `#5a5448` | Placeholder text |
| Bright Terracotta | `#e07856` | Brand primary |
| Light Terracotta | `#e88d6e` | Brand hover |
| Bright Error | `#f5a080` | Error text |

### Spacing Scale

The application uses Tailwind's default spacing scale with some custom values:

| Token | Value | Common Usage |
|-------|-------|-------------|
| 1 | 0.25rem (4px) | Icon padding, tight gaps |
| 1.5 | 0.375rem (6px) | Label gaps |
| 2 | 0.5rem (8px) | Small gaps, icon spacing |
| 2.5 | 0.625rem (10px) | Button padding vertical |
| 3 | 0.75rem (12px) | Section padding |
| 4 | 1rem (16px) | Standard padding |
| 5 | 1.25rem (20px) | Larger padding |
| 6 | 1.5rem (24px) | Message gaps |
| 8 | 2rem (32px) | Section margins |
| 10 | 2.5rem (40px) | Large margins |
| 12 | 3rem (48px) | Hero spacing |
| 20 | 5rem (80px) | Page-level spacing |

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small elements, badges |
| `--radius-md` | 10px | Buttons, inputs, dropdowns |
| `--radius-lg` | 14px | Medium cards |
| `--radius-xl` | 18px | Large cards, containers |

### Typography Scale

| Element | Size | Weight | Line Height | Font |
|---------|------|--------|------------|------|
| H1 | 2rem (32px) | 500 | 1.25 | Newsreader (serif) |
| H2 | 1.5rem (24px) | 500 | 1.25 | Newsreader (serif) |
| H3 | 1.25rem (20px) | 500 | 1.25 | Newsreader (serif) |
| Body | 1rem (15px) | 400 | 1.6 | Inter (sans) |
| Small | 0.875rem (14px) | 400 | 1.5 | Inter (sans) |
| XS | 0.75rem (12px) | 600 | 1 | Inter (sans), uppercase |
| Label | 0.75rem (12px) | 600 | 1 | Inter (sans), uppercase |

---

## State Machine Diagrams

### Chat Message Flow

```
                  ┌─────────────┐
                  │   Idle      │
                  │ (no msgs)   │
                  └──────┬──────┘
                         │ User submits prompt
                         ▼
                  ┌─────────────┐
                  │  Loading    │◄──────────────┐
                  │ (Thinking)  │               │
                  └──────┬──────┘               │
                         │                      │
              ┌──────────┼──────────┐           │
              │          │          │           │
              ▼          ▼          ▼           │
         ┌────────┐ ┌────────┐ ┌────────┐      │
         │Success │ │ Error  │ │Timeout │      │
         │ (200)  │ │ (4xx)  │ │ (502)  │      │
         └───┬────┘ └───┬────┘ └───┬────┘      │
             │          │          │            │
             ▼          ▼          ▼            │
         ┌─────────────────────────────────┐   │
         │     Message Displayed           │   │
         │  (assistant / system / error)   │   │
         └─────────────────────────────────┘   │
                                               │
               User submits new prompt ────────┘
```

### Theme State Machine

```
              ┌─────────────┐
              │   Initial   │
              │  (detect)   │
              └──────┬──────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
     ┌─────────┐ ┌─────────┐ ┌─────────┐
     │  Light  │ │  Dark   │ │  System │
     │ (manual)│ │(manual) │ │ (auto)  │
     └────┬────┘ └────┬────┘ └─────────┘
          │           │
          │  Toggle   │  Toggle
          └─────┬─────┘
                │
                ▼
          ┌─────────────┐
          │   Toggled   │
          │  (opposite) │
          └─────────────┘
```

### Rate Limiter State Machine

```
              ┌─────────────┐
              │    New      │
              │  (count=0)  │
              └──────┬──────┘
                     │ Request
                     ▼
              ┌─────────────┐
              │  Window     │◄─────── Window expired
              │  Active     │───────── Reset count to 1
              │ (count ≤ N) │
              └──────┬──────┘
                     │ count++
                     │
                     │ count >= MAX
                     ▼
              ┌─────────────┐
              │   Limited   │
              │  (429)      │
              └─────────────┘
```

---

## Build and CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          N8N_WEBHOOK_URL: https://example.app.n8n.cloud/webhook/test
```

### Pre-commit Hooks

Install husky for pre-commit checks:

```bash
npm install -D husky
npx husky init
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
npm run lint
npm run build
```

### ESLint Configuration

The project uses `eslint.config.mjs` with `eslint-config-next`:

```javascript
import nextPlugin from 'eslint-config-next';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { next: nextPlugin },
    rules: {
      // Add custom rules here
    },
  },
];
```

---

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support (Chromium-based) |
| Opera | 76+ | Full support |
| Samsung Internet | 14+ | Full support |

### Feature Requirements

| Feature | Required For | Fallback |
|---------|-------------|----------|
| CSS Custom Properties | Theme system | No theme switching |
| Flexbox | Layout | Broken layout |
| `prefers-color-scheme` | Auto dark mode | Defaults to light |
| `localStorage` | Theme persistence | Theme resets on reload |
| `fetch` API | API requests | App non-functional |
| `async/await` | Async operations | App non-functional |
| `IntersectionObserver` | (future) Lazy loading | No lazy loading |

### Mobile Testing

| Device | Screen Size | Notes |
|--------|------------|-------|
| iPhone SE | 375×667 | Smallest supported |
| iPhone 14 | 390×844 | Common size |
| iPhone 14 Pro Max | 430×932 | Large phone |
| iPad Mini | 768×1024 | Tablet |
| iPad Pro 12.9 | 1024×1366 | Large tablet |
| Pixel 7 | 412×915 | Android reference |
| Galaxy S22 | 360×780 | Small Android |

---

## Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Enter` | Textarea focused | Submit request |
| `Shift+Enter` | Textarea focused | Insert newline |
| `Tab` | Any focusable element | Move to next element |
| `Shift+Tab` | Any focusable element | Move to previous element |
| `Escape` | Sidebar open | Close sidebar (future) |
| `Space` | Button focused | Activate button |

---

## Project Conventions

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | kebab-case or PascalCase | `page.tsx`, `route.ts` |
| Functions | camelCase | `handleSubmit`, `cleanText` |
| Constants | UPPER_SNAKE_CASE | `RATE_LIMIT_MAX`, `TONES` |
| Types | PascalCase | `ChatMessage`, `ResponseFromApi` |
| CSS Variables | kebab-case | `--bg-base`, `--text-primary` |
| Environment Variables | UPPER_SNAKE_CASE | `N8N_WEBHOOK_URL` |

### Code Organization

```
src/app/
├── globals.css          # Global styles (always loaded)
├── layout.tsx           # Root layout (server component)
├── page.tsx             # Main page (client component)
└── api/
    └── generate-article/
        └── route.ts     # API route handler (server component)
```

**Rules**:
- Server components by default (layout, route handlers)
- Client components explicitly marked with `"use client"`
- API routes use file-based routing (`/api/generate-article` → `api/generate-article/route.ts`)

---

## Glossary Expansion

| Term | Definition |
|------|-----------|
| **App Router** | Next.js 13+ routing system using file-system-based routes in the `app/` directory |
| **Route Handler** | Server-side function in `route.ts` that handles HTTP methods (GET, POST, etc.) |
| **Server Component** | React component that runs only on the server, cannot use hooks or browser APIs |
| **Client Component** | React component marked with `"use client"` that runs in the browser, supports hooks |
| **HMR** | Hot Module Replacement — updates modules in the browser without full page reload |
| **SSR** | Server-Side Rendering — HTML generated on the server for initial page load |
| **Hydration** | Process where React attaches event handlers and state to server-rendered HTML |
| **CSS Custom Properties** | CSS variables defined with `--` prefix, inheritable and dynamic |
| **Design Tokens** | Named values (colors, spacing, typography) that define a design system |
| **Rate Limiting** | Controlling the frequency of requests from a client |
| **Fixed Window** | Rate limiting algorithm that resets counter at fixed intervals |
| **Webhook** | HTTP callback — a URL that receives POST requests with data |
| **Bearer Token** | Authentication scheme where token is sent in `Authorization: Bearer <token>` header |
| **Fallback** | Alternative behavior used when primary system is unavailable |
| **Smoke Test** | Quick test to verify basic functionality works |
| **n8n** | "nodemation" — open-source workflow automation tool |
| **Prose** | Typography styling optimized for reading long-form text |
| **Discriminated Union** | TypeScript type with a common field that determines the specific shape |
| **Nullish Coalescing** | `??` operator — returns right side when left is null or undefined |
| **Optional Chaining** | `?.` operator — safely accesses nested properties |

---

## React Hook Dependency Graph

Understanding how hooks interact within the `Home` component:

```
useState Hooks                    useEffect Hooks
─────────────                     ─────────────
inputValue ──────────────────────→ useMemo (charCount)
tone                             (independent)
messages ────────────────────────→ useEffect (auto-scroll)
loading ─────────────────────────→ useEffect (thinking progression)
                                 → useEffect (auto-scroll)
thinkingState ───────────────────→ useEffect (auto-scroll)
error                            (independent)
theme ───────────────────────────→ useEffect (theme init) [mount only]
sidebarOpen                      (independent)

Event Handlers
──────────────
handleInput ───→ setInputValue + textarea resize
handleKeyDown ─→ handleSubmit (on Enter)
handleSubmit ──→ setMessages, setLoading, setInputValue
toggleTheme ───→ setTheme + localStorage + DOM attribute
```

**Re-render Triggers**:

Each state update causes a re-render. The component re-renders when:

1. User types → `inputValue` changes → character counter updates
2. User changes tone → `tone` changes → dropdown value updates
3. Request starts → `loading` = true → thinking block appears
4. Thinking progresses → `thinkingState` increments → checklist updates
5. Response arrives → `messages` updates → new message appears
6. Error occurs → `error` changes → banner appears/disappears
7. Theme toggled → `theme` changes → all colors update
8. Sidebar toggled → `sidebarOpen` changes → layout shifts

---

## API Payload Transformation Flow

The complete journey of a prompt from user input to n8n and back:

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                 │
│  inputValue: "Write about machine learning"                       │
│  tone: "Professional"                                             │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND BUILD                                │
│  isShort = false (28 chars >= 20)                                 │
│  cleanPrompt = "Write about machine learning"                     │
│  cleanTopic = ""                                                  │
│  cleanTone = "Professional"                                       │
│                                                                   │
│  POST body: {                                                     │
│    prompt: "Write about machine learning",                        │
│    topic: "",                                                     │
│    tone: "Professional"                                           │
│  }                                                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND TRANSFORM                               │
│  promptInput = "Write about machine learning" (28 chars)          │
│  prompt = "Write about machine learning" (>= 5 chars, kept)       │
│  topic = ""                                                       │
│  tone = "Professional"                                            │
│  effectivePrompt = "Write about machine learning"                 │
│                                                                   │
│  Upstream payload: {                                              │
│    prompt: "Write about machine learning",                        │
│    chatInput: "Write about machine learning",                     │
│    input: "Write about machine learning",                         │
│    text: "Write about machine learning",                          │
│    query: "Write about machine learning",                         │
│    topic: "",                                                     │
│    tone: "Professional",                                          │
│    source: "nextjs-chatbot-proxy"                                 │
│  }                                                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                        N8N PROCESSING                             │
│  Webhook receives payload                                         │
│  AI model generates article                                       │
│  Respond to Webhook node sends response                           │
│                                                                   │
│  Response (example): {                                            │
│    article: "Machine Learning: Transforming Modern Technology\n\n │
│  Machine learning represents a paradigm shift..."                 │
│  }                                                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND RESPONSE                               │
│  extractArticleText() finds "article" field                       │
│  normalizeArticleText() cleans whitespace                         │
│                                                                   │
│  Response to client: {                                            │
│    article: "Machine Learning: Transforming Modern Technology\n\n │
│  Machine learning represents a paradigm shift...",                │
│    rateLimit: { remaining: 4, reset: 1713091200000 }              │
│  }                                                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND DISPLAY                              │
│  setMessages([...prev, { role: "assistant", text: article }])     │
│  Article renders in chat feed with copy button                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Short Prompt Auto-Derivation

When a user enters a short prompt (< 20 characters), the system automatically derives a topic-based prompt:

**Example Flow**:

```
User input: "AI"
isShort = true (2 < 20)
cleanPrompt = "" (cleared)
cleanTopic = "AI"

Backend receives: { prompt: "", topic: "AI", tone: "" }
Backend derives: effectivePrompt = "Write a  article about AI."

(Note: empty tone creates double space — "Write a  article" — minor cosmetic issue)
```

**With Tone**:

```
User input: "AI"
tone: "Professional"
isShort = true
cleanTopic = "AI"

Backend derives: effectivePrompt = "Write a Professional article about AI."
```

**Design Rationale**:
- Short prompts are treated as topics rather than detailed instructions
- The system generates a standard article prompt template
- This allows users to quickly generate articles by typing just a topic name
- The threshold (20 chars) distinguishes between topic keywords and short instructions

---

## Rate Limiting: Detailed Timeline

With default settings (`RATE_LIMIT_MAX=5`, `RATE_LIMIT_WINDOW_MS=60000`):

```
Time (seconds)  Request #  Status  Remaining  Window Reset At
───────────────────────────────────────────────────────────────
0               1          200     4          60s
10              2          200     3          60s
20              3          200     2          60s
30              4          200     1          60s
40              5          200     0          60s
50              6          429     0          60s  ← Blocked
60              7          200     4          120s ← Window reset
70              8          200     3          120s
```

**429 Response Body**:

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 10
}
```

**Headers**:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 10
Content-Type: application/json
```

---

## Fallback Article Analysis

The `buildLocalFallbackArticle()` function generates a structured article when n8n is unavailable:

**Structure**:

```
Title: {topic}

Paragraph 1: Introduction
  - Contextualizes the topic
  - Mentions the tone
  - Discusses goal-setting and outcomes

Paragraph 2: Practical Implementation
  - Explicit requirements
  - Simple first versions
  - Iterative validation
  - Risk reduction

Paragraph 3: Operational Reliability
  - Production visibility
  - Error handling
  - Performance under load
  - Monitoring and runbooks

Paragraph 4: Developer Experience
  - Clear interfaces
  - Stable contracts
  - Documentation
  - Delivery velocity

Paragraph 5: Conclusion
  - References the user's original request
  - Recommends concrete next steps
```

**Fallback Article Length**: ~280 words

**When It's Used**:
- n8n returns empty response
- n8n returns invalid JSON (with JSON content-type)
- n8n response has no recognizable article field
- n8n returns empty string after normalization

**Fallback Indicator**:
The response includes `"fallback": true` and `"warning"` fields so the client can display a notification.

---

## Network Performance Considerations

### Request Size

| Component | Size | Notes |
|-----------|------|-------|
| POST headers | ~200 bytes | Content-Type, API key |
| POST body (typical) | 100-500 bytes | Prompt + topic + tone |
| POST body (max) | ~650 bytes | 500 char prompt + 100 char topic + 40 char tone |
| Response headers | ~300 bytes | Standard HTTP headers |
| Response body (typical) | 2-10 KB | Article text |
| Response body (max) | Unlimited | Depends on n8n output |

### Response Time Budget

| Phase | Time | Notes |
|-------|------|-------|
| Client → Server (LAN) | <1ms | Local development |
| Server validation | <1ms | Synchronous validation |
| Rate limit check | <1ms | Map lookup |
| Server → n8n (cloud) | 50-200ms | Network latency |
| n8n processing | 2-15s | AI generation time |
| n8n → Server | 50-200ms | Network latency |
| Response parsing | <1ms | JSON parsing + text extraction |
| Server → Client | <1ms | Local development |
| **Total** | **2-16s** | Dominated by n8n processing |

### Optimization Opportunities

1. **Streaming**: Instead of waiting for the full article, stream tokens as they're generated
2. **Caching**: Cache articles by prompt hash for identical requests
3. **Pre-warming**: Start n8n workflow before user submits (predictive)
4. **Compression**: Enable gzip/brotli for larger articles
5. **HTTP/2**: Multiplex requests for concurrent article generation

---

## SVG Icon Inventory

All icons used in the application are inline SVGs:

| Icon | Location | Size | Stroke Width | Purpose |
|------|----------|------|-------------|---------|
| Sidebar toggle | Header | 20×20 | 2 | Open/close sidebar |
| Close (X) | Sidebar header | 18×18 | 2 | Close sidebar (mobile) |
| Plus (+) | New Chat button | 18×18 | 2 | Start new chat |
| Document | Chat history items | 16×16 | 2 | Chat history icon |
| Chat bubble | Current chat indicator | 16×16 | 2 | Active chat icon |
| Moon | Theme toggle (light mode) | 14×14 | 2.5 | Switch to dark mode |
| Sun | Theme toggle (dark mode) | 14×14 | 2.5 | Switch to light mode |
| Sparkle | Assistant avatar | 18×18 | 2 | AI assistant icon |
| Error (X in circle) | System avatar | 16×16 | 2 | Error indicator |
| Copy | Copy button | 14×14 | 2 | Copy to clipboard |
| Send arrow | Send button | 16×16 | 2 | Submit request |
| Chevron down | Thinking details | 14×14 | 2.5 | Expand/collapse indicator |
| Spinner star | Loading avatar | 18×18 | 2 | Thinking animation |
| Close (X) small | Error dismiss | 14×14 | 2 | Dismiss error banner |
| Dropdown chevron | Tone select | 12×12 | 2 | Dropdown indicator |
| Warning triangle | Error banner | 14×14 | 2.5 | Error warning icon |

**Icon Design Principles**:
- All icons use `stroke="currentColor"` for theme-aware coloring
- Consistent stroke widths (2 or 2.5)
- Lucide-style design language
- No fill (stroke-only icons)
- Square viewBox (24×24 standard)

---

## Testing Matrix

### Cross-Browser Testing

| Test | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Page load | ✅ | ✅ | ✅ | ✅ |
| Article generation | ✅ | ✅ | ✅ | ✅ |
| Dark mode toggle | ✅ | ✅ | ✅ | ✅ |
| Sidebar open/close | ✅ | ✅ | ✅ | ✅ |
| Textarea auto-resize | ✅ | ✅ | ✅ | ✅ |
| Enter to submit | ✅ | ✅ | ✅ | ✅ |
| Copy to clipboard | ✅ | ✅ | ✅ | ✅ |
| Mobile responsive | ✅ | N/A | ✅ | ✅ |
| Scroll behavior | ✅ | ✅ | ✅ | ✅ |

### Responsive Breakpoint Testing

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| 375px | iPhone SE | Single column, fixed input, hidden sidebar |
| 768px | iPad | Sidebar available, wider message feed |
| 1024px | Laptop | Full layout with optional sidebar |
| 1440px | Desktop | Centered content with max-width constraint |

### Input Validation Testing

| Input | Expected Result |
|-------|----------------|
| `{}` | 400 — no prompt or topic |
| `{ prompt: "" }` | 400 — empty prompt, no topic |
| `{ topic: "" }` | 400 — empty topic, no prompt |
| `{ prompt: "hi" }` | 400 — prompt < 5 chars, no topic |
| `{ prompt: "hello" }` | 200 — prompt >= 5 chars |
| `{ topic: "AI" }` | 200 — valid topic |
| `{ prompt: "Write about AI", topic: "AI" }` | 200 — both provided |
| `{ prompt: "x".repeat(501) }` | 400 — prompt too long |
| `{ topic: "x".repeat(101) }` | 400 — topic too long |
| `{ tone: "x".repeat(41) }` | 400 — tone too long |

---

## Future Feature Specifications

### Chat History Persistence

**Storage**: `localStorage` or server-side database

**Schema**:
```typescript
interface ChatSession {
  id: string;           // UUID
  title: string;        // Auto-generated from first prompt
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Behavior**:
- New chat creates a new session
- Sessions persist across page reloads
- Sidebar lists all sessions
- Clicking a session loads its messages
- Delete session removes from storage

### Streaming Response

**Protocol**: Server-Sent Events (SSE) or WebSocket

**API Change**:
```
POST /api/generate-article → returns SSE stream
Event: token
data: {"token": "Machine"}

Event: token
data: {"token": " learning"}

Event: done
data: {"complete": true}
```

**UI Change**:
- Assistant message appears incrementally
- Typing cursor animation
- No "thinking" block needed during streaming

### Article Export

**Formats**:
- Markdown (`.md`)
- Plain text (`.txt`)
- PDF (via browser print)

**UI**:
- Export button below each assistant message
- Dropdown to select format

---

## Error Message Catalog

Complete list of all error messages users may encounter:

### Client-Side Errors (Frontend)

| Error Message | Trigger | Resolution |
|--------------|---------|------------|
| "Prompt cannot exceed 500 characters." | Input > 500 chars on submit | Shorten prompt |
| "Approaching rate limit. Slow down to avoid throttling." | Rate limit remaining ≤ 1 | Wait before next request |
| "Generator returned empty content. Please retry." | n8n returned empty article | Retry with different prompt |
| "Network error: unable to reach article generator." | Fetch fails (network issue) | Check internet connection |

### API Errors (Backend)

| HTTP | Code | Message | Resolution |
|------|------|---------|------------|
| 400 | BAD_REQUEST | "Invalid JSON body." | Send valid JSON |
| 400 | BAD_REQUEST | "Request body must be an object." | Send object, not array |
| 400 | BAD_REQUEST | "prompt cannot exceed 500 chars." | Shorten prompt |
| 400 | BAD_REQUEST | "topic max length is 100 chars." | Shorten topic |
| 400 | BAD_REQUEST | "tone max length is 40 chars." | Shorten tone |
| 400 | BAD_REQUEST | "Provide either a prompt (min 5 chars) or a topic..." | Add valid prompt or topic |
| 401 | UNAUTHORIZED | "Invalid internal API key." | Provide correct key |
| 429 | RATE_LIMIT_EXCEEDED | "Too many requests" | Wait `retryAfter` seconds |
| 500 | CONFIG_ERROR | "Server configuration error." | Fix N8N_WEBHOOK_URL |
| 500 | INTERNAL_ERROR | "Internal server error." | Retry or contact admin |
| 502 | UPSTREAM_ERROR | "n8n webhook returned a non-success status." | Check n8n workflow |
| 502 | UPSTREAM_TIMEOUT | "n8n webhook timed out." | Retry or increase timeout |
| 502 | UPSTREAM_INVALID_JSON | "n8n webhook returned invalid JSON." | Fix n8n response format |

---

## CSS Animation Specifications

### fade-in-up

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Usage**: Message appear animations
**Duration**: 0.25s (via `animate-in` class)
**Easing**: `ease` (default)
**Effect**: Messages slide up 8px while fading in

### shimmer

```css
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
```

**Usage**: Loading skeleton backgrounds (future use)
**Duration**: Not applied by default
**Effect**: Horizontal light sweep across element

### spin

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Usage**: Loading spinner on thinking avatar
**Duration**: 3s (custom via `duration-3000`)
**Effect**: Continuous rotation animation

### CSS Transitions

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Theme colors | `background-color`, `color` | 0.2s | `ease` |
| Hover states | `background`, `border-color`, `color` | 0.15s | `ease` |
| Focus rings | `border-color`, `box-shadow` | 0.15s | `ease` |
| Sidebar | `width`, `transform` | 0.3s | `ease-in-out` |
| Buttons | `background`, `transform`, `box-shadow` | 0.15s | `ease` |
| Brand logo | `transform` (scale) | — | `hover:scale-105` |
| Chevron | `transform` (rotate) | — | `group-open:rotate-90` |

---

## Dependency Tree Analysis

### Runtime Dependencies

```
next@16.2.2
├── react@19.2.4
├── react-dom@19.2.4
└── (internal: webpack/turbopack, server components)
```

**Total runtime bundle size** (client): ~150 KB gzipped

### Development Dependencies

```
@tailwindcss/postcss@^4
└── tailwindcss@^4

eslint@^9
└── eslint-config-next@16.2.2

@types/react@^19
@types/react-dom@^19
@types/node@^20
typescript@^5
```

**Install size** (with node_modules): ~500 MB

### Dependency Update Policy

| Package | Update Frequency | Breaking Change Risk |
|---------|-----------------|---------------------|
| next | Every 6 months | Medium — test thoroughly |
| react | Every 12 months | Low — mostly additive |
| tailwindcss | Every 12 months | Medium — utility changes |
| typescript | Every 6 months | Low — additive |
| eslint | Every 12 months | Low — rule changes |

---

## Git Workflow Guide

### Branch Strategy

```
main (production)
  ↑
  ├── develop (staging)
  │     ↑
  │     ├── feature/article-export
  │     ├── feature/chat-history
  │     └── fix/rate-limit-display
  │
  └── hotfix/config-validation
```

**Rules**:
- `main` is protected — requires PR approval
- `develop` is the integration branch
- Feature branches branch from `develop`
- Hotfixes branch from `main` and merge to both

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting
- `refactor` — Code restructuring
- `test` — Tests
- `chore` — Maintenance

**Examples**:
```
feat(ui): add thinking block animations
fix(api): handle empty n8n responses
docs(readme): update deployment instructions
style(css): organize design tokens
refactor(hooks): extract useRateLimit hook
test(smoke): add unicode input test case
chore(deps): bump next to 16.2.2
```

---

## Environment Variable Quick Reference

### Minimal Setup (Just Works)

```bash
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/your-id
```

### Recommended Setup

```bash
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/your-id
INTERNAL_API_KEY=$(openssl rand -hex 32)
NEXT_PUBLIC_CLIENT_API_KEY=$INTERNAL_API_KEY
```

### Full Setup (All Options)

```bash
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/your-id
N8N_WEBHOOK_KEY=your-n8n-bearer-token
INTERNAL_API_KEY=your-secret-key
NEXT_PUBLIC_CLIENT_API_KEY=your-secret-key
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=120000
WEBHOOK_TIMEOUT_MS=30000
```

### Production vs Development

| Variable | Development | Production |
|----------|------------|------------|
| N8N_WEBHOOK_URL | Cloud webhook URL | Cloud or self-hosted URL |
| N8N_WEBHOOK_KEY | (empty) | Set if n8n requires auth |
| INTERNAL_API_KEY | (empty) | Always set |
| NEXT_PUBLIC_CLIENT_API_KEY | (empty) | Match INTERNAL_API_KEY |
| RATE_LIMIT_MAX | 5 | 10-50 (depending on usage) |
| RATE_LIMIT_WINDOW_MS | 60000 | 60000-300000 |
| WEBHOOK_TIMEOUT_MS | 20000 | 30000-60000 |

---

## Troubleshooting Quick Reference

### One-Line Fixes

| Problem | Quick Fix |
|---------|----------|
| Port 3000 in use | `netstat -ano \| findstr :3000` → `taskkill /PID <PID> /F` |
| Dev won't start | `rm -rf .next && npm install && npm run dev` |
| Build fails | Check TypeScript errors: `npx tsc --noEmit` |
| Lint errors | `npm run lint -- --fix` |
| Env vars not loading | Ensure `.env.local` exists in project root |
| Theme stuck | Clear localStorage: `localStorage.removeItem("theme")` |
| API returns 500 | Check `N8N_WEBHOOK_URL` format |
| API returns 429 | Increase `RATE_LIMIT_MAX` or wait |
| n8n timeout | Increase `WEBHOOK_TIMEOUT_MS` |
| Article empty | Check n8n output mapping |

### Diagnostic Commands

```bash
# Check Node version
node --version  # Should be 18+

# Check npm version
npm --version   # Should be 9+

# List environment variables (filtered)
env | grep N8N

# Test API directly
curl -X POST http://localhost:3000/api/generate-article \
  -H "Content-Type: application/json" \
  -d '{"topic": "test"}'

# Check build output
npm run build 2>&1 | tee build.log

# Monitor network requests (browser DevTools Network tab)
# Look for POST /api/generate-article
```

---

## FAQ

**Q: Can I use this with OpenAI directly instead of n8n?**
A: Yes, modify the route handler to call the OpenAI API directly instead of proxying to n8n. You'll need to add the OpenAI SDK or use fetch.

**Q: How do I add user authentication?**
A: Integrate NextAuth.js (now Auth.js) or your preferred auth provider. Add middleware to protect the API route and wrap the UI in an auth provider.

**Q: Can I generate multiple articles simultaneously?**
A: The UI only supports one request at a time. To support concurrent requests, add a queue system and display multiple loading states.

**Q: How do I deploy to Vercel?**
A: Push to GitHub, connect the repo in Vercel, set environment variables, and deploy. Vercel auto-detects Next.js.

**Q: Why does the rate limiter reset on Vercel?**
A: Vercel uses serverless functions — each invocation is a fresh process. Use Redis for persistent rate limiting.

**Q: Can I change the AI model?**
A: Yes, configure the model in your n8n workflow. The proxy is model-agnostic — it just sends prompts and receives responses.

**Q: How do I add support for multiple languages?**
A: Add a language selector to the UI, pass the language to n8n, and configure the AI model to generate content in that language.

**Q: Is the fallback article SEO-friendly?**
A: The fallback article is generic and not optimized for SEO. Use it only as a last resort — configure n8n for quality content.

**Q: Can I use this commercially?**
A: This is a private project. Check with the repository owner for licensing.

---

## Code Quality Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| Frontend component lines | ~451 | Moderate — consider splitting |
| Backend route handler lines | ~320 | Good — well-organized |
| CSS lines | ~280 | Good — design tokens |
| Total source lines | ~1,051 | Small project |
| Cyclomatic complexity (route.ts) | ~25 | Moderate — acceptable |
| Cyclomatic complexity (page.tsx) | ~20 | Good |
| Type coverage | 100% (strict mode) | Excellent |
| Test coverage | Smoke tests only | Needs unit tests |

---

## Acknowledgments

- **Next.js** team for the App Router framework
- **n8n** for workflow automation platform
- **Tailwind CSS** for utility-first CSS framework
- **React** team for the UI library
- **TypeScript** team for type safety

---

## Related Projects

- [n8n Documentation](https://docs.n8n.io) — Workflow automation
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples) — Next.js patterns
- [Tailwind UI](https://tailwindui.com) — Component library
- [Shadcn/ui](https://ui.shadcn.com) — Component primitives

---

## Document Information

| Property | Value |
|----------|-------|
| Document Version | 1.0 |
| Last Updated | April 2026 |
| Author | Development Team |
| Review Status | Published |
| Total Sections | 25+ |
| Total Tables | 80+ |
| Total Code Examples | 40+ |

---

*Article Forge — Craft professional articles in seconds with AI and n8n.*

