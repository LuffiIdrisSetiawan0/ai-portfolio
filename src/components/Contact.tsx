import { profile } from "@/lib/content";
import { Reveal } from "./Reveal";
import { ArrowUpRight, FileText, Github, Linkedin, Mail, XLogo } from "./icons";

const socialDefs = [
  { key: "github", label: "GitHub", Icon: Github },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { key: "x", label: "X", Icon: XLogo },
  { key: "resume", label: "Résumé", Icon: FileText },
] as const;

export function Contact() {
  const socials = socialDefs
    .map((s) => ({ ...s, href: profile.socials[s.key] }))
    .filter((s) => s.href && s.href.trim().length > 0);

  return (
    <section id="contact" className="section">
      <div className="container-page">
        <Reveal>
          <div className="glass relative overflow-hidden p-8 text-center sm:p-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: "var(--grad-neon)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[680px] max-w-[90vw] -translate-x-1/2 opacity-40 blur-[110px]"
              style={{ background: "radial-gradient(closest-side, rgba(139,108,255,0.35), transparent)" }}
            />

            <span className="eyebrow justify-center">05 — Contact</span>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-[clamp(2rem,5vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.02em] text-paper balance">
              Let&apos;s build something that{" "}
              <span className="grad-text">actually ships.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-mist">
              I&apos;m {profile.availability.toLowerCase()}. If you&apos;re working on
              agentic AI, LLM products, or retrieval systems, I&apos;d love to talk.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <a href={`mailto:${profile.email}`} className="btn btn-primary">
                <Mail width={16} height={16} />
                {profile.email}
              </a>
            </div>

            {socials.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                {socials.map(({ key, label, Icon, href }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-mist transition hover:border-aqua hover:text-aqua"
                    style={{ transitionProperty: "color, border-color" }}
                  >
                    <Icon width={18} height={18} />
                  </a>
                ))}
              </div>
            )}

            <p className="mt-8 inline-flex items-center gap-2 font-mono text-xs text-faint">
              <ArrowUpRight width={13} height={13} />
              Tip: edit <span className="text-fog">src/lib/content.ts</span> to add your links.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
