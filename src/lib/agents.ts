import { getLLMConfig, isLLMConfigured, streamLLM } from "./llm";
import type { AgentEvent, AgentId } from "./types";

/* ============================================================================
 *  Multi-agent orchestration.
 *  Sequence: Planner → Researcher → Writer → Critic (review + revise).
 *  Each agent streams tokens; outputs are threaded into the next agent.
 * ========================================================================== */

const ORDER: AgentId[] = ["planner", "researcher", "writer", "critic"];

const SYSTEM: Record<AgentId, string> = {
  planner: `You are PLANNER, the lead strategist of a multi-agent team.
Given an objective, produce a tight, ordered plan for the team to execute.
Output 3–6 numbered steps. Each step is one crisp line (max ~14 words).
No preamble, no conclusion — just the numbered plan.`,

  researcher: `You are RESEARCHER on a multi-agent team.
Given the objective and the planner's steps, surface the key facts, angles,
audience, risks, and constraints the writer needs. Be concrete and specific.
Output 4–7 terse bullet points (start each with "- "). No preamble.`,

  writer: `You are WRITER on a multi-agent team.
Using the objective, the plan, and the research notes, produce the actual
deliverable the user asked for — well-structured and ready to use.
Write the deliverable itself (use markdown headings/lists where helpful).
Do not describe what you are doing; just produce the work. Be concise but complete.`,

  critic: `You are CRITIC, the quality editor of a multi-agent team.
You receive a draft deliverable. First, in 2–3 short bullets, name the most
important improvements (clarity, accuracy, structure, tone).
Then write "---" on its own line, followed by the FINAL, improved version of
the deliverable in full. The final version must be self-contained and polished.`,
};

const MAX_TOKENS: Record<AgentId, number> = {
  planner: 320,
  researcher: 520,
  writer: 950,
  critic: 1000,
};

const TEMPERATURE: Record<AgentId, number> = {
  planner: 0.4,
  researcher: 0.6,
  writer: 0.7,
  critic: 0.45,
};

function buildUserPrompt(
  agent: AgentId,
  objective: string,
  ctx: Record<AgentId, string>,
): string {
  switch (agent) {
    case "planner":
      return `OBJECTIVE:\n${objective}`;
    case "researcher":
      return `OBJECTIVE:\n${objective}\n\nPLAN:\n${ctx.planner}`;
    case "writer":
      return `OBJECTIVE:\n${objective}\n\nPLAN:\n${ctx.planner}\n\nRESEARCH NOTES:\n${ctx.researcher}`;
    case "critic":
      return `OBJECTIVE:\n${objective}\n\nDRAFT DELIVERABLE:\n${ctx.writer}`;
  }
}

/**
 * Run the full pipeline, yielding typed events for SSE streaming.
 * Uses the live LLM when configured; otherwise a realistic simulated run.
 */
export async function* runOrchestration(
  objectiveRaw: string,
  signal?: AbortSignal,
): AsyncGenerator<AgentEvent, void, unknown> {
  const objective = objectiveRaw.trim().slice(0, 600);
  const live = isLLMConfigured();
  const cfg = getLLMConfig();
  const started = Date.now();

  yield {
    type: "run_start",
    objective,
    mode: live ? "live" : "simulated",
    model: live ? cfg.model : "simulated-engine",
  };

  const ctx: Record<AgentId, string> = {
    planner: "",
    researcher: "",
    writer: "",
    critic: "",
  };

  for (let i = 0; i < ORDER.length; i++) {
    if (signal?.aborted) return;
    const agent = ORDER[i];
    yield { type: "agent_start", agent };

    let acc = "";
    try {
      if (live) {
        for await (const delta of streamLLM({
          system: SYSTEM[agent],
          messages: [{ role: "user", content: buildUserPrompt(agent, objective, ctx) }],
          maxTokens: MAX_TOKENS[agent],
          temperature: TEMPERATURE[agent],
          signal,
        })) {
          acc += delta;
          yield { type: "token", agent, text: delta };
        }
      } else {
        for await (const delta of simulateAgent(agent, objective, signal)) {
          acc += delta;
          yield { type: "token", agent, text: delta };
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // If the live call fails mid-run, degrade gracefully to a simulated answer.
      if (live && !signal?.aborted) {
        yield { type: "token", agent, text: "" };
        for await (const delta of simulateAgent(agent, objective, signal)) {
          acc += delta;
          yield { type: "token", agent, text: delta };
        }
        yield { type: "agent_done", agent, meta: { degraded: true, message } };
        if (i < ORDER.length - 1) yield { type: "handoff", from: agent, to: ORDER[i + 1] };
        ctx[agent] = acc;
        continue;
      }
      yield { type: "error", message, agent };
      return;
    }

    ctx[agent] = acc;
    yield { type: "agent_done", agent };
    if (i < ORDER.length - 1) {
      yield { type: "handoff", from: agent, to: ORDER[i + 1] };
    }
  }

  yield { type: "run_done", durationMs: Date.now() - started };
}

/* ------------------------------------------------------------------ *
 *  Simulated engine — keeps the public demo alive without an API key. *
 *  Produces plausible, objective-aware text, streamed word-by-word.   *
 * ------------------------------------------------------------------ */
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function* simulateAgent(
  agent: AgentId,
  objective: string,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const text = simulatedText(agent, objective);
  const tokens = text.match(/\S+\s*/g) ?? [text];
  for (const t of tokens) {
    if (signal?.aborted) return;
    await delay(12 + Math.random() * 26);
    yield t;
  }
}

function simulatedText(agent: AgentId, objective: string): string {
  const o = objective.replace(/\s+/g, " ").trim() || "the objective";
  switch (agent) {
    case "planner":
      return [
        `1. Clarify the goal and intended audience for: "${o}".`,
        `2. Identify the 3 highest-leverage angles to cover.`,
        `3. Gather the facts, constraints, and risks that matter.`,
        `4. Draft the deliverable in a clear, usable structure.`,
        `5. Critique for clarity and accuracy, then revise once.`,
      ].join("\n");
    case "researcher":
      return [
        `- Audience: decision-makers who want signal over noise on "${o}".`,
        `- Core insight: lead with the outcome, then justify with specifics.`,
        `- Constraint: keep it skimmable — headings, short lines, no fluff.`,
        `- Risk: vague claims; every assertion should be concrete or cut.`,
        `- Angle: contrast the naive approach with the better one.`,
        `- Proof: include one example and one measurable detail.`,
      ].join("\n");
    case "writer":
      return [
        `## ${capitalize(o)}`,
        ``,
        `**The short version:** here is a clear, structured take that a reader can act on immediately.`,
        ``,
        `1. **Frame it** — state the goal and who it serves in one line.`,
        `2. **Make the case** — back the goal with two concrete specifics.`,
        `3. **Show the path** — give a small, ordered set of next steps.`,
        ``,
        `> This draft is intentionally tight; the critic will sharpen it next.`,
      ].join("\n");
    case "critic":
      return [
        `- Tighten the opening so the value lands in the first line.`,
        `- Replace any generic phrasing with one concrete example.`,
        `- Ensure the structure is skimmable end-to-end.`,
        ``,
        `---`,
        ``,
        `## ${capitalize(o)}`,
        ``,
        `**Bottom line:** a focused, ready-to-use result that leads with the outcome and backs it with specifics.`,
        ``,
        `1. **Frame** — one sentence on the goal and its audience.`,
        `2. **Evidence** — two concrete, verifiable supporting points.`,
        `3. **Action** — three crisp next steps the reader can take today.`,
        ``,
        `_Connect a live model (set LLM_API_KEY) to replace this simulated run with real agent output._`,
      ].join("\n");
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
