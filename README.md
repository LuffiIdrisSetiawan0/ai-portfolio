# Luffi Idris Setiawan — AI Engineer Portfolio

A production-grade portfolio for an AI engineer, built around a **live multi-agent
orchestration demo**. Visitors give the team an objective and watch a
**Planner → Researcher → Writer → Critic** pipeline collaborate and stream its
thinking, token by token.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- **Flagship:** a real multi-agent pipeline with typed SSE streaming
- **LLM:** provider-agnostic (OpenAI-compatible by default — e.g. **Sumopod** — or Anthropic-native)
- **Design:** custom dark "Orchestration Deck" system, zero UI dependencies
- **Deploy:** Vercel (serverless streaming route, `maxDuration = 60`)

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your key (optional — see below)
npm run dev                  # http://localhost:3000
```

Without an API key the demo runs in a realistic **simulated** mode (no errors,
no cost). Add a key to make it **live**.

## Going live with your LLM (Sumopod / OpenAI / Anthropic)

Edit `.env.local`:

```ini
LLM_PROVIDER=openai                       # "openai" (gateways like Sumopod) | "anthropic"
LLM_BASE_URL=https://ai.sumopod.com/v1    # confirm exact base URL in your provider dashboard
LLM_API_KEY=sk-...                        # your key
LLM_MODEL=claude-3-5-sonnet               # exact model id your provider exposes
```

> ⚠️ Confirm `LLM_BASE_URL` and `LLM_MODEL` from your **Sumopod dashboard** — the
> base URL above is the common pattern but verify it. If Sumopod gives you an
> Anthropic-native endpoint instead, set `LLM_PROVIDER=anthropic` and
> `LLM_BASE_URL=https://api.anthropic.com`.

The status badge in the demo shows **LIVE · <model>** when a key is detected, or
**DEMO** otherwise. If a live call fails mid-run, it degrades gracefully to the
simulated engine so the page never hard-breaks.

## Make it yours

Everything you'd want to edit lives in one file: [`src/lib/content.ts`](src/lib/content.ts)
— name, headline, about copy, skills, projects, social links, and the example
prompts. Add your GitHub/LinkedIn/résumé URLs there (empty links are hidden
automatically).

## Project structure

```
src/
  app/
    layout.tsx              fonts (Bricolage Grotesque / Geist / JetBrains Mono) + SEO
    page.tsx                composes all sections
    globals.css             the "Orchestration Deck" design system
    icon.svg                favicon
    opengraph-image.tsx     dynamic social-share image (next/og)
    api/agents/route.ts     POST = SSE multi-agent stream · GET = status
  lib/
    content.ts              ← all editable copy
    llm.ts                  provider-agnostic streaming client
    agents.ts               agent prompts + orchestrator (+ simulated fallback)
    types.ts                shared SSE event contract
  components/               Hero, About, DemoSection, AgentDemo, Skills, Projects, …
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it on [vercel.com/new](https://vercel.com/new) (framework auto-detected).
3. Add the env vars from `.env.local` in **Project → Settings → Environment Variables**
   (set `NEXT_PUBLIC_SITE_URL` to your final domain).
4. Deploy. The streaming `/api/agents` route runs as a serverless function.

```bash
# or from the CLI:
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

---

Built with Next.js · streamed by agents.
