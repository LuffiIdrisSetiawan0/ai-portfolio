"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/content";
import { ArrowUpRight } from "./icons";

const links = [
  { href: "#about", label: "About" },
  { href: "#demo", label: "Live Demo" },
  { href: "#skills", label: "Skills" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line bg-[rgba(5,7,14,0.72)] backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="container-page flex h-16 items-center justify-between">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-bold text-[#05070e]" style={{ background: "var(--grad-neon)" }}>
            {initials}
          </span>
          <span className="font-mono text-sm tracking-tight text-paper">
            {profile.name.split(" ")[0].toLowerCase()}
            <span className="text-aqua">.ai</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[13px] text-fog transition hover:text-paper"
            >
              {l.label}
            </a>
          ))}
          <a href={`mailto:${profile.email}`} className="btn btn-ghost !py-2 !px-4 text-[13px]">
            Hire me
            <ArrowUpRight width={14} height={14} />
          </a>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-paper md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="flex flex-col gap-1">
            <span className={`h-0.5 w-4 bg-current transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`h-0.5 w-4 bg-current transition ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-4 bg-current transition ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-[rgba(5,7,14,0.95)] px-6 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 font-mono text-sm text-mist transition hover:bg-white/5 hover:text-paper"
              >
                {l.label}
              </a>
            ))}
            <a
              href={`mailto:${profile.email}`}
              onClick={() => setOpen(false)}
              className="btn btn-primary mt-2 justify-center"
            >
              Hire me
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
