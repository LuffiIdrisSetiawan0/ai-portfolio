import type { ChatMessage } from "./types";

/* ============================================================================
 *  Provider-agnostic streaming LLM client.
 *
 *  Configure via environment variables (see .env.example):
 *    LLM_PROVIDER   "openai" (default) | "anthropic"
 *    LLM_BASE_URL   API base incl. version path
 *                   - Sumopod (OpenAI-compatible): https://ai.sumopod.com/v1
 *                   - OpenAI:                       https://api.openai.com/v1
 *                   - Anthropic native:             https://api.anthropic.com
 *    LLM_API_KEY    your key
 *    LLM_MODEL      model id exposed by your provider (e.g. claude-3-5-sonnet)
 *
 *  Most gateways (incl. Sumopod) are OpenAI-compatible, so that is the default.
 *  If nothing is configured, isLLMConfigured() returns false and callers fall
 *  back to a realistic simulated run so the demo never hard-breaks in public.
 * ========================================================================== */

type Provider = "openai" | "anthropic";

export type LLMConfig = {
  provider: Provider;
  baseUrl: string;
  apiKey: string;
  model: string;
  configured: boolean;
};

export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER === "anthropic"
    ? "anthropic"
    : "openai") as Provider;

  const apiKey = process.env.LLM_API_KEY?.trim() ?? "";

  const defaultBase =
    provider === "anthropic"
      ? "https://api.anthropic.com"
      : "https://api.openai.com/v1";
  const baseUrl = (process.env.LLM_BASE_URL?.trim() || defaultBase).replace(
    /\/+$/,
    "",
  );

  const model =
    process.env.LLM_MODEL?.trim() ||
    (provider === "anthropic" ? "claude-3-5-sonnet-latest" : "claude-3-5-sonnet");

  return { provider, baseUrl, apiKey, model, configured: apiKey.length > 0 };
}

export function isLLMConfigured(): boolean {
  return getLLMConfig().configured;
}

export type StreamOptions = {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
};

/**
 * Stream an LLM completion, yielding text deltas as they arrive.
 * Throws on transport / API errors (callers decide how to fall back).
 */
export async function* streamLLM(
  opts: StreamOptions,
): AsyncGenerator<string, void, unknown> {
  const cfg = getLLMConfig();
  if (!cfg.configured) {
    throw new Error("LLM not configured (missing LLM_API_KEY).");
  }

  const { system, messages, maxTokens = 900, temperature = 0.7, signal } = opts;

  if (cfg.provider === "anthropic") {
    yield* streamAnthropic(cfg, { system, messages, maxTokens, temperature, signal });
  } else {
    yield* streamOpenAICompatible(cfg, {
      system,
      messages,
      maxTokens,
      temperature,
      signal,
    });
  }
}

/* -------------------------- OpenAI-compatible -------------------------- */
async function* streamOpenAICompatible(
  cfg: LLMConfig,
  opts: Required<Omit<StreamOptions, "signal">> & { signal?: AbortSignal },
) {
  const url = `${cfg.baseUrl}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      stream: true,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: opts.system },
        ...opts.messages,
      ],
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await safeText(res);
    throw new Error(`LLM ${res.status} ${res.statusText} — ${detail}`);
  }

  for await (const data of sseFrames(res.body, opts.signal)) {
    if (data === "[DONE]") return;
    try {
      const json = JSON.parse(data);
      const delta: string | undefined = json?.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    } catch {
      /* ignore keep-alive / partial frames */
    }
  }
}

/* ----------------------------- Anthropic ------------------------------ */
async function* streamAnthropic(
  cfg: LLMConfig,
  opts: Required<Omit<StreamOptions, "signal">> & { signal?: AbortSignal },
) {
  const url = `${cfg.baseUrl}/v1/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cfg.model,
      stream: true,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      system: opts.system,
      messages: opts.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await safeText(res);
    throw new Error(`LLM ${res.status} ${res.statusText} — ${detail}`);
  }

  for await (const data of sseFrames(res.body, opts.signal)) {
    try {
      const json = JSON.parse(data);
      if (
        json?.type === "content_block_delta" &&
        json?.delta?.type === "text_delta"
      ) {
        const text: string | undefined = json.delta.text;
        if (text) yield text;
      }
    } catch {
      /* ignore */
    }
  }
}

/* ------------------------------- helpers ------------------------------ */

/** Parse a ReadableStream of SSE bytes into a stream of `data:` payloads. */
async function* sseFrames(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      // SSE frames are separated by line breaks; collect `data:` lines.
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).replace(/\r$/, "");
        buffer = buffer.slice(nl + 1);
        if (line.startsWith("data:")) {
          yield line.slice(5).trim();
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 300);
  } catch {
    return "<no body>";
  }
}
