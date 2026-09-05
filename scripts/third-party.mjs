/**
 * Generates THIRD_PARTY_NOTICES.md (06 §7.1).
 *
 *   node scripts/third-party.mjs            write the file
 *   node scripts/third-party.mjs --check    fail if the committed file is stale
 *
 * Two sources, both read from lockfiles so the output does not depend on what is
 * installed on the machine that runs this:
 *
 *   npm    `pnpm licenses list --prod --json` — production only. Dev tooling
 *          (vite, eslint, playwright) is not shipped, so it is not a notice.
 *   Rust   `cargo about generate --format json` when cargo-about is installed,
 *          otherwise `cargo metadata --format-version 1 --locked`. The fallback
 *          carries name, version and the declared SPDX expression, but no license
 *          texts — the script says on stdout which of the two produced the file.
 *
 * The output must be byte-identical between runs (CI diffs it), so nothing here
 * writes a date, a path from this machine, or a set iteration order.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = `${ROOT}THIRD_PARTY_NOTICES.md`;

/** Sort key for a dependency row. Version is compared as text — it only breaks ties. */
const byNameThenVersion = (a, b) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : a.version < b.version ? -1 : a.version > b.version ? 1 : 0;

/**
 * One SPDX expression per row. Crates published before Cargo required SPDX write
 * `MIT/Apache-2.0`; that slash means OR, so it is rewritten to keep the table from
 * holding two spellings of one license.
 */
export function normalizeLicense(raw) {
  if (raw === null || raw === undefined || raw === '') return 'NOT DECLARED';
  return String(raw).replace(/\s*\/\s*/g, ' OR ').replace(/\s+/g, ' ').trim();
}

/** `pnpm licenses list --json` groups by license and repeats a package once per version. */
export function normalizeNpm(json) {
  const rows = [];
  for (const group of Object.values(json)) {
    for (const entry of group) {
      for (const version of entry.versions ?? []) {
        rows.push({
          name: entry.name,
          version,
          license: normalizeLicense(entry.license),
          url: entry.homepage ?? '',
        });
      }
    }
  }
  return rows.sort(byNameThenVersion);
}

/**
 * Crates the shipped binary can contain, out of `cargo metadata`.
 *
 * The walk starts at the workspace members and follows every dependency edge that is
 * not dev-only. Dropping dev-only edges is what keeps criterion, insta and tempfile —
 * which no user ever receives — out of the notices. Platform `cfg()` edges are kept:
 * we release for macOS, Windows and Linux from one lockfile, so the windows-sys family
 * is shipped even though it is dead weight on this machine.
 */
export function normalizeCargoMetadata(meta) {
  const nodes = new Map((meta.resolve?.nodes ?? []).map((n) => [n.id, n]));
  const packages = new Map((meta.packages ?? []).map((p) => [p.id, p]));
  const members = new Set(meta.workspace_members ?? []);

  const seen = new Set();
  const stack = [...members];
  while (stack.length > 0) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const dep of nodes.get(id)?.deps ?? []) {
      const kinds = dep.dep_kinds ?? [];
      if (kinds.length > 0 && kinds.every((k) => k.kind === 'dev')) continue;
      stack.push(dep.pkg);
    }
  }

  const rows = [];
  for (const id of seen) {
    if (members.has(id)) continue; // the workspace crates are this project, MIT, publish = false
    const pkg = packages.get(id);
    if (pkg === undefined) continue;
    rows.push({
      name: pkg.name,
      version: pkg.version,
      license: normalizeLicense(pkg.license),
      url: pkg.repository ?? '',
    });
  }
  return rows.sort(byNameThenVersion);
}

/**
 * cargo-about's JSON. Its shape has moved between releases, so this reads the fields
 * defensively and the caller falls back to `cargo metadata` when nothing comes out.
 */
export function normalizeCargoAbout(data) {
  const list = Array.isArray(data) ? data : (data?.licenses ?? data?.crates ?? []);
  const rows = [];
  for (const entry of Array.isArray(list) ? list : []) {
    const used = entry.used_by ?? entry.crates ?? [entry];
    for (const item of Array.isArray(used) ? used : [used]) {
      const crate = item.crate ?? item;
      if (crate?.name === undefined || crate?.version === undefined) continue;
      rows.push({
        name: crate.name,
        version: crate.version,
        license: normalizeLicense(entry.id ?? entry.name ?? entry.license ?? crate.license),
        url: crate.repository ?? '',
      });
    }
  }
  const unique = new Map();
  for (const row of rows) {
    const key = `${row.name}@${row.version}`;
    const kept = unique.get(key);
    if (kept === undefined) unique.set(key, row);
    else if (!kept.license.includes(row.license)) kept.license = `${kept.license} AND ${row.license}`;
  }
  return [...unique.values()].sort(byNameThenVersion);
}

const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

function readNpm() {
  return normalizeNpm(JSON.parse(run('pnpm', ['licenses', 'list', '--prod', '--json'])));
}

/** @returns {{rows: object[], source: string}} */
function readRust() {
  try {
    const rows = normalizeCargoAbout(JSON.parse(run('cargo', ['about', 'generate', '--format', 'json'])));
    if (rows.length > 0) return { rows, source: 'cargo about' };
    console.log('note: `cargo about` produced no crates — falling back to `cargo metadata`.');
  } catch {
    console.log('note: `cargo about` is not installed (or failed) — falling back to `cargo metadata`.');
    console.log('      the fallback lists name, version and the declared SPDX expression; it does not');
    console.log('      collect license texts. Install it with `cargo install cargo-about --locked`.');
  }
  const meta = JSON.parse(run('cargo', ['metadata', '--format-version', '1', '--locked']));
  return { rows: normalizeCargoMetadata(meta), source: 'cargo metadata' };
}

const escapePipes = (text) => String(text).replace(/\|/g, '\\|');

function table(rows) {
  const lines = ['| Package | Version | License |', '|---|---|---|'];
  for (const row of rows) lines.push(`| ${escapePipes(row.name)} | ${row.version} | ${escapePipes(row.license)} |`);
  return lines.join('\n');
}

/** Every distinct license expression, for the summary line above each table. */
const licenseSummary = (rows) => [...new Set(rows.map((r) => r.license))].sort().join(' · ');

export function renderNotices({ npm, rust, rustSource }) {
  return `# Third-party notices

Chickadee is MIT licensed (\`LICENSE\`). It is built from, and ships with, the software
listed below. Each item stays under its own license.

This file is generated — run \`node scripts/third-party.mjs\` and commit the result. Do not
edit it by hand. npm rows come from \`pnpm licenses list --prod --json\`, so development-only
tooling is not listed; it is not distributed. Rust rows come from \`${rustSource}\`, walking
the workspace lockfile and dropping dev-only dependency edges. Where a crate declared its
license the old way (\`MIT/Apache-2.0\`), the slash is written as \`OR\`.

\`cargo deny check licenses\` holds the list of licenses that may enter the tree; anything
outside it fails CI. See \`deny.toml\` for the list and for the five per-crate MPL-2.0
exceptions.

## Bundled fonts

Two font families are bundled in the application binary (\`apps/desktop/src/assets/fonts/\`),
8 files and 1.80 MB uncompressed. They are not subsetted and they are not fetched over the
network at runtime.

| Font | Weights | Copyright | License | Full text |
|---|---|---|---|---|
| IBM Plex Sans KR | 400 · 500 · 600 · 700 | © 2017 IBM Corp., Reserved Font Name "Plex" | SIL OFL 1.1 | \`apps/desktop/src/assets/fonts/OFL-Plex.txt\` |
| IBM Plex Mono | 400 · 500 · 600 · 700 | © 2017 IBM Corp., Reserved Font Name "Plex" | SIL OFL 1.1 | \`apps/desktop/src/assets/fonts/OFL-Plex.txt\` |

Black Han Sans was removed in 2026-09 along with the display type role that used it. Its
files and its copy of the OFL are gone from the tree.

The OFL obligations this project is under:

- The license text ships with the fonts. \`OFL-Plex.txt\` is in the repository and in the
  application bundle, and it covers both families.
- The fonts are not sold on their own. They are bundled inside a larger work.
- Neither family is modified — no glyph is dropped and the \`name\` table is untouched — so no
  Reserved Font Name has to change.
- The exact download URLs for re-fetching every file are in
  \`apps/desktop/src/assets/fonts/README.md\`.

## npm packages

${npm.length} packages, production dependencies only. Licenses in use: ${licenseSummary(npm)}.

${table(npm)}

## Rust crates

${rust.length} crates reachable from the workspace members without a dev-only edge, across all
three release platforms. Licenses in use: ${licenseSummary(rust)}.

${table(rust)}
`;
}

function main() {
  const npm = readNpm();
  const { rows: rust, source: rustSource } = readRust();
  const text = renderNotices({ npm, rust, rustSource });

  if (process.argv.includes('--check')) {
    const current = readFileSync(OUT, 'utf8');
    if (current === text) {
      console.log(`ok   THIRD_PARTY_NOTICES.md is current (${npm.length} npm · ${rust.length} crates)`);
      return;
    }
    console.error('FAIL THIRD_PARTY_NOTICES.md is stale — run `node scripts/third-party.mjs` and commit.');
    process.exitCode = 1;
    return;
  }

  writeFileSync(OUT, text);
  console.log(`wrote THIRD_PARTY_NOTICES.md — ${npm.length} npm packages, ${rust.length} Rust crates (${rustSource})`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) main();
