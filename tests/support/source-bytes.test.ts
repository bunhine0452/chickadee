/**
 * 소스에 **날 제어문자**를 두지 않는다.
 *
 * 왜 테스트까지 있나: `packages/grading/src/t1-appeal.ts` 안에 키 구분자로 쓴 NUL 바이트가
 * 한 개 들어가 있었고, 그것 하나 때문에 `file` 이 그 파일을 `data`(바이너리)로 판정해
 * **`grep` 이 파일 전체를 건너뛰었다.** 코드는 정상 동작했고 테스트·타입체크·빌드가 전부
 * 초록이라 아무도 몰랐다. 실제로 무엇이 깨져 있었냐면 — 코드 검색 전량, `docs/REVIEW.md`
 * 「검증 방법」의 폐기 이름 grep(그 파일만 늘 통과했다), 그리고 그 파일을 읽고 만든 패치
 * 초안이 NUL 을 **공백으로** 적어 왔다(도구가 그렇게 보여 줬다). 그대로 붙였으면 모든
 * `patternKey` 값이 조용히 달라졌을 것이다.
 *
 * 같은 관용구를 쓰는 자리가 셋 더 있었고 넷 다 `\u0000` 이스케이프로 바꿨다 —
 * **동작은 한 글자도 안 바뀐다.** 이 테스트는 그것이 다시 들어오는 것을 막는다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

/** 훑지 않는 곳. 생성물·의존성·바이너리 픽스처는 볼 것이 아니다. */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'target', 'dist', 'fixtures', '.oculpm', 'coverage',
  // `.seed` 는 `pnpm test:seed` 가 만드는 SQLite 파일이 사는 곳이다. 소스가 아니고,
  // 게다가 쓰는 중에는 `-journal` 이 나타났다 사라져 `statSync` 가 ENOENT 로 터진다.
  'test-results', 'playwright-report', '.claude', '.seed',
]);

/** 사람이 쓰는 텍스트 소스만. */
const EXTS = [
  '.ts', '.tsx', '.rs', '.sql', '.yaml', '.yml', '.scm', '.md', '.css', '.json',
  '.mjs', '.cjs', '.js', '.html', '.sh', '.toml',
];

/**
 * 허용하는 것은 탭·줄바꿈·캐리지리턴뿐이다. NUL 은 `grep`·`file` 이 파일을 바이너리로
 * 보게 만들고, 나머지 C0 제어문자는 편집기마다 다르게 보여 diff 를 못 읽게 한다.
 */
const isControl = (b: number): boolean => (b < 0x09 || (b > 0x0d && b < 0x20) || b === 0x7f);

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const at = join(dir, name);
    if (statSync(at).isDirectory()) sources(at, out);
    else if (EXTS.some((e) => name.endsWith(e))) out.push(at);
  }
  return out;
}

describe('소스 바이트', () => {
  test('날 제어문자가 없다 — 있으면 grep 이 그 파일을 통째로 건너뛴다', () => {
    const bad: string[] = [];
    for (const path of sources(process.cwd())) {
      const raw = readFileSync(path);
      for (const [i, b] of raw.entries()) {
        if (!isControl(b)) continue;
        bad.push(`${path}:byte ${i} = 0x${b.toString(16).padStart(2, '0')}`);
        break;
      }
    }
    // 키 구분자가 필요하면 `\u0000` 이스케이프를 쓴다 — 같은 문자열이고 파일은 텍스트로 남는다.
    expect(bad).toEqual([]);
  });
});
