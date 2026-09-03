/**
 * 버전 동기 게이트 (06 §5.3-3). 게이트 자체가 맞는지 — 어긋남을 잡고, 포맷은 안 건드리는지.
 *
 * 리포의 실제 파일에는 `plan()`(읽기 전용)만 건다. 쓰기 검사는 전부 임시 디렉터리의
 * 축소본에서 한다 — 테스트가 `apply(ROOT)` 를 부르면 자기가 검사하려던 파일을 고쳐 버린다.
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { apply, plan, ROOT, sourceVersion, TARGETS } from './sync-version.mjs';

const ROOT_PKG = `{
  "name": "chickadee",
  "version": "0.2.0",
  "private": true
}
`;

const DESKTOP_PKG = `{
  "name": "@chickadee/desktop",
  "version": "0.1.0",
  "dependencies": {
    "react": "^19.0.0"
  }
}
`;

const TAURI_CONF = `{
  "productName": "Chickadee",
  "version": "0.1.0",
  "bundle": {
    "targets": "all"
  }
}
`;

const CARGO = `[workspace]
resolver = "2"

[workspace.package]
version = "0.1.0"
edition = "2021"

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
`;

const made = [];

afterEach(() => {
  while (made.length > 0) rmSync(made.pop(), { recursive: true, force: true });
});

/** 네 파일의 축소본. `rootVersion` 만 바꿔 가며 부른다. */
function fixture(rootVersion = '0.2.0') {
  const root = mkdtempSync(join(tmpdir(), 'chickadee-version-'));
  made.push(root);
  const files = {
    'package.json': ROOT_PKG.replace('0.2.0', rootVersion),
    'apps/desktop/package.json': DESKTOP_PKG,
    'apps/desktop/src-tauri/tauri.conf.json': TAURI_CONF,
    'Cargo.toml': CARGO,
  };
  for (const [rel, text] of Object.entries(files)) {
    const at = join(root, rel);
    mkdirSync(dirname(at), { recursive: true });
    writeFileSync(at, text, 'utf8');
  }
  return root;
}

const read = (root, rel) => readFileSync(join(root, rel), 'utf8');

describe('버전 동기', () => {
  test('리포가 어긋나 있지 않다 — package.json 이 세 곳과 같다', () => {
    expect(plan(ROOT).off).toEqual([]);
  });

  test('세 곳 모두를 본다 (Cargo.lock 은 일부러 뺀다)', () => {
    expect(TARGETS.map((t) => t.file)).toEqual([
      'apps/desktop/package.json',
      'apps/desktop/src-tauri/tauri.conf.json',
      'Cargo.toml',
    ]);
  });

  test('어긋나면 `--check` 가 잡는다', () => {
    const { version, off } = plan(fixture('0.2.0'));
    expect(version).toBe('0.2.0');
    expect(off.map((e) => [e.file, e.current])).toEqual([
      ['apps/desktop/package.json', '0.1.0'],
      ['apps/desktop/src-tauri/tauri.conf.json', '0.1.0'],
      ['Cargo.toml', '0.1.0'],
    ]);
  });

  test('맞으면 통과한다', () => {
    expect(plan(fixture('0.1.0')).off).toEqual([]);
  });

  test('세 파일에 버전을 민다', () => {
    const root = fixture('0.2.0');
    expect(apply(root).written).toHaveLength(3);
    expect(plan(root).off).toEqual([]);
    expect(read(root, 'apps/desktop/package.json')).toContain('"version": "0.2.0"');
    expect(read(root, 'apps/desktop/src-tauri/tauri.conf.json')).toContain('"version": "0.2.0"');
    expect(read(root, 'Cargo.toml')).toContain('version = "0.2.0"');
  });

  test('JSON 의 들여쓰기·키 순서·끝 개행이 그대로다', () => {
    const root = fixture('0.2.0');
    apply(root);
    expect(read(root, 'apps/desktop/package.json')).toBe(DESKTOP_PKG.replace('"0.1.0"', '"0.2.0"'));
    expect(read(root, 'apps/desktop/src-tauri/tauri.conf.json')).toBe(TAURI_CONF.replace('"0.1.0"', '"0.2.0"'));
  });

  test('의존성의 `version = "1"` 은 건드리지 않는다', () => {
    const root = fixture('0.2.0');
    apply(root);
    const cargo = read(root, 'Cargo.toml');
    expect(cargo).toContain('serde = { version = "1", features = ["derive"] }');
    expect(cargo).toBe(CARGO.replace('version = "0.1.0"', 'version = "0.2.0"'));
  });

  test('이미 맞으면 아무것도 쓰지 않는다', () => {
    const root = fixture('0.2.0');
    apply(root);
    expect(apply(root).written).toEqual([]);
  });

  test('semver 가 아닌 버전은 거부한다 — tauri 빌드보다 먼저 죽는 편이 싸다', () => {
    const root = fixture('0.2');
    expect(() => sourceVersion(root)).toThrow(/semver/);
  });

  test('프리릴리스 표기는 받는다', () => {
    expect(sourceVersion(fixture('0.2.0-rc.1'))).toBe('0.2.0-rc.1');
  });
});
