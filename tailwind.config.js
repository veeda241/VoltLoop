/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#120c08",
        "bg-elev": "#1c140e",
        "bg-card": "#241a12",
        line: "#3d2e22",
        text: "#f4efe6",
        muted: "#b8a894",
        volt: "#c8f542",
        "volt-ink": "#0a1208",
        cyan: "#3ecfb2",
        gold: "#e8b84a",
        terracotta: "#c45c26",
        danger: "#e85d4a",
        warn: "#e8a017",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(200,245,66,0.40)",
        "glow-cyan": "0 0 40px -10px rgba(62,207,178,0.35)",
        "glow-gold": "0 0 40px -10px rgba(232,184,74,0.40)",
        card: "0 1px 0 0 rgba(244,239,230,0.04) inset",
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
