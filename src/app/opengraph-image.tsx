import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "ResumeFlow. Know what to keep, and what to rewrite.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function font(file: string) {
  return readFile(join(process.cwd(), "src/app/fonts", file));
}

export default async function OpenGraphImage() {
  const [fraunces, outfit, outfitMedium] = await Promise.all([
    font("Fraunces-SemiBold.ttf"),
    font("Outfit-Regular.ttf"),
    font("Outfit-Medium.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#f3efe6",
          color: "#1c1714",
          fontFamily: "Outfit",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 760,
            height: "100%",
            padding: "64px 28px 64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="44" height="44" viewBox="0 0 28 28">
              <rect x="3" y="4" width="16" height="20" rx="2" fill="#1c1714" />
              <rect x="9" y="3" width="16" height="20" rx="2" fill="#c45c26" />
              <path d="M13 9h8M13 13h8M13 17h5" stroke="#fffdf9" strokeWidth="1.4" />
            </svg>
            <div style={{ marginLeft: 14, fontFamily: "Fraunces", fontSize: 32 }}>ResumeFlow</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                color: "#c45c26",
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Resume review
            </div>
            <div
              style={{
                marginTop: 18,
                fontFamily: "Fraunces",
                fontSize: 64,
                lineHeight: 1.02,
                letterSpacing: -1,
              }}
            >
              Know what to keep, and what to rewrite.
            </div>
          </div>

          <div style={{ display: "flex" }}>
            <Step n="01" title="Aim" />
            <Step n="02" title="Compare" />
            <Step n="03" title="Revise" />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", position: "relative", width: 300, height: 360 }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 48,
                width: 200,
                height: 268,
                backgroundColor: "#1c1714",
                borderRadius: 20,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 78,
                top: 12,
                width: 200,
                height: 268,
                backgroundColor: "#c45c26",
                borderRadius: 20,
                display: "flex",
                flexDirection: "column",
                padding: "42px 32px",
              }}
            >
              <div style={{ width: 128, height: 10, borderRadius: 6, backgroundColor: "#fffdf9" }} />
              <div
                style={{
                  width: 128,
                  height: 10,
                  borderRadius: 6,
                  backgroundColor: "#fffdf9",
                  marginTop: 18,
                }}
              />
              <div
                style={{
                  width: 84,
                  height: 10,
                  borderRadius: 6,
                  backgroundColor: "#fffdf9",
                  marginTop: 18,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
        { name: "Outfit", data: outfit, weight: 400, style: "normal" },
        { name: "Outfit", data: outfitMedium, weight: 500, style: "normal" },
      ],
    },
  );
}

function Step({ n, title }: { n: string; title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginRight: 14,
        padding: "10px 16px",
        borderRadius: 999,
        backgroundColor: "#fffdf9",
        border: "1px solid #e4d9cc",
      }}
    >
      <div style={{ color: "#6f675f", fontSize: 16, letterSpacing: 1 }}>{n}</div>
      <div style={{ marginLeft: 10, fontSize: 20, fontWeight: 500 }}>{title}</div>
    </div>
  );
}
