/**
 * 정식 코스 3부 (D177). **진짜 번들 사전에 대고 돈다** — 이 기능의 주장이 「부 배치가
 * `_lang.yaml` 과 어긋나지 않는다」이므로, 모형으로 재면 그 주장을 검사하지 않는 것이 된다.
 */
import { loadDict } from '@chickadee/dictionary';
import type { BestSite, Chapter } from '@chickadee/concepts';
import { describe, expect, test } from 'vitest';

import {
  COURSE_GATE_MAX, GATE_PER_CHAPTER, JAVA_PARTS, buildCurriculum, chapterGates, courseOutline,
  foldsPart1, type CurriculumInput, type CurriculumPart,
} from './curriculum.js';

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
