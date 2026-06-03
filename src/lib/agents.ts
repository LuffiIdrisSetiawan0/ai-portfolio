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
Using the objective, the plan, and the research notes, produce the COMPLETE,
polished, ready-to-use deliverable the user asked for — this is the final output.
Make reasonable assumptions; NEVER ask the user for more information.
Keep it tight and COMPLETE: aim for ~350–550 words and FINISH every section —
never stop mid-sentence. Prioritize finishing over exhaustive detail.
Use compact markdown (a few headings, short lists). Do not describe your process.`,

  critic: `You are CRITIC, the quality reviewer of a multi-agent team.
You receive the finished deliverable. Do NOT rewrite it.
Give a quick quality review:
- Start with "Score: X/10" on its own line.
- Then 2–3 short bullets: what's strong, and the most useful improvement(s).
Be specific and concise (under 100 words total).`,
};

const MAX_TOKENS: Record<AgentId, number> = {
  planner: 240,
  researcher: 360,
  writer: 1500, // generous safety net; the prompt bounds output to ~350–550 words
  critic: 280,
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
        `# ${capitalize(o)}`,
        ``,
        `**Bottom line:** a focused, ready-to-use result that leads with the outcome and backs it with specifics.`,
        ``,
        `## Overview`,
        `A clear, structured response a reader can act on immediately — framed for the right audience, grounded in concrete details.`,
        ``,
        `## Key points`,
        `1. **Frame** — state the goal and who it serves in one line.`,
        `2. **Evidence** — back it with two concrete, verifiable specifics.`,
        `3. **Action** — give three crisp next steps the reader can take today.`,
        ``,
        `## Next steps`,
        `- Start with the highest-leverage action above.`,
        `- Review, measure the result, and iterate once.`,
        ``,
        `_This is a simulated run — set LLM_API_KEY to generate real agent output._`,
      ].join("\n");
    case "critic":
      return [
        `Score: 8/10`,
        ``,
        `- **Strong:** leads with the outcome and stays skimmable end-to-end.`,
        `- **Improve:** swap one generic line for a concrete example.`,
        `- **Improve:** tighten the opening so the value lands in the first sentence.`,
      ].join("\n");
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
