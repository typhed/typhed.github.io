import { ImageResponse } from "next/og"

export const dynamic = "force-static"
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

// Favicon generated at build time so it ships with the static export.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          background: "linear-gradient(135deg, #22d3ee, #6366f1)",
          color: "#0b1020",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        T
      </div>
    ),
    { ...size },
  )
}
