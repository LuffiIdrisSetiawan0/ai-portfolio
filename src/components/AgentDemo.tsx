"use client";

import { useEffect, useRef, useState } from "react";
import { agentPipeline, exampleObjectives, type AgentMeta } from "@/lib/content";
import type { AgentEvent, AgentId } from "@/lib/types";
import { Markdown } from "./Markdown";
import { agentIcon, Check, Copy, Play, Stop } from "./icons";

type Status = "idle" | "active" | "done" | "error";
type AState = { status: Status; text: string; degraded?: boolean };

const ACCENTS: Record<AgentMeta["accent"], string> = {
  violet: "#8b6cff",
  aqua: "#24e6d0",
  signal: "#6ef2a3",
  amber: "#ffb15c",
};

const ORDER: AgentId[] = ["planner", "researcher", "writer", "critic"];

function initialAgents(): Record<AgentId, AState> {
  return {
    planner: { status: "idle", text: "" },
    researcher: { status: "idle", text: "" },
    writer: { status: "idle", text: "" },
    critic: { status: "idle", text: "" },
  };
}

const meta = (id: AgentId) => agentPipeline.find((a) => a.id === id)!;

export function AgentDemo() {
  const [objective, setObjective] = useState("");
  const [agents, setAgents] = useState<Record<AgentId, AState>>(initialAgents);
  const [running, setRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [mode, setMode] = useState<"live" | "simulated" | null>(null);
  const [model, setModel] = useState<string>("");
  const [statusMode, setStatusMode] = useState<"live" | "simulated" | null>(null);
  const [statusModel, setStatusModel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const startRef = useRef<number>(0);

  // probe live/simulated status for the badge
  useEffect(() => {
    let cancelled = false;
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d: { mode: "live" | "simulated"; model: string }) => {
        if (cancelled) return;
        setStatusMode(d.mode);
        setStatusModel(d.model);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // live elapsed timer
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 80);
    return () => clearInterval(t);
  }, [running]);

  function handleEvent(ev: AgentEvent) {
    switch (ev.type) {
      case "run_start":
        setMode(ev.mode);
        setModel(ev.model);
        break;
      case "agent_start":
        setActiveAgent(ev.agent);
        setAgents((s) => ({ ...s, [ev.agent]: { ...s[ev.agent], status: "active" } }));
        break;
      case "token":
        setAgents((s) => ({
          ...s,
          [ev.agent]: { ...s[ev.agent], text: s[ev.agent].text + ev.text },
        }));
        break;
      case "agent_done":
        setAgents((s) => ({
          ...s,
          [ev.agent]: {
            ...s[ev.agent],
            status: "done",
            degraded: Boolean(ev.meta?.degraded),
          },
        }));
        break;
      case "handoff":
        setActiveAgent(ev.to);
        break;
      case "run_done":
        setElapsed(ev.durationMs);
        break;
      case "error":
        if (ev.agent)
          setAgents((s) => ({ ...s, [ev.agent!]: { ...s[ev.agent!], status: "error" } }));
        setError(ev.message);
        break;
    }
  }

  async function run() {
    const obj = objective.trim();
    if (obj.length < 3 || running) return;

    setRunning(true);
    setError(null);
    setCopied(false);
    setAgents(initialAgents());
    setActiveAgent(null);
    setMode(null);
    setElapsed(0);
    startRef.current = Date.now();

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: obj }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const rawFrame = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const dataLine = rawFrame
            .split("\n")
            .find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload) continue;
          try {
            handleEvent(JSON.parse(payload) as AgentEvent);
          } catch {
            /* ignore malformed frame */
          }
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setRunning(false);
      setActiveAgent(null);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  // the writer produces the final deliverable; the critic only reviews/scores it
  const finalText = agents.writer.text;
  const showFinal =
    agents.writer.status === "done" && finalText.trim().length > 0;

  async function copyFinal() {
    try {
      await navigator.clipboard.writeText(finalText.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  const badgeMode = mode ?? statusMode;
  const badgeModel = model || statusModel;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      {/* LEFT: control panel + pipeline */}
      <div className="flex flex-col gap-5">
        <div className="glass p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-fog">
              objective
            </span>
            <StatusBadge mode={badgeMode} model={badgeModel} />
          </div>

          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                run();
              }
            }}
            placeholder="Give the team any task — e.g. plan a weekend trip, write a professional email, create a workout plan…"
            rows={3}
            disabled={running}
            className="w-full resize-none rounded-xl border border-line bg-black/30 p-3.5 text-[15px] leading-relaxed text-paper placeholder:text-faint outline-none transition focus:border-aqua/70 focus:ring-1 focus:ring-aqua/40 disabled:opacity-60"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {exampleObjectives.map((ex) => (
              <button
                key={ex}
                type="button"
                disabled={running}
                onClick={() => setObjective(ex)}
                className="chip transition hover:border-aqua/60 hover:text-paper disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {!running ? (
              <button
                onClick={run}
                disabled={objective.trim().length < 3}
                className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play width={15} height={15} />
                Run the team
              </button>
            ) : (
              <button onClick={stop} className="btn btn-ghost">
                <Stop width={14} height={14} />
                Stop
              </button>
            )}
            <span className="font-mono text-xs text-fog">
              {running ? "orchestrating…" : "4 agents · sequential"}
              {elapsed > 0 && (
                <span className="text-faint"> · {(elapsed / 1000).toFixed(1)}s</span>
              )}
            </span>
          </div>
        </div>

        {/* pipeline rail */}
        <PipelineRail agents={agents} active={activeAgent} />
      </div>

      {/* RIGHT: streaming agent cards + final */}
      <div className="flex flex-col gap-4">
        {error && (
          <div className="glass border-rose/40 p-4 text-sm text-rose" style={{ borderColor: "rgba(255,111,145,0.4)" }}>
            <span className="font-mono text-xs uppercase tracking-wider">error</span>
            <p className="mt-1 text-mist">{error}</p>
          </div>
        )}

        {ORDER.map((id) => (
          <AgentCard key={id} id={id} state={agents[id]} active={activeAgent === id && running} />
        ))}

        {showFinal && (
          <div className="glass overflow-hidden" style={{ boxShadow: "var(--glow-aqua)" }}>
            <div className="flex items-center justify-between border-b border-line bg-white/[0.02] px-5 py-3">
              <span className="eyebrow" style={{ color: "var(--signal)" }}>
                Final deliverable
              </span>
              <button
                onClick={copyFinal}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-fog transition hover:text-paper"
              >
                {copied ? <Check width={14} height={14} /> : <Copy width={14} height={14} />}
                {copied ? "copied" : "copy"}
              </button>
            </div>
            <div className="px-5 py-4 text-[15px]">
              <Markdown text={finalText} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- pieces -------------------------------- */

function StatusBadge({
  mode,
  model,
}: {
  mode: "live" | "simulated" | null;
  model: string;
}) {
  if (!mode) return <span className="chip text-xs">connecting…</span>;
  const live = mode === "live";
  return (
    <span className="chip text-xs" style={live ? { borderColor: "rgba(110,242,163,0.4)" } : undefined}>
      <span className={`dot ${live ? "dot-live" : ""}`} style={{ background: live ? "var(--signal)" : "var(--amber)" }} />
      <span className={live ? "text-signal" : "text-amber"} style={{ color: live ? "var(--signal)" : "var(--amber)" }}>
        {live ? "LIVE" : "DEMO"}
      </span>
      <span className="text-faint">·</span>
      <span className="text-fog">{model || (live ? "model" : "simulated")}</span>
    </span>
  );
}

function PipelineRail({
  agents,
  active,
}: {
  agents: Record<AgentId, AState>;
  active: AgentId | null;
}) {
  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-fog">pipeline</span>
      </div>
      <div className="flex items-stretch justify-between gap-1">
        {ORDER.map((id, idx) => {
          const m = meta(id);
          const accent = ACCENTS[m.accent];
          const st = agents[id].status;
          const isActive = active === id;
          const Icon = agentIcon[id];
          return (
            <div key={id} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center text-center">
                <div
                  className="relative flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300"
                  style={{
                    borderColor:
                      st === "idle" ? "var(--line)" : accent,
                    background:
                      st === "idle"
                        ? "rgba(255,255,255,0.02)"
                        : `${accent}1f`,
                    color: st === "idle" ? "var(--faint)" : accent,
                    boxShadow: isActive ? `0 0 22px -4px ${accent}` : "none",
                  }}
                >
                  <Icon width={20} height={20} className={isActive ? "node-glow" : ""} />
                  {st === "done" && (
                    <span
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: accent, color: "#05070e" }}
                    >
                      <Check width={11} height={11} strokeWidth={3} />
                    </span>
                  )}
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-xl border"
                      style={{ borderColor: accent, animation: "ping 1.6s ease-out infinite" }}
                    />
                  )}
                </div>
                <span
                  className="mt-2 font-mono text-[11px] tracking-wide"
                  style={{ color: st === "idle" ? "var(--faint)" : "var(--mist)" }}
                >
                  {m.name}
                </span>
                <span className="font-mono text-[10px] text-faint">{m.role}</span>
              </div>
              {idx < ORDER.length - 1 && (
                <div className="mb-7 h-px w-3 flex-none sm:w-5" style={{
                  background: agents[ORDER[idx + 1]].status !== "idle" || st === "done"
                    ? `linear-gradient(90deg, ${accent}, ${ACCENTS[meta(ORDER[idx + 1]).accent]})`
                    : "var(--line)",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentCard({ id, state, active }: { id: AgentId; state: AState; active: boolean }) {
  const m = meta(id);
  const accent = ACCENTS[m.accent];
  const Icon = agentIcon[id];
  const idle = state.status === "idle";
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [state.text, active]);

  return (
    <div
      className="glass overflow-hidden transition-all duration-300"
      style={{
        borderColor: idle ? "var(--line)" : `${accent}55`,
        opacity: idle ? 0.55 : 1,
        boxShadow: active ? `0 0 30px -16px ${accent}` : "none",
      }}
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon width={16} height={16} />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[15px] font-semibold text-paper">{m.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            {m.role} · {m.description}
          </span>
        </div>
        <span className="ml-auto font-mono text-[11px]" style={{ color: accent }}>
          {state.status === "active" && "● running"}
          {state.status === "done" && (state.degraded ? "○ fallback" : "✓ done")}
          {state.status === "error" && "✕ error"}
          {state.status === "idle" && <span className="text-faint">idle</span>}
        </span>
      </div>
      {!idle && (
        <div
          ref={bodyRef}
          className="max-h-52 overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed text-mist"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {state.text}
          {active && <span className="cursor-blink" />}
        </div>
      )}
    </div>
  );
}
