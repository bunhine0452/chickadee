/**
 * 「0장 — 이 언어의 바닥」 (D136 · D137).
 *
 * 「끝이 있다」를 못박는 테스트가 이 파일의 요점이다 — 끝 조건 셋과, 후보를 **자르지
 * 않는다**는 것(D184). 0장이 「과정」으로 자라나려면 이 테스트들을 먼저 고쳐야 하고, 그때
 * D136 을 다시 읽게 된다.
 */
import { loadDict } from '@chickadee/dictionary';
import { describe, expect, test } from 'vitest';

import { prereqDepth, type BestSite, type NewcomerFlag, type RootResult } from './new-rank.js';
import {
  ZERO_CHAPTER_MAX_DEPTH, isDone, rootCleared, shouldOpen, zeroChapterPlates,
  type ZeroChapterInput, type ZeroChapterPlate,
} from './zero-chapter.js';

const site = (unknown: number, siteId = 1): BestSite =>
  ({ siteId, unknown, lineStart: 10, lineEnd: 10 });

function input(
  essential: readonly string[],
  best: Record<string, BestSite | null>,
  prereq: Record<string, string[]> = {},
): ZeroChapterInput {
  return {
    essential,
    bestSiteOf: (id) => best[id] ?? null,
    prereqOf: (id) => prereq[id] ?? [],
  };
}

const layers = (rows: Record<string, number>) => (id: string): number => rows[id] ?? 0;

describe('켜짐 조건', () => {
  test('그 언어 essential 이 전부 0겹이면 연다', () => {
    expect(shouldOpen(['ts/a', 'ts/b'], layers({}))).toBe(true);
  });

  test('하나라도 찍혀 있으면 열지 않는다 — 그 언어가 처음이 아니다', () => {
    expect(shouldOpen(['ts/a', 'ts/b'], layers({ 'ts/b': 1 }))).toBe(false);
  });

  test('essential 이 비면 열지 않는다 — 사전이 없는 언어다', () => {
    expect(shouldOpen([], layers({}))).toBe(false);
  });

  test('묻지 않는다 — 입력에 사용자 응답이 없다', () => {
    // 배치고사 금지(정본 §4 · 방안 E-5)의 회귀 방벽. 인자가 원장 둘뿐이다.
    expect(shouldOpen.length).toBe(2);
  });
});

describe('담기는 판', () => {
  test('내 코드 사용처가 합성보다 먼저 온다', () => {
    const plates = zeroChapterPlates(input(['ts/hard', 'ts/easy'], {
      'ts/hard': site(9), 'ts/easy': site(0),
    }));
    expect(plates.map((p) => p.conceptId)).toEqual(['ts/easy', 'ts/hard']);
    expect(plates[0]?.siteId).toBe(1);
    expect(plates[0]?.previewSiteId).toBeNull();
  });

  test('미지가 많으면 합성 자리가 되고 그 사용처를 예고로 든다 (D137)', () => {
    const [plate] = zeroChapterPlates(input(['ts/hard'], { 'ts/hard': site(9, 42) }));
    expect(plate?.siteId).toBeNull();
    expect(plate?.previewSiteId).toBe(42);
  });

  test('리포에 사용처가 없는 개념은 넣지 않는다 — 예고할 자리가 없다 (D137)', () => {
    const plates = zeroChapterPlates(input(['ts/absent', 'ts/here'], {
      'ts/absent': null, 'ts/here': site(0),
    }));
    expect(plates.map((p) => p.conceptId)).toEqual(['ts/here']);
  });

  test('합성 판은 예고 사용처를 반드시 갖는다', () => {
    const plates = zeroChapterPlates(input(['a', 'b', 'c'].map((s) => `ts/${s}`), {
      'ts/a': site(9), 'ts/b': site(0), 'ts/c': null,
    }));
    for (const plate of plates) {
      if (plate.siteId === null) expect(plate.previewSiteId).not.toBeNull();
    }
  });

  // D147 로 상한이 1 → 2 가 됐다. 여전히 상한은 있다 — 바닥이지 경로가 아니다.
  test('선행 깊이 3 이상은 빠진다 — 바닥이지 경로가 아니다', () => {
    const plates = zeroChapterPlates(input(['ts/root', 'ts/mid', 'ts/top', 'ts/far'], {
      'ts/root': site(0), 'ts/mid': site(0), 'ts/top': site(0), 'ts/far': site(0),
    }, { 'ts/mid': ['ts/root'], 'ts/top': ['ts/mid'], 'ts/far': ['ts/top'] }));
    expect(plates.map((p) => p.conceptId)).toEqual(['ts/root', 'ts/mid', 'ts/top']);
  });

  test('뿌리가 먼저, 같은 깊이면 미지가 적은 것', () => {
    const plates = zeroChapterPlates(input(['ts/up', 'ts/b', 'ts/a'], {
      'ts/up': site(0), 'ts/a': site(2), 'ts/b': site(1),
    }, { 'ts/up': ['ts/a'] }));
    expect(plates.map((p) => p.conceptId)).toEqual(['ts/b', 'ts/a', 'ts/up']);
  });

  test('후보를 자르지 않는다 — 60개면 60장이다 (D184)', () => {
    const ids = Array.from({ length: 60 }, (_, i) => `ts/c${String(i).padStart(2, '0')}`);
    const best = Object.fromEntries(ids.map((id) => [id, site(0)]));
    expect(zeroChapterPlates(input(ids, best))).toHaveLength(60);
  });
});

describe('끝나는 조건', () => {
  const plates: ZeroChapterPlate[] = [
    { conceptId: 'ts/a', siteId: 1, previewSiteId: null, depth: 0 },
    { conceptId: 'ts/b', siteId: 2, previewSiteId: null, depth: 0 },
  ];
  const done = (over: Partial<Parameters<typeof isDone>[0]> = {}): boolean => isDone({
    plates, layerOf: layers({}), newcomer: 'suspect' as NewcomerFlag, cleared: false,
    disabled: false, declaredNewcomer: false, ...over,
  });

  test('담긴 개념이 모두 1겹 이상이면 끝', () => {
    expect(done({ layerOf: layers({ 'ts/a': 1, 'ts/b': 4 }) })).toBe(true);
  });

  test('하나라도 0겹이면 아직', () => {
    expect(done({ layerOf: layers({ 'ts/a': 1 }) })).toBe(false);
  });

  test('초보가 아니고 뿌리를 통과했으면 끝 — 0장을 계속 들고 있지 않는다', () => {
    expect(done({ newcomer: 'none', cleared: true })).toBe(true);
  });

  test('뿌리를 통과해도 초보 플래그가 서 있으면 아직', () => {
    expect(done({ newcomer: 'confirmed', cleared: true })).toBe(false);
  });

  // D147 — 늘린 상한이 무의미해지지 않게 하는 자리다. 스스로 초보라고 답했으면 뿌리를
  // 운으로 통과해도 0장은 안 닫힌다. 닫는 길은 ①(전부 1겹)과 ③(설정에서 끔)뿐이다.
  test('스스로 초보라고 답했으면 뿌리를 통과해도 아직', () => {
    expect(done({ declaredNewcomer: true, newcomer: 'none', cleared: true })).toBe(false);
  });

  test('스스로 초보라고 답해도 전부 1겹이면 끝', () => {
    expect(done({
      declaredNewcomer: true, layerOf: layers({ 'ts/a': 1, 'ts/b': 1 }),
    })).toBe(true);
  });

  test('스스로 초보라고 답해도 설정에서 끄면 끝', () => {
    expect(done({ declaredNewcomer: true, disabled: true })).toBe(true);
  });

  test('설정에서 끄면 끝', () => {
    expect(done({ disabled: true })).toBe(true);
  });

  test('판이 하나도 없으면 끝나지 않는다 — 빈 대지를 완료로 찍지 않는다', () => {
    expect(done({ plates: [] })).toBe(false);
  });
});

describe('뿌리 통과', () => {
  const result = (ok: boolean, dunno = false): RootResult => ({ conceptId: 'ts/a', ok, dunno });

  test('4장 중 3장을 맞히면 통과', () => {
    expect(rootCleared([result(true), result(true), result(true), result(false)])).toBe(true);
  });

  test('3장뿐이면 아직 — 표본이 모자란다', () => {
    expect(rootCleared([result(true), result(true), result(true)])).toBe(false);
  });

  test('맞혔어도 「모르겠어요」를 눌렀으면 세지 않는다', () => {
    expect(rootCleared([result(true, true), result(true), result(true), result(true)])).toBe(true);
    expect(rootCleared([result(true, true), result(true, true), result(true), result(true)]))
      .toBe(false);
  });
});

describe('상한이 없다 — 후보가 전부 든다 (D184)', () => {
  /**
   * D156 의 시험은 「후보가 상한 24 를 넘으면 알파벳순 동점 키가 프롤로그를 정한다」를 막았다.
   * 상한을 폐지하면서(D184) 그 전제가 사라졌다 — 자르지 않으니 무엇을 자를지 이름이 정할 일이
   * 없다. 대신 실제 사전의 크기로 「전부 든다」를 못박는다: 언어마다 essential ∧ 깊이 ≤ 2 인
   * 개념 수와 0장 판 수가 같아야 한다. 누가 상한을 다시 넣으면 여기서 걸린다.
   *
   * 판 수 자체는 세되 강제하지 않는다(D181 이 Rust 줄 수에 한 것과 같다). 첫 기능 챕터까지의
   * 날수는 상수가 아니라 커리큘럼 문서(`docs/curriculum/<lang>.md` §1.5)가 정한다.
   */
  test('언어마다 0장 판 수 = essential ∧ 깊이 ≤ 2 인 개념 수', () => {
    const dict = loadDict();
    const mismatch: string[] = [];
    for (const [lang, meta] of dict.langs) {
      const essential = meta.essential;
      if (essential.length === 0) continue;
      const prereqOf = (id: string): string[] => dict.concepts.get(id)?.prereq ?? [];
      const depth = prereqDepth(essential, prereqOf);
      const candidates = essential.filter((id) => (depth.get(id) ?? 0) <= ZERO_CHAPTER_MAX_DEPTH);
      const plates = zeroChapterPlates({ essential, bestSiteOf: () => site(0), prereqOf });
      if (plates.length !== candidates.length) {
        mismatch.push(`${lang}: ${plates.length} 장 / 후보 ${candidates.length}`);
      }
    }
    expect(mismatch).toEqual([]);
  });
});
