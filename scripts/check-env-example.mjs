#!/usr/bin/env node
// Checks that .env.example lists every env var name from the PRD §7
// "Environment variables" table, grouped under the three expected comments,
// with no values. The PRD is the source of the names, so a new var added
// there fails this check until .env.example catches up.
//
// Usage: node scripts/check-env-example.mjs [prdPath] [envExamplePath]

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const prdPath = resolve(root, process.argv[2] ?? "docs/PRD.md");
const envPath = resolve(root, process.argv[3] ?? ".env.example");

// PRD table row label -> required group comment in .env.example
const GROUPS = {
  "web (Vercel)": "# web (Vercel)",
  Convex: "# Convex (set with npx convex env set)",
  Brev: "# Brev (ai-service, never in this repo)",
};

/** @returns {Map<string, string[]>} group label -> var names */
function namesFromPrd(text) {
  const start = text.indexOf("**Environment variables**");
  if (start === -1) throw new Error("PRD has no **Environment variables** table");
  const groups = new Map();
  for (const line of text.slice(start).split(/\r?\n/).slice(1)) {
    if (groups.size > 0 && !line.trim().startsWith("|")) break;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;
    const label = cells[1];
    if (!(label in GROUPS)) continue;
    const names = [...cells[2].matchAll(/`([A-Z][A-Z0-9_]*)`/g)].map((m) => m[1]);
    groups.set(label, names);
  }
  return groups;
}

/** @returns {{ entries: Map<string, {value: string, group: string | null, line: number}>, errors: string[] }} */
function parseEnvExample(text) {
  const entries = new Map();
  const errors = [];
  let group = null;
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    const n = i + 1;
    if (line === "") return;
    if (line.startsWith("#")) {
      if (Object.values(GROUPS).includes(line)) group = line;
      return;
    }
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!m) {
      errors.push(`line ${n}: not NAME= or a comment: ${JSON.stringify(line)}`);
      return;
    }
    const [, name, value] = m;
    if (entries.has(`${group}::${name}`)) {
      errors.push(`line ${n}: ${name} listed twice in the same group`);
    }
    // A name can appear in more than one group (AI_SHARED_SECRET is on Convex and Brev).
    entries.set(`${group}::${name}`, { value, group, line: n });
    if (value !== "") errors.push(`line ${n}: ${name} has a value; .env.example must be names only`);
  });
  return { entries, errors };
}

let prdText;
let envText;
try {
  prdText = readFileSync(prdPath, "utf8");
} catch {
  console.error(`check:env FAIL: cannot read ${prdPath}`);
  process.exit(1);
}
try {
  envText = readFileSync(envPath, "utf8");
} catch {
  console.error(`check:env FAIL: cannot read ${envPath}`);
  process.exit(1);
}

const expected = namesFromPrd(prdText);
const errors = [];
for (const label of Object.keys(GROUPS)) {
  if (!expected.has(label)) errors.push(`PRD §7 env table has no "${label}" row`);
}

const { entries, errors: parseErrors } = parseEnvExample(envText);
errors.push(...parseErrors);

let total = 0;
for (const [label, names] of expected) {
  const comment = GROUPS[label];
  for (const name of names) {
    total++;
    if (!entries.has(`${comment}::${name}`)) {
      errors.push(`missing ${name} under "${comment}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(`check:env FAIL (${errors.length} problem(s)) in ${envPath}:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`check:env OK: ${total} PRD §7 names present in .env.example, all empty.`);
