export function minutesFromNow(ts) {
  const diff = Math.round((ts - Date.now()) / 60000);
  return diff < 0 ? 0 : diff;
}

export function fmtVL(n) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n} VL`;
}

export function fmtINR(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export function shortId(id) {
  return id.slice(-6).toUpperCase();
}
