export type AgentId = "planner" | "researcher" | "writer" | "critic";

/**
 * Typed events streamed from the orchestrator to the client over SSE.
 * Each is sent as one `data: <json>\n\n` frame.
 */
export type AgentEvent =
  | { type: "run_start"; objective: string; mode: "live" | "simulated"; model: string }
  | { type: "agent_start"; agent: AgentId }
  | { type: "token"; agent: AgentId; text: string }
  | { type: "agent_done"; agent: AgentId; meta?: Record<string, unknown> }
  | { type: "handoff"; from: AgentId; to: AgentId }
  | { type: "run_done"; durationMs: number }
  | { type: "error"; message: string; agent?: AgentId };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
