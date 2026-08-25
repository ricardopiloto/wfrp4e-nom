#!/usr/bin/env node
/**
 * Convert module icons under icons/ from PNG/JPEG to WebP and rewrite
 * matching paths in packs-src/ (wfrp4e-nom + legacy nations-of-mankind-wfrp4e).
 *
 * Dry-run by default. Use --write to convert, update JSON/HTML strings, and
 * delete source raster files after a successful convert.
 *
 * Requires ImageMagick 7 (`magick`) on PATH.
 *
 * Usage:
 *   node scripts/convert-icons-to-webp.mjs
 *   node scripts/convert-icons-to-webp.mjs --write
 *   node scripts/convert-icons-to-webp.mjs --write --quality=82
 *   node scripts/convert-icons-to-webp.mjs --write --path=icons/careers/foo.png
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICONS_DIR = path.join(root, "icons");
const PACKS_SRC = path.join(root, "packs-src");

const args = process.argv.slice(2);
const write = args.includes("--write");
const qualityArg = args.find((a) => a.startsWith("--quality="));
const quality = qualityArg ? Number(qualityArg.split("=")[1]) : 82;
const pathArg = args.find((a) => a.startsWith("--path="));
const singleRel = pathArg ? pathArg.slice("--path=".length) : null;

const RASTER_RE = /\.(png|jpe?g)$/i;
const MODULE_ICON_RE =
  /(modules\/(?:wfrp4e-nom|nations-of-mankind-wfrp4e)\/icons\/[^"'\\\s<>]+)\.(png|jpe?g)/gi;

function hasMagick() {
  const r = spawnSync("magick", ["-version"], { encoding: "utf8" });
  return r.status === 0;
}

async function walkFiles(dir) {
  /** @type {string[]} */
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walkFiles(full)));
    else out.push(full);
  }
  return out;
}

function toWebpPath(filePath) {
  return filePath.replace(RASTER_RE, ".webp");
}

/** Prefer kebab-case basenames (underscores → hyphens). */
function kebabBasename(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const next = base.replace(/_/g, "-");
  if (next === "Kislev.webp") return path.join(dir, "kislev.webp");
  return path.join(dir, next);
}

function convertOne(srcAbs, destAbs) {
  const r = spawnSync(
    "magick",
    [srcAbs, "-strip", "-quality", String(quality), destAbs],
    { encoding: "utf8" }
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `magick failed for ${srcAbs}`);
  }
}

function rewriteModuleIconPaths(text) {
  return text.replace(MODULE_ICON_RE, "$1.webp");
}

function countModuleIconRasters(text) {
  return [...text.matchAll(MODULE_ICON_RE)].length;
}

async function main() {
  if (!hasMagick()) {
    console.error("ImageMagick `magick` not found on PATH. Install ImageMagick 7.");
    process.exit(1);
  }
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
    console.error("--quality must be 1–100");
    process.exit(1);
  }

  let sources;
  if (singleRel) {
    const abs = path.resolve(root, singleRel);
    if (!abs.startsWith(ICONS_DIR + path.sep) && abs !== ICONS_DIR) {
      console.error(`--path must be under icons/: ${singleRel}`);
      process.exit(1);
    }
    if (!RASTER_RE.test(abs)) {
      console.error(`--path must be a .png/.jpg/.jpeg file: ${singleRel}`);
      process.exit(1);
    }
    sources = [abs];
  } else {
    sources = (await walkFiles(ICONS_DIR)).filter((f) => RASTER_RE.test(f));
  }

  console.log(
    `${write ? "WRITE" : "DRY-RUN"}: ${sources.length} raster(s) under icons/ → WebP (quality ${quality})`
  );

  let converted = 0;
  let skipped = 0;
  for (const src of sources.sort()) {
    const destRaw = toWebpPath(src);
    const dest = kebabBasename(destRaw);
    const rel = path.relative(root, src);
    try {
      await fs.access(dest);
      console.log(`  skip (webp exists): ${rel}`);
      skipped++;
      if (write) {
        await fs.unlink(src);
        console.log(`  removed source:     ${rel}`);
      }
      continue;
    } catch {
      /* dest missing — convert */
    }

    if (!write) {
      console.log(`  would convert: ${rel} → ${path.relative(root, dest)}`);
      converted++;
      continue;
    }

    convertOne(src, dest);
    await fs.unlink(src);
    console.log(`  converted: ${rel} → ${path.relative(root, dest)}`);
    converted++;
  }

  // Rename any remaining underscore basenames under icons/ to kebab-case.
  let renamed = 0;
  const allIcons = await walkFiles(ICONS_DIR);
  /** @type {Map<string, string>} old modules/... path → new */
  const pathRewrites = new Map();
  for (const abs of allIcons.sort()) {
    const kebab = kebabBasename(abs);
    if (kebab === abs) continue;
    const oldRel = path.relative(root, abs).split(path.sep).join("/");
    const newRel = path.relative(root, kebab).split(path.sep).join("/");
    if (!write) {
      console.log(`  would rename: ${oldRel} → ${newRel}`);
      renamed++;
      continue;
    }
    try {
      await fs.access(kebab);
      console.log(`  skip rename (target exists): ${oldRel}`);
      continue;
    } catch {
      /* ok */
    }
    await fs.rename(abs, kebab);
    pathRewrites.set(`modules/wfrp4e-nom/${oldRel}`, `modules/wfrp4e-nom/${newRel}`);
    pathRewrites.set(
      `modules/nations-of-mankind-wfrp4e/${oldRel}`,
      `modules/nations-of-mankind-wfrp4e/${newRel}`
    );
    console.log(`  renamed: ${oldRel} → ${newRel}`);
    renamed++;
  }

  const jsonFiles = (await walkFiles(PACKS_SRC)).filter((f) => f.endsWith(".json"));
  let filesTouched = 0;
  let replacements = 0;

  for (const file of jsonFiles) {
    const before = await fs.readFile(file, "utf8");
    let after = rewriteModuleIconPaths(before);
    for (const [oldPath, newPath] of pathRewrites) {
      if (after.includes(oldPath)) {
        const n = after.split(oldPath).length - 1;
        after = after.split(oldPath).join(newPath);
        replacements += n;
      }
    }
    // Also normalize underscore → hyphen inside module icon path basenames.
    after = after.replace(
      /(modules\/(?:wfrp4e-nom|nations-of-mankind-wfrp4e)\/icons\/)([^"'\\\s<>]+)/g,
      (_m, prefix, rest) => {
        const parts = rest.split("/");
        parts[parts.length - 1] = parts[parts.length - 1].replace(/_/g, "-");
        if (parts[parts.length - 1] === "Kislev.webp") parts[parts.length - 1] = "kislev.webp";
        return prefix + parts.join("/");
      }
    );
    const count = countModuleIconRasters(before);
    if (after === before) continue;
    replacements += count;
    filesTouched++;
    const rel = path.relative(root, file);
    if (write) {
      await fs.writeFile(file, after, "utf8");
      console.log(`  packs-src updated: ${rel}`);
    } else {
      console.log(`  would update packs-src: ${rel}`);
    }
  }

  console.log(
    `\nSummary: convert=${converted} skipExistingWebp=${skipped} renamed=${renamed} packsFiles=${filesTouched} pathReplacements≈${replacements} mode=${write ? "write" : "dry-run"}`
  );
  if (!write) {
    console.log("Re-run with --write to apply.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
