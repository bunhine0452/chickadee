#!/usr/bin/env node
/**
 * sync-version.mjs — 버전 단일 출처 (06 §5.3-3)
 *
 * 진실은 루트 `package.json` 의 `version` 하나다. 그 값을 세 곳에 민다.
 *
 *   apps/desktop/package.json               "version"
 *   apps/desktop/src-tauri/tauri.conf.json  "version"          — 번들 파일명이 이 값을 쓴다
 *   Cargo.toml                              [workspace.package] version
 *
 *   node scripts/sync-version.mjs           맞춰 쓴다
 *   node scripts/sync-version.mjs --check   어긋나면 1 로 죽는다 (CI 게이트·릴리스 절차)
 *
 * `Cargo.lock` 은 **여기서 고치지 않는다.** 락은 카고가 소유하는 산출물이라 정규식으로
 * 만지면 다음 `cargo` 명령이 조용히 되돌리고, 그 사이의 `--locked` 빌드만 깨진다.
 * 버전을 올린 뒤에는 `cargo update -w` 를 돌린다 — 아래 출력이 그렇게 안내한다.
 *
 * JSON 은 파싱해서 다시 쓰지 않고 `"version"` 줄만 바꾼다. `JSON.stringify` 로 다시 쓰면
 * 들여쓰기·키 순서·끝 개행이 전부 diff 에 실려서 「버전 한 글자」가 파일 전체 변경이 된다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

/** 진실이 사는 곳. */
export const SOURCE = 'package.json';

/** 미는 곳 셋. `Cargo.lock` 이 없는 것은 빠뜨린 게 아니라 위 주석의 결정이다. */
export const TARGETS = [
  { file: 'apps/desktop/package.json', kind: 'json' },
  { file: 'apps/desktop/src-tauri/tauri.conf.json', kind: 'json' },
  { file: 'Cargo.toml', kind: 'cargo' },
];

/** 최상위 `"version": "…"` 한 줄. 들여쓰기·따옴표를 그대로 두고 값만 잡는다. */
const JSON_VERSION = /^([ \t]*"version"[ \t]*:[ \t]*")([^"]*)(")/m;

/**
 * `[workspace.package]` 절 안의 `version = "…"`.
 * `[^[]*?` 가 다음 절 머리(`[`)를 넘지 못하므로 `[workspace.dependencies]` 의
 * `serde = { version = "1" }` 같은 줄은 잡히지 않는다.
 */
const CARGO_VERSION = /(^\[workspace\.package\][^[]*?^[ \t]*version[ \t]*=[ \t]*")([^"]*)(")/m;

const patternFor = (kind) => (kind === 'cargo' ? CARGO_VERSION : JSON_VERSION);

function readTarget(root, target) {
  const path = join(root, target.file);
  const text = readFileSync(path, 'utf8');
  const found = patternFor(target.kind).exec(text);
  if (!found) throw new Error(`${target.file}: 버전 필드를 못 찾았다`);
  // JSON 은 파싱값과 대조한다 — 정규식이 중첩된 "version" 을 먼저 물었다면 여기서 걸린다.
  if (target.kind === 'json' && JSON.parse(text).version !== found[2]) {
    throw new Error(`${target.file}: 최상위 "version" 이 아닌 자리를 물었다`);
  }
  return { path, text, current: found[2] };
}

export function sourceVersion(root = ROOT) {
  const value = JSON.parse(readFileSync(join(root, SOURCE), 'utf8')).version;
  // tauri.conf.json 은 semver 가 아니면 빌드에서 죽는다 — 여기서 먼저 죽는 편이 싸다.
  if (typeof value !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)*$/.test(value)) {
    throw new Error(`${SOURCE}: version 이 semver 가 아니다 — ${JSON.stringify(value)}`);
  }
  return value;
}

/** 읽기만 한다. `--check` 와 테스트가 쓰는 것. */
export function plan(root = ROOT) {
  const version = sourceVersion(root);
  const entries = TARGETS.map((target) => {
    const { current } = readTarget(root, target);
    return { file: target.file, kind: target.kind, current, ok: current === version };
  });
  return { version, entries, off: entries.filter((e) => !e.ok) };
}

/** 어긋난 파일만 쓴다. 이미 맞는 파일은 손대지 않아 mtime 도 안 바뀐다. */
export function apply(root = ROOT) {
  const version = sourceVersion(root);
  const written = [];
  for (const target of TARGETS) {
    const { path, text, current } = readTarget(root, target);
    if (current === version) continue;
    const next = text.replace(patternFor(target.kind), (_m, lead, _old, tail) => lead + version + tail);
    writeFileSync(path, next, 'utf8');
    written.push(target.file);
  }
  return { version, written };
}

const LOCK_HINT =
  'Cargo.lock 의 chickadee-* 버전은 이 스크립트가 만지지 않는다 — `cargo update -w` 를 돌려라.\n';

export function main(argv) {
  const rest = argv.filter((a) => a !== '--check');
  if (rest.length > 0) {
    process.stderr.write(`알 수 없는 인자: ${rest.join(' ')}\n사용법: node scripts/sync-version.mjs [--check]\n`);
    return 2;
  }

  if (argv.includes('--check')) {
    const { version, entries, off } = plan();
    for (const e of off) process.stdout.write(`${e.file}: ${e.current} ≠ ${version}\n`);
    if (off.length === 0) {
      process.stdout.write(`버전 동기: ${version} — ${entries.length}곳 일치\n`);
      return 0;
    }
    process.stdout.write(`버전 동기: ${off.length}곳 어긋남 — \`node scripts/sync-version.mjs\` 로 맞춰라.\n`);
    process.stdout.write(LOCK_HINT);
    return 1;
  }

  const { version, written } = apply();
  for (const file of written) process.stdout.write(`${file} → ${version}\n`);
  process.stdout.write(written.length === 0 ? `버전 동기: ${version} — 바꿀 것 없음\n` : `버전 동기: ${version} — ${written.length}곳 갱신\n`);
  if (written.includes('Cargo.toml')) process.stdout.write(LOCK_HINT);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
