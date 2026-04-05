

// frontend/src/components/landing/IntroAnimation.jsx
import { useEffect } from "react";
import kalasetuLogo from "../../assets/kalasetu_logo.png";

const INTRO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400&display=swap');

@keyframes ks-logoEntry {
  0%   { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1);   }
}
@keyframes ks-flip3d {
  0%   { transform: perspective(800px) rotateY(0deg);   }
  50%  { transform: perspective(800px) rotateY(180deg); }
  100% { transform: perspective(800px) rotateY(360deg); }
}
@keyframes ks-shimmer {
  0%   { left: -130%; }
  100% { left: 230%;  }
}
@keyframes ks-ringEntry {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1);   }
}
@keyframes ks-ringRotate {
  from { transform: translate(-50%, -50%) rotate(0deg);   }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
@keyframes ks-letterIn {
  0%   { opacity: 0; transform: translateY(-50px) rotateX(80deg); filter: blur(6px); }
  60%  { transform: translateY(6px) rotateX(-6deg); filter: blur(0); }
  80%  { transform: translateY(-3px) rotateX(2deg); }
  100% { opacity: 1; transform: translateY(0) rotateX(0deg); filter: blur(0); }
}
@keyframes ks-underline {
  0%   { width: 0; opacity: 0; }
  100% { width: 100%; opacity: 1; }
}
@keyframes ks-ornament {
  0%   { opacity: 0; transform: scaleX(0); }
  100% { opacity: 1; transform: scaleX(1); }
}
@keyframes ks-fadeUp {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0);    }
}
@keyframes ks-exit {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
`;

const LETTERS = ["K", "a", "l", "a", "S", "e", "t", "u"];

const DiamondDot = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <rect x="1" y="1" width="8" height="8" rx="0.5"
            transform="rotate(45 5 5)" fill="#c8623a" />
    </svg>
);

const LeafIcon = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(200,98,58,0.45)">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-5 8z" />
    </svg>
);

export default function IntroAnimation({ onDone }) {
    useEffect(() => {
        if (!document.getElementById("ks-intro-css")) {
            const tag = document.createElement("style");
            tag.id = "ks-intro-css";
            tag.textContent = INTRO_CSS;
            document.head.appendChild(tag);
        }
        const t = setTimeout(onDone, 6400);
        return () => clearTimeout(t);
    }, [onDone]);

    const letterBaseDelay = 2.3;
    const lastLetterEnd = letterBaseDelay + LETTERS.length * 0.11;

    return (
        <div style={{
            position: "fixed", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "radial-gradient(ellipse at 42% 42%, #fdf0e0 0%, #f5e6d0 45%, #ede0cc 100%)",
            zIndex: 9999,
            animation: `ks-exit 0.7s ease-in 5.7s forwards`,
        }}>

            {/* vignette */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse at center, transparent 38%, rgba(140,90,50,0.09) 100%)",
            }} />

            {/* ── LOGO + SINGLE GOLDEN RING ── */}
            <div style={{
                position: "relative",
                width: 240, height: 240,
                marginBottom: 36,
                flexShrink: 0,
            }}>

                {/* ONE spinning dashed golden ring — positioned absolutely around logo */}
                <svg
                    width="300" height="300"
                    viewBox="0 0 300 300"
                    style={{
                        position: "absolute",
                        top: "50%", left: "50%",
                        opacity: 0,
                        animation: `
              ks-ringEntry  0.7s ease-out 0.3s forwards,
              ks-ringRotate 9s linear     1s infinite
            `,
                        pointerEvents: "none",
                    }}
                >
                    <circle
                        cx="150" cy="150" r="145"
                        stroke="rgba(201,147,42,0.8)"
                        strokeWidth="2"
                        strokeDasharray="14 8"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* 4 golden dots at cardinal points for decoration */}
                    {[0, 90, 180, 270].map((angle, i) => {
                        const rad = (angle * Math.PI) / 180;
                        const cx = 150 + 145 * Math.sin(rad);
                        const cy = 150 - 145 * Math.cos(rad);
                        return <circle key={i} cx={cx} cy={cy} r="3.5" fill="rgba(201,147,42,0.9)" />;
                    })}
                </svg>

                {/* solid thin gold inner border (static, no spin) */}
                <div style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(201,147,42,0.35)",
                    pointerEvents: "none",
                    opacity: 0,
                    animation: "ks-logoEntry 0.6s ease-out 0.3s forwards",
                }} />

                {/* Logo */}
                <div style={{
                    width: 240, height: 240,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "3px solid rgba(200,98,58,0.35)",
                    position: "relative",
                    opacity: 0,
                    boxShadow: "0 8px 40px rgba(200,98,58,0.2)",
                    animation: `
            ks-logoEntry 0.6s cubic-bezier(0.34,1.56,0.64,1) 0s   forwards,
            ks-flip3d    1.5s ease-in-out                     0.7s forwards
          `,
                }}>
                    <img
                        src={kalasetuLogo}
                        alt="KalaSetu"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {/* shimmer */}
                    <div style={{
                        position: "absolute", inset: 0,
                        borderRadius: "50%", overflow: "hidden", pointerEvents: "none",
                    }}>
                        <div style={{
                            position: "absolute", top: 0, bottom: 0, width: "55%",
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)",
                            left: "-130%",
                            animation: "ks-shimmer 1s ease-in-out 2.1s 1 forwards",
                        }} />
                    </div>
                </div>
            </div>

            {/* ── TEXT GROUP ── */}
            <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 20,
                perspective: "600px",
            }}>

                {/* KalaSetu — ALL terra, letter by letter */}
                <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.01em" }}>
                        {LETTERS.map((letter, i) => {
                            const delay = `${(letterBaseDelay + i * 0.11).toFixed(2)}s`;
                            return (
                                <span key={i} style={{
                                    fontFamily: "'Cinzel', serif",
                                    fontSize: "clamp(3rem, 6.5vw, 4.8rem)",
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    color: "#c8623a",   // all terra, no exception
                                    display: "inline-block",
                                    opacity: 0,
                                    filter: "drop-shadow(0 2px 10px rgba(200,98,58,0.22))",
                                    animation: `ks-letterIn 0.55s cubic-bezier(0.22,1,0.36,1) ${delay} forwards`,
                                }}>
                                    {letter}
                                </span>
                            );
                        })}
                    </div>

                    {/* gradient underline */}
                    <div style={{
                        position: "absolute",
                        bottom: -4, left: 0,
                        height: 2.5, borderRadius: 2,
                        width: 0, opacity: 0,
                        background: "linear-gradient(90deg, #c8623a, rgba(200,98,58,0.3), #c8623a)",
                        animation: `ks-underline 0.55s ease-out ${(lastLetterEnd + 0.08).toFixed(2)}s forwards`,
                    }} />
                </div>

                {/* ornament */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    opacity: 0, transformOrigin: "center",
                    animation: `ks-ornament 0.6s ease-out ${(lastLetterEnd + 0.28).toFixed(2)}s forwards`,
                }}>
                    <div style={{ width: 78, height: 1.5, background: "linear-gradient(90deg, transparent, #c8623a)" }} />
                    <DiamondDot />
                    <div style={{ width: 78, height: 1.5, background: "linear-gradient(90deg, #c8623a, transparent)" }} />
                </div>

                {/* subtitle */}
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: "clamp(1.05rem, 2.4vw, 1.35rem)",
                    fontWeight: 700,
                    color: "#4a8b8f",
                    letterSpacing: "0.03em",
                    textAlign: "center",
                    maxWidth: 390,
                    lineHeight: 1.6,
                    opacity: 0,
                    animation: `ks-fadeUp 0.9s ease-out ${(lastLetterEnd + 0.55).toFixed(2)}s forwards`,
                }}>A Bridge Between Artisans and the World</div>

                {/* bottom tag */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    opacity: 0,
                    animation: `ks-fadeUp 0.7s ease-out ${(lastLetterEnd + 1.05).toFixed(2)}s forwards`,
                }}>
                    <LeafIcon size={13} />
                    <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.68rem",
                        fontWeight: 400,
                        letterSpacing: "0.38em",
                        textTransform: "uppercase",
                        color: "rgba(200,98,58,0.45)",
                    }}>Preserving Heritage · One Story at a Time</span>
                    <LeafIcon size={13} />
                </div>

            </div>
        </div>
    );
}