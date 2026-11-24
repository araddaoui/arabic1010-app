/**
 * One-command release.
 *
 * 1. Builds (the postbuild guard fails loudly if audio would not ship).
 * 2. Commits `dist/` only when the build actually changed it.
 *
 * Source changes are deliberately not staged: those belong in a reviewed
 * commit. Use `npm run release` after your code is already committed.
 */
import { spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const git = process.platform === "win32" ? "git.exe" : "git";
/** Set by npm when this script runs through `npm run`; avoids shell quoting. */
const npmCli = process.env.npm_execpath;

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n✗ ${command} ${args.join(" ")} failed (exit ${result.status}).`);
    process.exit(result.status ?? 1);
  }
}

if (npmCli) {
  run(process.execPath, [npmCli, "run", "build"]);
} else {
  // Fallback for direct `node scripts/release.mjs`; Windows needs a shell for .cmd.
  const result = spawnSync(npm, ["run", "build"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// `dist/` is listed in .gitignore but its files are tracked; -f keeps the
// committed artifact in sync with the build.
run(git, ["add", "-f", "--", "dist"]);

// `git diff --cached --quiet` exits 1 when the index differs from HEAD.
const changed = spawnSync(git, ["diff", "--cached", "--quiet", "--", "dist"]).status !== 0;

if (!changed) {
  console.log("\n✓ dist is already up to date — nothing to commit.");
  process.exit(0);
}

run(git, ["commit", "-m", "Rebuild dist"]);

const hash = spawnSync(git, ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).stdout?.trim();
console.log(`\n✓ Committed dist as ${hash}. Push when ready: git push`);
