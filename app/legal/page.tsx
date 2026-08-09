import { readFileSync } from "fs";
import { join } from "path";

export default function LegalPage() {
  let eula = "";
  try {
    eula = readFileSync(join(process.cwd(), "docs", "EULA.md"), "utf8");
  } catch {
    eula = "EULA document missing.";
  }

  return (
    <article className="prose prose-invert mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Privacy &amp; terms</h1>
      <pre className="mt-6 whitespace-pre-wrap rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-5 font-sans text-sm leading-relaxed text-[var(--muted)]">
        {eula}
      </pre>
    </article>
  );
}
