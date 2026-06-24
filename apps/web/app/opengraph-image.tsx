import { ImageResponse } from "next/og"

import { LAUNCH_LABEL, SITE } from "@typhed/ui/lib/constants"

export const dynamic = "force-static"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = `${SITE.name} - ${SITE.tagline}`

// Social share card, generated at build time for the static export.
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
          padding: "80px",
          background: "linear-gradient(135deg, #0b1020 0%, #0b1020 55%, #0e1733 100%)",
          color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #22d3ee, #6366f1)",
              color: "#0b1020",
              fontSize: "32px",
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "22px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "9999px",
                background: "#22d3ee",
              }}
            />
            Work in progress
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: "128px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#f8fafc" }}>Ty</span>
            <span style={{ color: "#22d3ee" }}>Phed</span>
          </div>
          <div style={{ display: "flex", marginTop: "8px", fontSize: "56px", color: "#cbd5e1" }}>
            Engineering Tomorrow
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: "26px",
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex" }}>{SITE.legalEntity}</div>
          <div style={{ display: "flex", color: "#22d3ee" }}>Launching {LAUNCH_LABEL}</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
