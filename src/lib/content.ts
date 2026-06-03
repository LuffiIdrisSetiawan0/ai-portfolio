/* ============================================================================
 *  PORTFOLIO CONTENT  —  EDIT THIS FILE to personalize everything.
 *  This is the single source of truth for all copy shown on the site.
 *  Fields marked  // ✏️  are the ones you'll most likely want to change.
 * ========================================================================== */

export const profile = {
  name: "Luffi Idris Setiawan",
  role: "AI Engineer",
  // Short punchy headline used in the hero (kept short, the gradient word is split out)
  headlinePre: "I build",
  headlineAccent: "multi-agent systems",
  headlinePost: "that think, plan, and ship.",
  // One-liner under the headline
  subhead:
    "AI Engineer focused on agentic orchestration, LLM applications, and retrieval systems — turning frontier models into reliable products.",
  location: "Indonesia · Remote-friendly", // ✏️
  email: "luffiidrissetiawan@gmail.com",
  availability: "Open to AI Engineer roles",
  metaDescription:
    "Luffi Idris Setiawan — AI Engineer building multi-agent systems, LLM applications, and RAG pipelines. Explore a live multi-agent orchestration demo.",

  // ✏️ Fill these in. Leave a value empty ("") and it simply won't render.
  socials: {
    github: "", // e.g. "https://github.com/your-handle"
    linkedin: "", // e.g. "https://linkedin.com/in/your-handle"
    x: "", // e.g. "https://x.com/your-handle"
    resume: "", // e.g. "/resume.pdf"
  },
};

export const aboutParagraphs = [
  "I'm an AI engineer who likes the messy middle: the gap between a model that *can* do something in a notebook and a system that does it reliably, every time, in production.",
  "My focus is agentic AI — designing orchestrations where specialized agents plan, research, write, and critique their own work. I care about the unglamorous parts that make it real: streaming UX, evals, guardrails, cost/latency budgets, and graceful degradation.",
  "The flagship demo on this page is live. It runs a real planner → researcher → writer → critic pipeline against a frontier model and streams every token back to you as the agents hand off to one another.",
];

export const stats: { value: string; label: string }[] = [
  { value: "4", label: "Agents in the live pipeline" },
  { value: "100%", label: "Streamed, token-by-token" },
  { value: "0", label: "Vendor lock-in (provider-agnostic)" },
  { value: "∞", label: "Objectives it can tackle" }, // ✏️ tweak as you like
];

export type SkillGroup = {
  title: string;
  caption: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    title: "Agentic & LLM",
    caption: "orchestration",
    items: [
      "Multi-agent orchestration",
      "Tool / function calling",
      "Planning & reflection loops",
      "Prompt engineering",
      "Streaming (SSE) pipelines",
      "Evals & guardrails",
    ],
  },
  {
    title: "Retrieval (RAG)",
    caption: "grounding",
    items: [
      "Embeddings & vector search",
      "Chunking & re-ranking",
      "Citations & grounding",
      "Hybrid search",
      "pgvector / Pinecone",
    ],
  },
  {
    title: "Engineering",
    caption: "build",
    items: [
      "TypeScript",
      "Python",
      "Next.js / React",
      "FastAPI",
      "Node.js",
      "PostgreSQL / Supabase",
    ],
  },
  {
    title: "Platform & Ops",
    caption: "ship",
    items: [
      "Vercel",
      "Docker",
      "GCP",
      "Serverless / Edge",
      "Observability",
      "CI/CD",
    ],
  },
];

export type Project = {
  title: string;
  tagline: string;
  description: string;
  stack: string[];
  highlights: string[];
  featured?: boolean;
  badge?: string;
  links?: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    title: "Orchestrator",
    tagline: "Live multi-agent pipeline · the demo on this page",
    description:
      "A planner–researcher–writer–critic pipeline that decomposes any objective, gathers context, drafts a deliverable, then critiques and revises it — streaming every token in real time.",
    stack: ["Next.js", "TypeScript", "SSE streaming", "LLM-agnostic", "Edge-ready"],
    highlights: [
      "Typed event stream with per-agent token streaming",
      "Provider-agnostic LLM client (OpenAI-compatible + Anthropic)",
      "Graceful simulated fallback when no API key is present",
    ],
    featured: true,
    badge: "Live",
    links: [{ label: "Try it below ↓", href: "#demo" }],
  },
  {
    title: "Atlas RAG",
    tagline: "Chat-with-your-documents, with citations", // ✏️
    description:
      "A retrieval assistant that ingests documents, builds embeddings, and answers questions with inline citations and confidence — engineered for grounding over guessing.",
    stack: ["Python", "FastAPI", "pgvector", "Embeddings", "React"],
    highlights: [
      "Hybrid search with re-ranking",
      "Streaming answers with source citations",
      "Eval harness for retrieval quality",
    ],
    badge: "Case study",
  },
  {
    title: "Probe",
    tagline: "Eval & observability for LLM apps", // ✏️
    description:
      "Tooling to score, trace, and regression-test prompt/agent changes — so model upgrades are a decision backed by data instead of a vibe.",
    stack: ["TypeScript", "Node.js", "PostgreSQL", "LLM-as-judge"],
    highlights: [
      "Scenario-based scoring & dashboards",
      "Latency / cost budgeting per run",
      "CI gate on quality regressions",
    ],
    badge: "Case study",
  },
];

/* ------------------------------------------------------------------ *
 *  The flagship: agent pipeline definition used by the live demo UI. *
 *  (System prompts live in src/lib/agents.ts)                        *
 * ------------------------------------------------------------------ */
export type AgentMeta = {
  id: "planner" | "researcher" | "writer" | "critic";
  name: string;
  role: string;
  description: string;
  accent: "violet" | "aqua" | "signal" | "amber";
};

export const agentPipeline: AgentMeta[] = [
  {
    id: "planner",
    name: "Planner",
    role: "Decompose",
    description: "Breaks the objective into a focused, ordered plan.",
    accent: "violet",
  },
  {
    id: "researcher",
    name: "Researcher",
    role: "Gather",
    description: "Collects the key facts, angles, and constraints.",
    accent: "aqua",
  },
  {
    id: "writer",
    name: "Writer",
    role: "Synthesize",
    description: "Drafts the deliverable from plan + research.",
    accent: "signal",
  },
  {
    id: "critic",
    name: "Critic",
    role: "Refine",
    description: "Audits the draft, scores it, and drives one revision.",
    accent: "amber",
  },
];

export const exampleObjectives: string[] = [
  "Draft a go-to-market plan for an AI note-taking app",
  "Explain RAG vs. fine-tuning to a non-technical CEO",
  "Design a 3-step onboarding email sequence for a SaaS",
  "Outline a technical blog post on multi-agent systems",
];
