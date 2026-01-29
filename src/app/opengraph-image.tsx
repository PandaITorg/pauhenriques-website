import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Pau Henriques - Salud y Bienestar";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Image generation
export default async function Image() {
  const logoUrl =
    "https://www.pauhenriques.com/assets/logo-pauhenriques.svg";

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #FDFBFB, #EBEDEE)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#202020",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          width="250"
          alt="Pau Henriques Logo"
          style={{
            filter: "drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))",
          }}
        />
        <h1
          style={{
            fontSize: 72,
            marginTop: 40,
            fontWeight: 800,
            letterSpacing: -3,
            color: "#1a1a1a",
          }}
        >
          Pau Henriques
        </h1>
        <p
          style={{
            fontSize: 36,
            marginTop: 8,
            fontWeight: 400,
            color: "#525252",
          }}
        >
          Coach de Salud y Bienestar
        </p>
        <p
          style={{
            fontSize: 24,
            position: "absolute",
            bottom: 40,
            left: 50,
            color: "#717171",
          }}
        >
          www.pauhenriques.com
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
