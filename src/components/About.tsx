import { aboutParagraphs, profile } from "@/lib/content";
import { Reveal } from "./Reveal";

export function About() {
  return (
    <section id="about" className="section">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-16">
          <div>
            <Reveal>
              <span className="eyebrow">01 — About</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-tight tracking-[-0.02em] text-paper balance">
                Models are the easy part.{" "}
                <span className="text-fog">Reliable systems are the work.</span>
              </h2>
            </Reveal>
            <div className="mt-7 space-y-5 text-[17px] leading-relaxed text-mist">
              {aboutParagraphs.map((p, i) => (
                <Reveal key={i} delay={140 + i * 80}>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: p.replace(
                        /\*([^*]+)\*/g,
                        '<em class="text-paper not-italic font-medium">$1</em>',
                      ),
                    }}
                  />
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={120}>
            <div className="glass overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line bg-white/[0.02] px-4 py-3">
                <span className="h-3 w-3 rounded-full" style={{ background: "var(--rose)" }} />
                <span className="h-3 w-3 rounded-full" style={{ background: "var(--amber)" }} />
                <span className="h-3 w-3 rounded-full" style={{ background: "var(--signal)" }} />
                <span className="ml-2 font-mono text-xs text-faint">~ / engineer.profile</span>
              </div>
              <div className="space-y-2.5 p-5 font-mono text-[13px] leading-relaxed">
                <p className="text-faint">
                  <span className="text-signal">$</span> whoami
                </p>
                <p className="text-paper">{profile.name}</p>
                <p className="text-faint">
                  <span className="text-signal">$</span> cat role.txt
                </p>
                <p className="text-aqua">{profile.role}</p>
                <p className="text-faint">
                  <span className="text-signal">$</span> ls ~/focus
                </p>
                <p className="text-mist">
                  agentic-orchestration/ &nbsp; llm-apps/ &nbsp; rag/ &nbsp; evals/
                </p>
                <p className="text-faint">
                  <span className="text-signal">$</span> echo $LOCATION
                </p>
                <p className="text-mist">{profile.location}</p>
                <p className="text-faint">
                  <span className="text-signal">$</span> status
                  <span className="cursor-blink ml-2 text-signal">{profile.availability}</span>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
