#!/usr/bin/env node
/**
 * Extract LevelDB compendiums to packs-src/<name>/ (one JSON per document)
 * or compile back: packs-src -> packs paths from module.json.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const modulePath = path.join(root, "module.json");

const cmd = process.argv[2];
if (cmd !== "extract" && cmd !== "compile") {
  console.error("Usage: node scripts/packs-tool.mjs <extract|compile>");
  process.exit(1);
}

/** Fail fast when two JSON files share the same document `_id` (ambiguous pack key). */
async function assertUniqueDocumentIds(srcDir) {
  const names = await fs.readdir(srcDir);
  const byId = new Map();
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const filePath = path.join(srcDir, name);
    let doc;
    try {
      doc = JSON.parse(await fs.readFile(filePath, "utf8"));
    } catch {
      continue;
    }
    const id = doc?._id;
    if (!id) continue;
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(name);
  }
  const dups = [...byId.entries()].filter(([, files]) => files.length > 1);
  if (!dups.length) return;
  console.error(`Duplicate _id in ${path.relative(root, srcDir)}:`);
  for (const [id, files] of dups) {
    console.error(`  ${id}:`);
    for (const f of files) console.error(`    - ${f}`);
  }
  console.error("Keep one file per _id, then re-run packs:build.");
  process.exit(1);
}

const manifest = JSON.parse(await fs.readFile(modulePath, "utf8"));
const packs = manifest.packs ?? [];

for (const pack of packs) {
  const rel = pack.path.replace(/^\.\//, "");
  const packName = path.basename(rel);
  const dbDir = path.join(root, rel);
  const srcDir = path.join(root, "packs-src", packName);

  if (cmd === "extract") {
    await fs.mkdir(path.join(root, "packs-src"), { recursive: true });
    await extractPack(dbDir, srcDir, { log: true });
  } else {
    await assertUniqueDocumentIds(srcDir);
    // Fresh LevelDB avoids foundryvtt-cli LEVEL_ITERATOR_NOT_OPEN when deleting
    // stale keys (e.g. removed Core journal copies) across sequential packs.
    await fs.rm(dbDir, { recursive: true, force: true });
    await fs.mkdir(dbDir, { recursive: true });
    await compilePack(srcDir, dbDir, { log: true });
  }
}
