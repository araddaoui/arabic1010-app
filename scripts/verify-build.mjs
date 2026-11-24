/**
 * Post-build guard.
 *
 * The app ships 319 native recordings from `public/audio`. Vite copies them to
 * `dist/audio` automatically, but a stale `dist` (or a build run with the wrong
 * publicDir) silently drops them — after which every word falls back to the
 * browser's speech synthesis and the product looks broken without any error.
 *
 * This asserts the deployed artifact is complete and fails the build loudly.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const publicAudio = path.join(root, "public", "audio");

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? countFiles(full) : 1;
  }
  return total;
}

const problems = [];

if (!fs.existsSync(path.join(dist, "index.html"))) {
  problems.push("dist/index.html is missing");
} else if (fs.statSync(path.join(dist, "index.html")).size < 100_000) {
  problems.push("dist/index.html looks truncated (expected the inlined bundle)");
}

const expectedAudio = countFiles(publicAudio);
const builtAudio = countFiles(path.join(dist, "audio"));

if (expectedAudio === 0) {
  problems.push("public/audio is empty — recordings would not ship");
} else if (builtAudio !== expectedAudio) {
  problems.push(
    `dist/audio has ${builtAudio} files but public/audio has ${expectedAudio} — ` +
      "native pronunciation audio would silently fall back to speech synthesis",
  );
}

if (problems.length) {
  console.error("\n✗ Build verification failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("  Run `npm run build` from a clean checkout and deploy `dist/`.\n");
  process.exit(1);
}

console.log(`✓ Build verified: dist/index.html + ${builtAudio} audio files.`);
