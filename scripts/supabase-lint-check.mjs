#!/usr/bin/env node
/**
 * Supabase security-lint gate.
 *
 * Fetches current lints from the Supabase Management API and compares them
 * to a baseline (.supabase-lint-baseline.json). Exits non-zero when:
 *   - any ERROR-level finding exists, or
 *   - a new WARN/INFO finding appears that is not in the baseline.
 *
 * Required env:
 *   SUPABASE_ACCESS_TOKEN  Personal access token (Account → Access Tokens)
 *   SUPABASE_PROJECT_REF   Project ref (e.g. atxqvdrapkvqluryjota)
 *
 * Usage:
 *   node scripts/supabase-lint-check.mjs            # gate
 *   node scripts/supabase-lint-check.mjs --update   # rewrite baseline
 */

import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
const BASELINE = path.resolve(".supabase-lint-baseline.json");
const UPDATE = process.argv.includes("--update");

if (!TOKEN || !REF) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF env.");
  process.exit(2);
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${REF}/database/lints`,
  { headers: { Authorization: `Bearer ${TOKEN}` } },
);
if (!res.ok) {
  console.error(`Lint API ${res.status}: ${await res.text()}`);
  process.exit(2);
}
const lints = await res.json();

// Stable fingerprint: name + level + first metadata value (table/function/etc).
const fp = (l) => {
  const meta = l.metadata
    ? Object.entries(l.metadata)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join("|")
    : "";
  return `${l.name}::${l.level}::${meta}`;
};

const current = lints.map(fp).sort();
const errors = lints.filter((l) => String(l.level).toUpperCase() === "ERROR");

if (UPDATE) {
  fs.writeFileSync(
    BASELINE,
    JSON.stringify({ updated_at: new Date().toISOString(), accepted: current }, null, 2),
  );
  console.log(`Baseline updated: ${current.length} accepted findings.`);
  process.exit(0);
}

const baseline = fs.existsSync(BASELINE)
  ? JSON.parse(fs.readFileSync(BASELINE, "utf8")).accepted ?? []
  : [];
const accepted = new Set(baseline);
const novel = current.filter((c) => !accepted.has(c));

console.log(`Total lints: ${current.length} | accepted: ${baseline.length} | new: ${novel.length} | errors: ${errors.length}`);

if (errors.length) {
  console.error("\nERROR-level findings (must fix):");
  for (const e of errors) console.error(`  - ${e.name} ${JSON.stringify(e.metadata ?? {})}`);
}
if (novel.length) {
  console.error("\nNew findings not in baseline:");
  for (const n of novel) console.error(`  - ${n}`);
  console.error(
    "\nFix them, or — if intentional — run `node scripts/supabase-lint-check.mjs --update` and commit the baseline.",
  );
}

if (errors.length || novel.length) process.exit(1);
console.log("OK — no new security findings.");
