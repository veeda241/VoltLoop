import React from "react";
import { motion } from "framer-motion";

export function Logo({ size = 40 }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className="grid place-items-center rounded-xl bg-volt text-volt-ink font-black shadow-glow"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2 L4 14 H10 L9 22 L20 9 H13 L13 2 Z" />
        </svg>
      </div>
      <span className="font-display font-extrabold tracking-tight text-2xl md:text-3xl text-text">VoltLoop</span>
    </div>
  );
}

export function Card({ className = "", children, glow, ...rest }) {
  return (
    <div
      className={`card-elev rounded-2xl p-5 relative overflow-hidden ${
        glow === "volt" ? "shadow-glow" : glow === "cyan" ? "shadow-glow-cyan" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Button({ variant = "primary", className = "", children, as: Comp = "button", ...rest }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";
  const styles = {
    primary: "bg-volt text-volt-ink hover:brightness-110 shadow-glow",
    secondary: "border border-line text-text hover:border-volt/60 hover:text-volt",
    ghost: "text-muted hover:text-text",
    danger: "border border-danger/40 text-danger hover:bg-danger/10",
    cyan: "bg-cyan text-volt-ink hover:brightness-110 shadow-glow-cyan",
  };
  return (
    <Comp className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </Comp>
  );
}

export function Pill({ tone = "muted", children, className = "" }) {
  const tones = {
    muted: "bg-line/50 text-muted",
    volt: "bg-volt/15 text-volt border border-volt/30",
    cyan: "bg-cyan/15 text-cyan border border-cyan/30",
    warn: "bg-warn/15 text-warn border border-warn/30",
    danger: "bg-danger/15 text-danger border border-danger/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium font-mono-tight ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function TokenChip({ balance }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/10 px-3 py-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-volt">
        <path d="M13 2 L4 14 H10 L9 22 L20 9 H13 L13 2 Z" fill="currentColor" />
      </svg>
      <span className="font-mono-tight text-sm font-semibold text-volt">{balance} VL</span>
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
      <div className="w-14 h-14 rounded-2xl border border-dashed border-line grid place-items-center text-muted">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12h6M12 9v6" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-semibold text-text">{title}</p>
      {body && <p className="text-sm text-muted max-w-xs">{body}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-line/60 ${className}`} />;
}

export function PageIn({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StatBlock({ label, value, tone = "text" }) {
  const toneClass = { text: "text-text", volt: "text-volt", cyan: "text-cyan", warn: "text-warn" }[tone];
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted mb-1">{label}</p>
      <p className={`font-display text-2xl md:text-3xl font-bold font-mono-tight ${toneClass}`}>{value}</p>
    </div>
  );
}

export function SectionEyebrow({ children, className = "" }) {
  return (
    <p className={`text-xs font-mono-tight uppercase tracking-[0.2em] text-cyan mb-3 ${className}`}>
      {children}
    </p>
  );
}
