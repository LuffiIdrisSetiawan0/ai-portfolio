import { profile, stats } from "@/lib/content";
import { AgentGraph } from "./AgentGraph";
import { ArrowRight, ArrowUpRight } from "./icons";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      <div className="absolute inset-0 -z-10">
        <AgentGraph />
      </div>

      <div className="container-page w-full py-20">
        <div className="max-w-3xl">
          <div className="reveal is-in mb-7 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 py-1.5">
            <span className="dot dot-live" style={{ background: "var(--signal)" }} />
            <span className="font-mono text-xs tracking-wide text-mist">
              {profile.availability}
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.6rem,7.5vw,5.4rem)] font-extrabold leading-[0.98] tracking-[-0.02em] text-paper">
            <span className="block">{profile.headlinePre}</span>
            <span className="grad-text block">{profile.headlineAccent}</span>
            <span className="block text-mist">{profile.headlinePost}</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-mist balance">
            {profile.subhead}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <a href="#demo" className="btn btn-primary">
              Run the live demo
              <ArrowRight width={16} height={16} />
            </a>
            <a href="#work" className="btn btn-ghost">
              See the work
              <ArrowUpRight width={15} height={15} />
            </a>
          </div>

          <div className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-panel px-4 py-5">
                <div className="font-display text-3xl font-bold text-paper">{s.value}</div>
                <div className="mt-1 font-mono text-[11px] leading-snug text-fog">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">scroll</span>
        <span className="h-9 w-px bg-gradient-to-b from-aqua to-transparent" />
      </div>
    </section>
  );
}
