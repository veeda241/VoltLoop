/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050a14",
        "bg-elev": "#0c1220",
        "bg-card": "#111827",
        line: "#1e293b",
        text: "#e8eef8",
        muted: "#8b9bb4",
        volt: "#c8f542",
        "volt-ink": "#0a1208",
        cyan: "#7dd3fc",
        danger: "#ff6b6b",
        warn: "#ffc14a",
      },
      fontFamily: {
        display: ["Geist", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(200,245,66,0.40)",
        "glow-cyan": "0 0 40px -10px rgba(125,211,252,0.35)",
        card: "0 1px 0 0 rgba(232,245,238,0.03) inset",
      },
      keyframes: {
        pulseline: {
          "0%": { strokeDashoffset: "240" },
          "100%": { strokeDashoffset: "0" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        blip: {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "40%": { opacity: "1", transform: "scale(1.15)" },
          "100%": { opacity: "0", transform: "scale(1.6)" },
        },
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        pulseline: "pulseline 2.4s linear infinite",
        floaty: "floaty 4s ease-in-out infinite",
        blip: "blip 1.8s ease-out infinite",
        scan: "scan 3s ease-in-out infinite",
        ticker: "ticker 22s linear infinite",
      },
    },
  },
  plugins: [],
};
