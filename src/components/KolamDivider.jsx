import React from "react";

export default function KolamDivider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-2 ${className}`} aria-hidden>
      <span className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-gold/50" />
      <svg width="72" height="28" viewBox="0 0 72 28" fill="none" className="text-gold/80">
        <path
          d="M10 14c0-6 8-6 13 0 5-6 13-6 13 0 5-6 13-6 13 0 5 6-3 8-13 0-5 6-13 6-13 0-5 6-13 6-13 0z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="10" cy="14" r="2" fill="currentColor" />
        <circle cx="23" cy="14" r="2" fill="currentColor" />
        <circle cx="36" cy="14" r="2" fill="currentColor" />
        <circle cx="49" cy="14" r="2" fill="currentColor" />
        <circle cx="62" cy="14" r="2" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-gold/50" />
    </div>
  );
}
