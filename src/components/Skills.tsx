import { skillGroups } from "@/lib/content";
import { Reveal } from "./Reveal";

export function Skills() {
  return (
    <section id="skills" className="section">
      <div className="container-page">
        <Reveal>
          <span className="eyebrow">03 — Capabilities</span>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-tight tracking-[-0.02em] text-paper balance">
            A full stack for shipping AI, from prompt to production.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {skillGroups.map((g, gi) => (
            <Reveal key={g.title} delay={gi * 90} className="bg-panel">
              <div className="glass-hover h-full !rounded-none !border-0 bg-transparent p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-lg font-semibold text-paper">{g.title}</h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                    {g.caption}
                  </span>
                </div>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-aqua/40 to-transparent" />
                <ul className="mt-4 space-y-2.5">
                  {g.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[14px] text-mist">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rotate-45 bg-violet" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
