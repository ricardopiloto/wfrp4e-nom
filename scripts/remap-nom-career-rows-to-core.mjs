#!/usr/bin/env node
/**
 * Remap Career___Human__*.json results[].name from supplement-style labels to Core
 * Rulebook career page names (openspec remap-nom-career-rows-core-catalog).
 * Run migrate-career-rolltable-links after this to refresh @UUID descriptions.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const TABLES_DIR = path.join(root, "packs-src/nom-tables");

/** @type {Record<string, string>} Old label → Core journal pages[].name (NoM-only careers omitted) */
const REMAP = {
  "Sartosan Pirate": "Smuggler",
  Skald: "Entertainer",
  Swordsaint: "Protagonist",
  "Vampire Hunter": "Witch Hunter"
};

async function main() {
  const files = (await fs.readdir(TABLES_DIR))
    .filter((f) => f.startsWith("Career___Human__") && f.endsWith(".json"))
    .sort();

  let filesTouched = 0;
  let rowsRemapped = 0;

  for (const file of files) {
    const fpath = path.join(TABLES_DIR, file);
    const raw = await fs.readFile(fpath, "utf8");
    const doc = JSON.parse(raw);
    let changed = false;

    for (const r of doc.results ?? []) {
      const prev = typeof r.name === "string" ? r.name : "";
      const next = REMAP[prev];
      if (next) {
        r.name = next;
        changed = true;
        rowsRemapped++;
      }
    }

    if (changed) {
      filesTouched++;
      await fs.writeFile(fpath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    }
  }

  console.log(
    JSON.stringify(
      { tables: files.length, filesTouched, rowsRemapped, keys: Object.keys(REMAP).length },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
