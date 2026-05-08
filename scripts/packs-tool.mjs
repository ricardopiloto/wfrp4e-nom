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
  console.error('Usage: node scripts/packs-tool.mjs <extract|compile>');
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
    await compilePack(srcDir, dbDir, { log: true });
  }
}
