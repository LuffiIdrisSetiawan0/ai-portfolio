import { profile } from "@/lib/content";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <p className="font-mono text-xs text-faint">
          © {year} {profile.name}. Built with Next.js · streamed by agents.
        </p>
        <a
          href="#top"
          className="font-mono text-xs text-fog transition hover:text-aqua"
        >
          back to top ↑
        </a>
      </div>
    </footer>
  );
}
