/**
 * 카탈로그 린트 (D117).
 *
 * 「없는 키」는 타입이 잡는다 — `t()` 가 `MessageKey` 만 받으므로 오타는 `tsc` 에서 죽는다.
 * 타입이 못 잡는 넷을 여기서 잡는다: `en` 의 고아 키 · 두 언어의 변수 집합 어긋남 ·
 * `en` 의 조사 필터 · **아무도 안 쓰는 키**.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { en } from './en.js';
import { ko, type MessageKey } from './ko.js';

const KEYS = Object.keys(ko) as MessageKey[];

/** `{{pick.1|code}}` 에서 `pick.1` 만. 섹션 여닫이도 이름 하나로 센다. */
function varsOf(tpl: string): Set<string> {
  const out = new Set<string>();
  for (const m of tpl.matchAll(/\{\{([#^/]?)([^{}]*)\}\}/g)) {
    const name = (m[2] ?? '').split('|')[0]?.trim();
    if (name !== undefined && name !== '') out.add(name);
  }
  return out;
}

function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    try {
      statSync(join(dir, 'pnpm-workspace.yaml'));
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  throw new Error('pnpm-workspace.yaml 을 못 찾았다');
}

/** `apps` 와 `packages` 아래 각 패키지의 `src` 전부. 카탈로그 자신과 테스트는 뺀다. */
function sourceFiles(): string[] {
  const root = repoRoot();
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist') walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (/\.test\.tsx?$/.test(entry.name)) continue;
      if (full.includes(join('packages', 'i18n', 'src'))) continue;
      out.push(full);
    }
  };
  for (const group of ['apps', 'packages']) {
    for (const pkg of readdirSync(join(root, group), { withFileTypes: true })) {
      if (!pkg.isDirectory()) continue;
      const src = join(root, group, pkg.name, 'src');
      try {
        statSync(src);
      } catch {
        continue;
      }
      walk(src);
    }
  }
  return out;
}

describe('카탈로그', () => {
  it('en 에 ko 가 모르는 키가 없다 (고아 키)', () => {
    const unknown = Object.keys(en).filter((k) => !(k in ko));
    expect(unknown).toEqual([]);
  });

  it('ko 값이 비어 있지 않다', () => {
    expect(KEYS.filter((k) => ko[k].trim() === '')).toEqual([]);
  });

  it('두 언어의 변수 집합이 같다', () => {
    const differ: string[] = [];
    for (const key of KEYS) {
      const value = en[key];
      if (value === undefined) continue;
      const a = [...varsOf(ko[key])].sort();
      const b = [...varsOf(value)].sort();
      if (a.join('|') !== b.join('|')) differ.push(key);
    }
    expect(differ).toEqual([]);
  });

  it('en 은 조사 필터를 쓰지 않는다', () => {
    const withJosa = Object.entries(en)
      .filter(([, v]) => v !== undefined && v.includes('|josa:'))
      .map(([k]) => k);
    expect(withJosa).toEqual([]);
  });

  it('키 이름은 `화면.자리` 다', () => {
    const bad = KEYS.filter((k) => !/^[a-z][A-Za-z0-9]*(\.[a-z][A-Za-z0-9]*)+$/.test(k));
    expect(bad).toEqual([]);
  });

  it('아무도 안 쓰는 키가 없다', () => {
    const sources = sourceFiles().map((f) => readFileSync(f, 'utf8')).join('\n');
    const unused = KEYS.filter((k) => !sources.includes(`'${k}'`) && !sources.includes(`"${k}"`));
    expect(unused).toEqual([]);
  });
});
