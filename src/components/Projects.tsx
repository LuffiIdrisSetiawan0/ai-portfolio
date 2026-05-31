import { projects, type Project } from "@/lib/content";
import { Reveal } from "./Reveal";
import { ArrowRight } from "./icons";

export function Projects() {
  const featured = projects.find((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="work" className="section">
      <div className="container-page">
        <Reveal>
          <span className="eyebrow">04 — Selected work</span>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-tight tracking-[-0.02em] text-paper balance">
            Systems built to be used, not just demoed.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5">
          {featured && (
            <Reveal>
              <FeaturedCard project={featured} />
            </Reveal>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {rest.map((p, i) => (
              <Reveal key={p.title} delay={i * 100}>
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stack({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <span key={s} className="chip !py-1 !px-2.5 text-[11px]">
          {s}
        </span>
      ))}
    </div>
  );
}

function FeaturedCard({ project }: { project: Project }) {
  return (
    <article className="glass glass-hover relative grid gap-8 overflow-hidden p-7 sm:p-9 lg:grid-cols-[1.3fr_1fr]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(36,230,208,0.5), transparent)" }}
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          {project.badge && (
            <span className="chip !py-1 text-[11px]" style={{ borderColor: "rgba(110,242,163,0.4)", color: "var(--signal)" }}>
              <span className="dot dot-live" style={{ background: "var(--signal)" }} />
              {project.badge}
            </span>
          )}
          <span className="font-mono text-xs text-fog">{project.tagline}</span>
        </div>
        <h3 className="mt-4 font-display text-3xl font-bold text-paper">{project.title}</h3>
        <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-mist">
          {project.description}
        </p>
        <div className="mt-6">
          <Stack items={project.stack} />
        </div>
        {project.links?.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="mt-7 inline-flex items-center gap-2 font-mono text-sm text-aqua transition hover:gap-3"
          >
            {l.label}
            <ArrowRight width={15} height={15} />
          </a>
        ))}
      </div>
      <ul className="relative space-y-3 self-center border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
        {project.highlights.map((h) => (
          <li key={h} className="flex items-start gap-3 text-[14px] text-mist">
            <span className="mt-1.5 h-1.5 w-1.5 flex-none rotate-45 bg-aqua" />
            {h}
          </li>
        ))}
      </ul>
    </article>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="glass glass-hover flex h-full flex-col p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-paper">{project.title}</h3>
        {project.badge && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
            {project.badge}
          </span>
        )}
      </div>
      <p className="mt-1 font-mono text-xs text-violet">{project.tagline}</p>
      <p className="mt-4 text-[14.5px] leading-relaxed text-mist">{project.description}</p>
      <ul className="mt-5 space-y-2">
        {project.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2.5 text-[13px] text-fog">
            <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-violet" />
            {h}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <Stack items={project.stack} />
      </div>
    </article>
  );
}
