import { runOrchestration } from "@/lib/agents";
import { getLLMConfig } from "@/lib/llm";
import type { AgentEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel: keep the streamed run alive long enough

const encoder = new TextEncoder();
function frame(event: AgentEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

/** Lightweight status for the UI badge (never leaks the key). */
export async function GET() {
  const cfg = getLLMConfig();
  return Response.json({
    mode: cfg.configured ? "live" : "simulated",
    provider: cfg.provider,
    model: cfg.configured ? cfg.model : "simulated-engine",
  });
}

export async function POST(req: Request) {
  let objective = "";
  try {
    const body = (await req.json()) as { objective?: string };
    objective = (body.objective ?? "").toString();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  objective = objective.trim();
  if (objective.length < 3) {
    return new Response("Please provide an objective (min 3 characters).", {
      status: 400,
    });
  }
  if (objective.length > 600) objective = objective.slice(0, 600);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runOrchestration(objective, req.signal)) {
          controller.enqueue(frame(event));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unexpected error";
        try {
          controller.enqueue(frame({ type: "error", message }));
        } catch {
          /* controller may already be closed */
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      /* client disconnected — the generator observes req.signal */
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
