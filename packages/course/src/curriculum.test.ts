/**
 * 정식 코스 3부 (D177). **진짜 번들 사전에 대고 돈다** — 이 기능의 주장이 「부 배치가
 * `_lang.yaml` 과 어긋나지 않는다」이므로, 모형으로 재면 그 주장을 검사하지 않는 것이 된다.
 */
import { loadDict } from '@chickadee/dictionary';
import type { BestSite, Chapter, RootResult } from '@chickadee/concepts';
import { describe, expect, test } from 'vitest';

import {
  COURSE_GATE_MAX, DRILL_TOOLCHAIN_KEY, GATE_PER_CHAPTER, JAVA_PARTS, STAGE_ESCAPE_GATE_LAYER,
  STAGE_NEVER_FOLDED, buildCurriculum, chapterEscape, chapterGates, courseOutline, drillEntry,
  foldsPart1, foldsStage,
  type CurriculumInput, type CurriculumPart, type DrillsEntry, type DrillsInput,
  type StageFoldInput,
} from './curriculum.js';

/** 전이(D4)가 첫 노출에 주는 겹 — `transferFrom` 이 3겹 이상의 기증자를 찾아 1겹에서 시작시킨다. */
const TRANSFER_START_LAYER = 1;

const dict = loadDict({
  manifests: { 'build.gradle': "implementation 'org.springframework.boot:spring-boot-starter-web'" },
});

const site = (siteId: number, unknown = 0): BestSite => ({ siteId, unknown, lineStart: 1, lineEnd: 1 });

function input(over: Partial<CurriculumInput> = {}): CurriculumInput {
  return {
    parts: JAVA_PARTS,
    prereqOf: (id) => dict.concepts.get(id)?.prereq ?? [],
    difficultyOf: (id) => dict.concepts.get(id)?.difficulty ?? 3,
    bestSiteOf: () => null,
    absenceOf: () => 'idiom',
    maxUnknown: 3,
    ...over,
  };
}

describe('부 배치는 사전과 어긋나지 않는다', () => {
  test('0·1·2부를 합치면 java essential 전량이고 순서도 같다', () => {
    const essential = dict.langs.get('java')?.essential ?? [];
    const assigned = [
      ...JAVA_PARTS[0]?.concepts ?? [],
      ...JAVA_PARTS[1]?.concepts ?? [],
      ...JAVA_PARTS[2]?.concepts ?? [],
    ];
    expect(assigned).toEqual([...essential]);
  });

  test('3부는 spring/ 사전 전량이다 — 하나라도 빠지면 못 가르치는 개념이 생긴다', () => {
    const spring = [...dict.concepts.keys()].filter((id) => id.startsWith('spring/')).sort();
    expect([...(JAVA_PARTS[3]?.concepts ?? [])].sort()).toEqual(spring);
  });

  test('부 배치의 개념은 전부 사전에 있다', () => {
    for (const part of JAVA_PARTS) {
      for (const id of part.concepts) expect(dict.concepts.has(id), id).toBe(true);
    }
  });
});

describe('순서는 위상 정렬이다 (규칙 ③)', () => {
  test('부 안에서 선행이 먼저 온다', () => {
    const parts = buildCurriculum(input());
    for (const part of parts) {
      const at = new Map(part.plates.map((p, i) => [p.conceptId, i]));
      for (const plate of part.plates) {
        for (const pre of dict.concepts.get(plate.conceptId)?.prereq ?? []) {
          const before = at.get(pre);
          if (before === undefined) continue; // 다른 부·다른 네임스페이스의 선행
          expect(before, `${pre} → ${plate.conceptId}`).toBeLessThan(at.get(plate.conceptId) as number);
        }
      }
    }
  });

  test('3부만 「내 코드 먼저」로 앞당긴다 (규칙 ②)', () => {
    const mine = new Set(['spring/persistence-mapping', 'java/annotation']);
    const parts = buildCurriculum(input({
      bestSiteOf: (id) => (mine.has(id) ? site(7) : null),
    }));
    const third = parts.find((p) => p.part === 3) as CurriculumPart;
    expect(third.plates[0]?.conceptId).toBe('spring/persistence-mapping');
    // 2부는 안 당긴다 — `java/annotation` 은 위상 정렬대로 맨 뒤 언저리에 남는다.
    const second = parts.find((p) => p.part === 2) as CurriculumPart;
    expect(second.plates[0]?.conceptId).not.toBe('java/annotation');
  });
});

describe('개념마다 자리를 짚는다 (규칙 ①)', () => {
  test('자리가 없으면 사유가 붙는다 — 「네 코드엔 없다」', () => {
    const parts = buildCurriculum(input({ absenceOf: () => 'scale' }));
    const plates = parts.flatMap((p) => p.plates);
    expect(plates.length).toBeGreaterThan(0);
    for (const plate of plates) {
      expect(plate.siteId).toBeNull();
      expect(plate.absent).toBe('scale');
    }
  });

  test('사유를 못 대면 판이 안 선다 — 사유 없이 열리는 문은 없다', () => {
    const parts = buildCurriculum(input({ absenceOf: () => null }));
    expect(parts.flatMap((p) => p.plates)).toHaveLength(0);
  });

  test('자리가 있는데 미지가 많으면 합성 + 예고다 (D137 은 그대로다)', () => {
    const parts = buildCurriculum(input({
      bestSiteOf: (id) => (id === 'java/array' ? site(11, 9) : null),
      absenceOf: () => null,
    }));
    const plate = parts.flatMap((p) => p.plates).find((p) => p.conceptId === 'java/array');
    expect(plate?.siteId).toBeNull();
    expect(plate?.previewSiteId).toBe(11);
    expect(plate?.absent).toBeNull();
  });

  test('자리가 있고 미지가 적으면 내 코드가 본문이다', () => {
    const parts = buildCurriculum(input({
      bestSiteOf: (id) => (id === 'java/array' ? site(11, 0) : null),
      absenceOf: () => null,
    }));
    const plate = parts.flatMap((p) => p.plates).find((p) => p.conceptId === 'java/array');
    expect(plate?.siteId).toBe(11);
    expect(plate?.previewSiteId).toBeNull();
  });
});

describe('아는 것은 건너뛴다 — 배치고사는 없다', () => {
  // 접는 대상은 **1부**다 — 0부는 다른 언어의 겹으로 안 채워진다 (java.md §1.5.2).
  const part1 = JAVA_PARTS[1]?.concepts ?? [];

  test('1부가 전부 1겹 이상이면 접는다', () => {
    expect(foldsPart1({ part1, layerOf: () => 1, declaredNewcomer: false })).toBe(true);
  });

  test('한 개념이라도 0겹이면 안 접는다', () => {
    const layerOf = (id: string): number => (id === 'java/array' ? 0 : 2);
    expect(foldsPart1({ part1, layerOf, declaredNewcomer: false })).toBe(false);
  });

  test('스스로 처음이라고 답했으면 전이가 채운 겹으로도 안 접는다 (D147)', () => {
    expect(foldsPart1({ part1, layerOf: () => 4, declaredNewcomer: true })).toBe(false);
  });

  test('전이가 걸리는 자리가 실제로 있다 — universal 이 붙은 1부 개념 (D4)', () => {
    const transferable = part1.filter((id) => dict.concepts.get(id)?.universal !== null);
    expect(transferable.length).toBeGreaterThan(0);
  });
});

describe('어휘 관문은 부에 흡수된다 (course.md §3.2)', () => {
  const chapter = (order: number, name: string, files: string[]): Chapter =>
    ({ name, files, entries: [], order, opens: files } as unknown as Chapter);

  test('부가 가르친 개념은 관문이 다시 안 센다', () => {
    const gates = chapterGates({
      chapters: [chapter(1, 'auth', ['a.java'])],
      conceptsOf: () => ['java/annotation', 'java/import', 'proto/jwt'],
      taught: new Set(['java/annotation', 'java/import']),
    });
    expect(gates[0]?.plates).toEqual(['proto/jwt']);
  });

  test('챕터당 상한 6 판', () => {
    const many = Array.from({ length: 20 }, (_, i) => `x/c${i}`);
    const gates = chapterGates({
      chapters: [chapter(1, 'auth', [])],
      conceptsOf: () => many,
      taught: new Set(),
    });
    expect(gates[0]?.plates).toHaveLength(GATE_PER_CHAPTER);
  });

  test('코스 전체 상한 40 판 — 이것이 튜토리얼 방벽이다', () => {
    const chapters = Array.from({ length: 12 }, (_, i) => chapter(i + 1, `c${i}`, []));
    const gates = chapterGates({
      chapters,
      conceptsOf: (c) => Array.from({ length: 6 }, (_, i) => `x/${c.name}-${i}`),
      taught: new Set(),
    });
    expect(gates.reduce((n, g) => n + g.plates.length, 0)).toBe(COURSE_GATE_MAX);
    expect(COURSE_GATE_MAX).toBe(40);
  });

  test('앞 챕터가 연 어휘는 뒤 챕터가 다시 안 센다', () => {
    const gates = chapterGates({
      chapters: [chapter(1, 'auth', []), chapter(2, 'image', [])],
      conceptsOf: () => ['java/annotation'],
      taught: new Set(),
    });
    expect(gates[0]?.plates).toEqual(['java/annotation']);
    expect(gates[1]?.plates).toEqual([]);
  });
});

describe('목차 — 1부 → 3부 → 기능 챕터', () => {
  const chapters = [
    { name: 'auth', files: ['a', 'b'], order: 1, opens: ['a', 'b'] },
    { name: 'image', files: ['c'], order: 2, opens: ['c'] },
  ] as unknown as Chapter[];

  test('부가 먼저 서고 그다음이 기능 챕터다', () => {
    const parts = buildCurriculum(input());
    const rows = courseOutline({
      parts, gates: [], chapters, foldPart1: false,
    });
    expect(rows.map((r) => r.kind)).toEqual(['part', 'part', 'part', 'part', 'chapter', 'chapter']);
    expect(rows.at(-2)).toMatchObject({ kind: 'chapter', chapter: 'auth' });
  });

  test('1부를 접으면 목차에서 빠진다 — 0부는 남는다', () => {
    const parts = buildCurriculum(input());
    const rows = courseOutline({ parts, gates: [], chapters, foldPart1: true });
    const shown = rows.filter((r) => r.kind === 'part');
    expect(shown).toHaveLength(3);
    expect(shown.map((r) => (r.kind === 'part' ? r.part : -1))).toEqual([0, 2, 3]);
  });

  test('부마다 「내 코드」와 「없다」의 수가 목차에 뜬다', () => {
    const parts = buildCurriculum(input({
      bestSiteOf: (id) => (id === 'java/import' ? site(3) : null),
      absenceOf: () => 'idiom',
    }));
    const rows = courseOutline({ parts, gates: [], chapters, foldPart1: false });
    const first = rows.find((r) => r.kind === 'part' && r.part === 1);
    expect(first).toMatchObject({ mine: 1 });
    expect((first as { absent: number }).absent).toBeGreaterThan(0);
  });
});

describe('단별 탈출 — 74일은 상한이지 길이가 아니다 (D187 ⑭)', () => {
  const ok = (conceptId: string): RootResult => ({ conceptId, ok: true, dunno: false });
  const miss = (conceptId: string): RootResult => ({ conceptId, ok: false, dunno: false });
  const dunno = (conceptId: string): RootResult => ({ conceptId, ok: false, dunno: true });

  const stageInput = (over: Partial<StageFoldInput> = {}): StageFoldInput => ({
    stage: 1,
    results: [ok('java/import'), ok('java/annotation')],
    gateLayers: [2, 3],
    declaredNewcomer: false,
    ...over,
  });

  test('첫 두 판을 연속으로 맞히고 관문이 2겹 이상이면 접는다', () => {
    expect(foldsStage(stageInput())).toBe(true);
  });

  test('첫 두 판 중 하나라도 틀리면 안 접는다', () => {
    expect(foldsStage(stageInput({ results: [ok('a'), miss('b'), ok('c')] }))).toBe(false);
  });

  test('「모르겠어요」는 맞힌 것이 아니다', () => {
    expect(foldsStage(stageInput({ results: [ok('a'), dunno('b')] }))).toBe(false);
  });

  test('셋째 판을 맞혀도 첫 둘이 아니면 못 산다 — 「연속」이 첫 두 판이다', () => {
    expect(foldsStage(stageInput({ results: [miss('a'), ok('b'), ok('c')] }))).toBe(false);
  });

  test('아직 두 판을 안 풀었으면 안 접는다', () => {
    expect(foldsStage(stageInput({ results: [ok('a')] }))).toBe(false);
    expect(foldsStage(stageInput({ results: [] }))).toBe(false);
  });

  test('관문이 1겹이면 안 접는다 — 전이(D4)가 채운 겹으로는 못 빠져나간다', () => {
    expect(foldsStage(stageInput({ gateLayers: [2, 1] }))).toBe(false);
    expect(STAGE_ESCAPE_GATE_LAYER).toBeGreaterThan(TRANSFER_START_LAYER);
  });

  test('관문이 비면 어휘 조건은 저절로 선다 — 부가 이미 다 가르친 챕터다', () => {
    expect(foldsStage(stageInput({ gateLayers: [] }))).toBe(true);
  });

  test('5단(재구현)은 안 접는다 — 「끝났다」의 유일한 증거다 (course.md §5.2)', () => {
    expect(foldsStage(stageInput({ stage: 5 }))).toBe(false);
    expect(STAGE_NEVER_FOLDED).toBe(5);
  });

  test('스스로 처음이라고 답했으면 안 접는다 (D147 — foldsPart1·isDone 과 같은 문)', () => {
    expect(foldsStage(stageInput({ declaredNewcomer: true }))).toBe(false);
  });

  test('foldsPart1 과 겹치지 않는다 — 저쪽은 겹만, 이쪽은 방금 낸 답을 본다', () => {
    // 1부 전체가 1겹이면 `foldsPart1` 은 접는다. 같은 사람이 이 단의 첫 두 판을 틀리면
    // `foldsStage` 는 안 접는다 — 두 함수가 같은 입력에서 다른 답을 내는 것이 요점이다.
    const part1 = JAVA_PARTS[1]?.concepts ?? [];
    expect(foldsPart1({ part1, layerOf: () => 1, declaredNewcomer: false })).toBe(true);
    expect(foldsStage(stageInput({ results: [miss('a'), miss('b')], gateLayers: [1, 1] }))).toBe(false);
  });

  test('아는 사람의 챕터 하나 — 다섯 단 중 넷이 접히고 5단만 남는다', () => {
    const known = { results: [ok('a'), ok('b')], gateLayers: [2, 2] };
    const escape = chapterEscape({
      chapter: 'auth',
      stages: [known, known, known, known, known],
      declaredNewcomer: false,
    });
    expect(escape.folded).toEqual([1, 2, 3, 4]);
    expect(escape.stages).toEqual([5]);
  });

  test('처음인 사람의 같은 챕터 — 다섯 단이 그대로 선다', () => {
    const fresh = { results: [], gateLayers: [0, 0] };
    const escape = chapterEscape({
      chapter: 'auth',
      stages: [fresh, fresh, fresh, fresh, fresh],
      declaredNewcomer: false,
    });
    expect(escape.folded).toEqual([]);
    expect(escape.stages).toEqual([1, 2, 3, 4, 5]);
  });

  test('74일 중 며칠이 남나 — course.md §5.3 의 수치가 이 규칙에서 나온다', () => {
    // `course.md` §6 의 챕터 여덟(막간·부록·졸업 제외)에 걸린 일수와 그 단별 분(§5.1).
    const chapterDays = [5, 4, 3, 5, 5, 4, 5, 7];
    const stageMin = [4, 8, 2, 16, 16]; // 1 읽기 · 2 추적 · 3 예측 · 4 수정 · 5 재구현
    const total = stageMin.reduce((a, b) => a + b, 0);
    const known = { results: [ok('a'), ok('b')], gateLayers: [2, 2] };
    const escape = chapterEscape({
      chapter: 'x', stages: [known, known, known, known, known], declaredNewcomer: false,
    });
    const left = escape.stages.reduce((m, s) => m + (stageMin[s - 1] ?? 0), 0);
    const kept = left / total;
    const days = chapterDays.reduce((n, d) => n + Math.max(1, Math.round(d * kept)), 0);
    expect(chapterDays.reduce((a, b) => a + b, 0)).toBe(38);
    expect(total).toBe(46);
    expect(kept).toBeCloseTo(16 / 46, 3);
    expect(days).toBe(13); // 챕터 여덟 38일 → 13일. 막간·부록·졸업은 안 접힌다
  });
});

describe('0부 뒤의 작은 문제 층 (D186 ⑧ · D187 ⑧)', () => {
  const part0 = (JAVA_PARTS[0]?.concepts ?? [])
    .map((id) => dict.concepts.get(id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)
    .map((c) => ({ id: c.id, universal: c.universal, prereq: c.prereq }));

  const entry = (over: Partial<DrillsInput> = {}): DrillsEntry =>
    drillEntry({ lang: 'java', part0, runnerReady: true, ...over });

  const chapters = [{ name: 'auth', files: ['a'], order: 1, opens: ['a'] }] as unknown as Chapter[];

  test('자바 0부 열일곱이 문제 열넷 중 여섯을 연다 — 나머지 여덟은 사유가 남는다', () => {
    expect(part0).toHaveLength(17);
    const e = entry();
    expect(e.plates).toBe(6);
    expect(e.drops).toHaveLength(8);
    expect(e.plates + e.drops.length).toBe(14);
  });

  test('0부 바로 뒤에 서고 1부 앞이다 — 반복·배열을 배우기 전에 그것이 필요한 문제를 안 낸다', () => {
    const rows = courseOutline({
      parts: buildCurriculum(input()), gates: [], chapters, foldPart1: false, drills: entry(),
    });
    expect(rows.map((r) => (r.kind === 'part' ? `part${r.part}` : r.kind)))
      .toEqual(['part0', 'drills', 'part1', 'part2', 'part3', 'chapter']);
  });

  test('1부를 접어도 자리는 0부 뒤 그대로다 — 이 층이 딛는 것은 1부가 아니라 0부다', () => {
    const rows = courseOutline({
      parts: buildCurriculum(input()), gates: [], chapters, foldPart1: true, drills: entry(),
    });
    expect(rows.map((r) => (r.kind === 'part' ? `part${r.part}` : r.kind)))
      .toEqual(['part0', 'drills', 'part2', 'part3', 'chapter']);
  });

  test('needs 가 하나라도 0부 밖이면 안 낸다 — 안 배운 값을 물으면 재는 것이 눈치다', () => {
    const dropped = new Set(entry().drops.map((d) => d.drillId));
    // 반복·배열·조건은 1부의 것이라 0부 뒤에서 아직 안 선다.
    for (const id of ['leap-year', 'sign-of', 'count-down', 'sum-to-n', 'max-and-min', 'median-of-odd', 'count-char']) {
      expect(dropped.has(id), id).toBe(true);
    }
    // `echo-line` 은 io 인데도 떨어진다 — `common/function-call` 이 0부에 없다.
    expect(dropped.has('echo-line')).toBe(true);
  });

  test('선 여섯은 값과 식만으로 풀린다 — 0부가 실제로 가르친 것이다', () => {
    const e = entry();
    expect(e.plates).toBe(6);
    // 자리는 여섯이고 전부 `arithmetic`·`io`·`text` 다. 순서는 `DRILL_TOPICS` 가 정한다.
    expect(e.drops.every((d) => d.reason.length > 0)).toBe(true);
  });

  test('안 낸 것은 조용히 사라지지 않는다 — drops 의 사유가 목차에 실린다 (D186 ④)', () => {
    const rows = courseOutline({
      parts: buildCurriculum(input()), gates: [], chapters, foldPart1: false, drills: entry(),
    });
    const row = rows.find((r) => r.kind === 'drills');
    expect(row).toBeDefined();
    expect((row as DrillsEntry).drops).toHaveLength(8);
    for (const d of (row as DrillsEntry).drops) {
      expect(d.drillId.length).toBeGreaterThan(0);
      expect(d.reason.length).toBeGreaterThan(0);
    }
  });

  test('러너가 없으면 채점만 빠지고 줄은 그대로 선다 (D186 ④)', () => {
    const e = entry({ runnerReady: false });
    expect(e.ungraded).toBe(true);
    expect(e.reasonKey).toBe('run.reason.toolchainMissingJava');
    // **숨지 않는다** — 판 수가 그대로다.
    expect(e.plates).toBe(6);
    const rows = courseOutline({
      parts: buildCurriculum(input()), gates: [], chapters, foldPart1: false, drills: e,
    });
    expect(rows.some((r) => r.kind === 'drills')).toBe(true);
  });

  test('러너가 켜지면 사유가 없다', () => {
    const e = entry({ runnerReady: true });
    expect(e.ungraded).toBe(false);
    expect(e.reasonKey).toBeNull();
  });

  test('언어마다 다른 문장이다 — 「러너가 없다」로 뭉치면 무엇이 없는지가 사라진다', () => {
    expect(new Set(Object.values(DRILL_TOOLCHAIN_KEY)).size).toBe(3);
    expect(DRILL_TOOLCHAIN_KEY.py).toBe('run.reason.toolchainMissingPy');
    expect(DRILL_TOOLCHAIN_KEY.ts).toBe('run.reason.toolchainMissingTs');
  });

  test('층을 안 넘기면 목차가 예전 그대로다 — 이 줄은 더해진 것이지 바뀐 것이 아니다', () => {
    const rows = courseOutline({
      parts: buildCurriculum(input()), gates: [], chapters, foldPart1: false,
    });
    expect(rows.some((r) => r.kind === 'drills')).toBe(false);
  });

  test('연습 층은 부가 아니다 — JAVA_PARTS 는 0·1·2·3 그대로다 (D187 ⑧: 트랙 없음)', () => {
    expect(JAVA_PARTS.map((p) => p.part)).toEqual([0, 1, 2, 3]);
    expect(entry().kind).toBe('drills');
  });
});
