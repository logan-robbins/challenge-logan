# Help Chat — Design Spec
**Date:** 2026-04-30  
**Route:** `/help`  
**Status:** Approved

## Overview

A Claude Code-style streaming chat interface embedded in the site. Public access gated by a single shared password. Multi-turn conversations using the Anthropic Messages API with BrightData and Microsoft Learn MCP servers for live web search and documentation lookup.

## Architecture

### Files

| File | Purpose |
|------|---------|
| `src/app/help/page.tsx` | Thin Next.js page shell |
| `src/app/help/ClaudeChat.jsx` | All UI and state — one component |
| `src/app/api/chat/route.ts` | Streaming POST endpoint |
| `src/components/SiteNav.tsx` | Add "Help" nav item linking to `/help` |

### Request Flow

1. User types a message → client appends to local `messages[]` array
2. `POST /api/chat` with full `{ messages, password }` body
3. Route validates `password === CHAT_PASSWORD` env var (401 if wrong)
4. Route calls `anthropic.messages.stream()` with MCP servers configured
5. Streams raw token chunks back as `ReadableStream`
6. Client reads via `fetch` + `ReadableStream` reader, appends tokens to in-progress assistant message
7. "New Chat" clears `messages[]` — full reset, no server call needed

## API Route (`POST /api/chat`)

**Request body:**
```json
{
  "messages": [{ "role": "user" | "assistant", "content": "string" }],
  "password": "string"
}
```

**Response:** `ReadableStream` of text chunks, `Content-Type: text/plain; charset=utf-8` (no SSE framing — raw text)

**MCP configuration:**
```typescript
betas: ["mcp-client-2025-04-04"],
mcp_servers: [
  {
    type: "url",
    url: `https://mcp.brightdata.com/mcp?token=${process.env.BRIGHTDATA_API_TOKEN}`,
    name: "brightdata",
  },
  {
    type: "url",
    url: "https://learn.microsoft.com/api/mcp",
    name: "microsoft-learn",
  }
]
```

Anthropic's API handles the MCP tool-calling loop server-side. The route handler only pipes the final streamed text — no tool events to parse.

**System prompt:**
> You are an expert engineering assistant with access to BrightData for live web search and scraping, and Microsoft Learn for official Microsoft and Azure documentation. Follow 2026 best practices: cite sources when using tools, use tools proactively when current information would improve your answer, and prefer concise actionable responses.

## Environment Variables

| Variable | Value |
|----------|-------|
| `CHAT_PASSWORD` | shared password for the page |
| `BRIGHTDATA_API_TOKEN` | `cf33cd30-6718-4eca-8fa7-b4b694ee06c1` (from desktop config) |

Microsoft Learn requires no auth — public endpoint.

## UI Design

**Password gate:**
- Full-screen centered form, monospace font, dark background
- Password stored in `sessionStorage` on success — survives page refresh within the tab
- Submitted as `password` field in every POST body

**Chat layout:**
- Dark background: `#08080e` (matches site)
- Monospace font throughout
- Top bar: "Help" label left, "New Chat" button right
- Message list: user messages right-aligned with orange tint (`#f97316`), assistant messages left-aligned in `#aaa`
- Streaming response shows blinking `▋` cursor while tokens arrive
- Bottom input: auto-growing textarea, `Enter` sends, `Shift+Enter` newlines, disabled while streaming

**Component:** Everything in `ClaudeChat.jsx` — no sub-components. Same pattern as `GovernanceApp.jsx` and `WorkflowApp.jsx`.

## Out of Scope

- Conversation persistence (no Firestore storage)
- Per-user sessions or rate limiting
- Markdown rendering (plain text only)
- Mobile-specific layout optimization
