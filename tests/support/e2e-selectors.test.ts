/**
 * 실제 바이너리 e2e(`tests/e2e/**`)가 부르는 이름이 소스에서 **아예 사라졌는지** 본다.
 *
 * 왜 있나: 2026-09-05 에 그 잡이 같은 이유로 두 번 빨갰다. 그 스펙들은 `tauri-driver` 로
 * 빌드된 앱을 **리눅스에서만** 띄우므로 macOS 개발기에서는 안 돈다 — 로컬이 전부 초록인
 * 채로 푸시해야 알 수 있었다.
 *
 * **이 시험이 무엇을 못 잡는지 먼저 적는다.** 오늘의 두 사고를 재현해 대 봤더니 **둘 다
 * 안 걸렸다.** `.qlist` 는 다른 요소에 이름이 그대로 살아 있었고(보이지 않게 됐을 뿐),
 * `main.settings` 도 `settings` 라는 글자가 소스에 남아 있었다. 구조·가시성이 바뀐 것은
 * 정적 대조로 못 본다 — 그것은 실행이 판정한다.
 *
 * 그래서 이 시험의 약속은 하나로 좁힌다: **이름이 코드베이스에서 통째로 없어지면 걸린다.**
 * 그 값도 작지 않다 — 컴포넌트를 지우거나 문구 낱말을 갈아 끼우는 판이 잦고, 그때는
 * 리눅스 CI 를 기다리지 않고 여기서 죽는다. 대신 초록이라고 안심하면 안 된다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

const SPEC_DIR = 'tests/e2e/specs';
/**
 * 이름이 살아 있는지 찾아볼 곳. 마크업·문구가 여기 있다.
 *
 * `tests/e2e/helpers` 가 든 이유: 그 드라이버가 자기 오류 문구를 만들고(`\`${cmd} 실패\``)
 * 스펙이 그것을 기대한다. 앱 문구가 아니라 하네스 문구이므로 앱 소스에는 없는 것이 맞다.
 */
const SOURCE_ROOTS = [
  'apps/desktop/src', 'packages/ui/src', 'packages/i18n/src', 'tests/e2e/helpers',
];

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
  throw new Error('워크스페이스 뿌리를 못 찾았다');
}

function walk(dir: string, ext: readonly string[], out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') walk(full, ext, out);
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

/** `shown('…')` · `$$('…')` · `$('…')` 가 받는 선택자. */
const SELECTOR_CALL = /\b(?:shown|\$\$|\$)\(\s*'([^']+)'/g;
/** 선택자에서 이름 조각만 — 클래스·id·속성값. */
const NAME_IN_SELECTOR = /[.#]([A-Za-z_][\w-]*)|\[[\w-]+\s*=\s*"([^"]+)"\]/g;

/** 화면 문구 기대치. 한글이 든 리터럴만 본다 — 영어는 셀렉터·코드와 섞인다. */
const TEXT_EXPECT = /(?:includes|toContain|===)\s*\(?\s*'([^']*[가-힣][^']*)'/g;

/** 이름이 아니라 태그·의사 클래스라 소스에서 찾을 것이 없는 것. */
const NOT_A_NAME = new Set(['body', 'button', 'li', 'main', 'header', 'nav', 'section', 'span', 'div']);

describe('실제 바이너리 e2e 가 부르는 이름 (D178 · D182)', () => {
  const root = repoRoot();
  const specs = walk(join(root, SPEC_DIR), ['.e2e.ts']);
  const sources = SOURCE_ROOTS.flatMap((r) => walk(join(root, r), ['.ts', '.tsx', '.css', '.html']));
  const haystack = sources.map((f) => readFileSync(f, 'utf8')).join('\n');

  test('스펙과 소스를 둘 다 찾았다', () => {
    expect(specs.length).toBeGreaterThan(4);
    expect(sources.length).toBeGreaterThan(50);
  });

  test('선택자의 클래스·id·속성값이 소스에 있다', () => {
    const missing: string[] = [];
    for (const spec of specs) {
      const text = readFileSync(spec, 'utf8');
      for (const call of text.matchAll(SELECTOR_CALL)) {
        const selector = call[1] as string;
        for (const m of selector.matchAll(NAME_IN_SELECTOR)) {
          const name = (m[1] ?? m[2]) as string;
          if (NOT_A_NAME.has(name)) continue;
          if (!haystack.includes(name)) {
            missing.push(`${spec.slice(root.length + 1)} — '${selector}' 의 '${name}'`);
          }
        }
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  /*
   * 통째로 찾지 않고 **한국어 조각마다** 찾는다. 드라이버가 문구를 템플릿으로 짓는
   * 자리가 있어서다 — `\`${cmd} 실패\`` 는 소스에 `secret_set 실패` 로 있지 않다.
   * 조각 전부가 있어야 통과이므로 낱말 하나가 사라지면 그대로 걸린다: 오전의
   * 「인쇄 시작」은 `인쇄` 에서, 「다시 찍기」는 `찍기` 에서 잡힌다.
   */
  test('기대하는 한국어 문구가 카탈로그나 소스에 있다', () => {
    const missing: string[] = [];
    for (const spec of specs) {
      const text = readFileSync(spec, 'utf8');
      for (const m of text.matchAll(TEXT_EXPECT)) {
        const phrase = m[1] as string;
        if (phrase.length < 2) continue;
        if (haystack.includes(phrase)) continue;
        const gone = phrase
          .split(/[\s·]+/)
          .filter((w) => /[가-힣]/.test(w) && !haystack.includes(w));
        if (gone.length > 0) {
          missing.push(`${spec.slice(root.length + 1)} — '${phrase}' 의 ${gone.join(' · ')}`);
        }
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });
});
