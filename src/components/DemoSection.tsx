import { AgentDemo } from "./AgentDemo";
import { Reveal } from "./Reveal";

export function DemoSection() {
  return (
    <section id="demo" className="section relative">
      {/* soft accent glow behind the centerpiece */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-32 -z-10 h-[420px] w-[820px] max-w-[92vw] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(closest-side, rgba(36,230,208,0.25), rgba(139,108,255,0.18), transparent)" }}
      />
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <Reveal>
              <span className="eyebrow">02 — Flagship · Live</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-tight tracking-[-0.02em] text-paper balance">
                A multi-agent team you can run, right here.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={140}>
            <p className="max-w-sm text-[15px] leading-relaxed text-fog">
              Give it an objective. Watch a{" "}
              <span className="text-violet">planner</span>,{" "}
              <span className="text-aqua">researcher</span>,{" "}
              <span className="text-signal">writer</span>, and{" "}
              <span className="text-amber">critic</span> collaborate and stream
              their thinking, token by token.
            </p>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-10">
          <AgentDemo />
        </Reveal>
      </div>
    </section>
  );
}
