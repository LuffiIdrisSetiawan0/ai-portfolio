import { ImageResponse } from "next/og";
import { profile } from "@/lib/content";

export const alt = `${profile.name} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(800px 500px at 0% 0%, rgba(139,108,255,0.25), transparent), radial-gradient(800px 500px at 100% 100%, rgba(36,230,208,0.22), transparent), #05070e",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #24e6d0, #8b6cff)",
              color: "#05070e",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            L
          </div>
          <div style={{ display: "flex", color: "#828aa3", fontSize: 26, letterSpacing: 2 }}>
            {profile.availability.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: "#eaeefb", fontSize: 40, fontWeight: 600 }}>
            {profile.name} · {profile.role}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              marginTop: 18,
              color: "#eaeefb",
            }}
          >
            I build&nbsp;
            <span
              style={{
                background: "linear-gradient(90deg, #24e6d0, #8b6cff)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              multi-agent systems
            </span>
            &nbsp;that ship.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {["Planner", "Researcher", "Writer", "Critic"].map((a, i) => (
            <div
              key={a}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                color: "#b6bdd2",
                fontSize: 26,
              }}
            >
              <span
                style={{
                  display: "flex",
                  width: 12,
                  height: 12,
                  borderRadius: 12,
                  background: ["#8b6cff", "#24e6d0", "#6ef2a3", "#ffb15c"][i],
                }}
              />
              {a}
              {i < 3 && <span style={{ display: "flex", color: "#565d74" }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
