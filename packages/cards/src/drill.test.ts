/**
 * 작은 문제 층의 약속 (D186 ⑧).
 *
 * 가장 중요한 시험이 하나다 — **정답을 사람이 안 적는다.** 문제마다 `reference.py` 가 있고,
 * 이 시험이 케이스의 `stdin` 을 그 참조 풀이에 실제로 먹여 `stdout` 과 대조한다. 손으로
 * 적은 기댓값이 한 칸이라도 섞이면 여기서 빨개진다.
 *
 * 파이썬이 없는 컴퓨터에서는 그 한 갈래만 건너뛴다 — 스키마와 배치 시험은 그대로 돈다.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { DRILL_TOPICS, loadDict, loadDrills } from '@chickadee/dictionary';
import { describe, expect, it } from 'vitest';

import { coverOf, drillsAfterPart0, toDrillItem } from './drill.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const drills = loadDrills();
const dict = loadDict({});

const HAS_PY = spawnSync('python3', ['--version'], { encoding: 'utf8' }).status === 0;

describe('번들에 실린 문제', () => {
  it('스키마를 어긴 파일이 없다', () => {
    expect(drills.problems).toEqual([]);
  });

  it('열둘 이상이고 주제 여섯을 다 덮는다', () => {
    expect(drills.list.length).toBeGreaterThanOrEqual(12);
    expect([...new Set(drills.list.map((d) => d.topic))].sort())
      .toEqual([...DRILL_TOPICS].sort());
  });

  it('주제 순서대로 늘어선다 — 이 순서가 곧 배치 순서다', () => {
    const seen = drills.list.map((d) => DRILL_TOPICS.indexOf(d.topic));
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  it('`needs` 의 개념 id 가 전부 사전에 실재한다', () => {
    for (const d of drills.list) {
      for (const id of d.needs) {
        expect(dict.concepts.has(id), `${d.id} → ${id}`).toBe(true);
      }
    }
  });

  it('지문은 한국어가 정본이고 영어가 병기된다 (D117·D118)', () => {
    for (const d of drills.list) {
      expect(d.statement.ko.length, d.id).toBeGreaterThan(10);
      expect(d.statement.en.length, d.id).toBeGreaterThan(10);
      // 한국어 정본에 한글이 실제로 들어 있다 — 영어를 두 번 적은 것을 잡는다.
      expect(/[가-힣]/u.test(d.statement.ko), d.id).toBe(true);
    }
  });

  it('나온 글이 언어에 안 매인다 — 케이스 출력에 소수점이 없다', () => {
    // 같은 `3.0` 을 파이썬은 `3.0` 으로 자바스크립트는 `3` 으로 찍는다. 실수는 입력과
    // 판단에만 쓰고 출력에는 안 싣는다 (`dictionary/drills/README.md`).
    for (const d of drills.list) {
      for (const c of d.cases) {
        expect(/\d\.\d/u.test(c.stdout), `${d.id}: ${c.stdout}`).toBe(false);
      }
    }
  });
});

describe.runIf(HAS_PY)('정답을 사람이 안 적는다 — 참조 풀이가 낸다', () => {
  it('케이스마다 reference.py 를 돌린 결과가 기록된 stdout 과 같다', () => {
    for (const d of drills.list) {
      const ref = join(ROOT, 'dictionary', 'drills', d.id, 'reference.py');
      // 파일이 실제로 있는지부터 — 없으면 읽기가 던진다.
      expect(readFileSync(ref, 'utf8').length, d.id).toBeGreaterThan(0);
      for (const c of d.cases) {
        const got = spawnSync('python3', [ref], { input: c.stdin, encoding: 'utf8', timeout: 10_000 });
        expect(got.status, `${d.id} ← ${JSON.stringify(c.stdin)}: ${got.stderr}`).toBe(0);
        expect(got.stdout, `${d.id} ← ${JSON.stringify(c.stdin)}`).toBe(c.stdout);
      }
    }
  }, 60_000);
});

describe('0부 뒤에 꽂을 자리', () => {
  const everything = coverOf(
    [...dict.concepts.values()].map((c) => ({
      id: c.id,
      universal: c.universal,
      prereq: c.prereq,
    })),
  );

  it('사전 전체를 덮으면 파이썬 문제가 하나도 안 빠진다', () => {
    const out = drillsAfterPart0({ lang: 'py', covered: everything });
    expect(out.items.length).toBe(drills.list.filter((d) => d.langs.includes('py')).length);
    expect(out.drops).toEqual([]);
  });

  it('아무것도 안 덮으면 하나도 안 내고 **사유가 남는다**', () => {
    const out = drillsAfterPart0({ lang: 'py', covered: new Set() });
    expect(out.items).toEqual([]);
    expect(out.drops.length).toBe(drills.list.length);
    expect(out.drops[0]?.reason).toContain('아직 안 배운 것');
  });

  it('`needs` 가 하나라도 안 덮이면 그 문제는 안 나온다', () => {
    const one = drills.list[0];
    if (one === undefined) throw new Error('문제가 없다');
    const partial = new Set(one.needs.slice(1));
    const out = drillsAfterPart0({ lang: 'py', covered: partial, drills: [one] });
    expect(out.items).toEqual([]);
    expect(out.drops[0]?.drillId).toBe(one.id);
  });

  it('그 언어를 안 받는 문제는 사유를 달고 빠진다', () => {
    const one = { ...drills.list[0]!, langs: ['py' as const] };
    const out = drillsAfterPart0({ lang: 'java', covered: everything, drills: [one] });
    expect(out.items).toEqual([]);
    expect(out.drops[0]?.reason).toContain('java');
  });

  it('덮인 것 안에서는 주제 순서가 유지된다', () => {
    const out = drillsAfterPart0({ lang: 'ts', covered: everything });
    const seen = out.items.map((i) => DRILL_TOPICS.indexOf(i.topic));
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });
});

describe('언어를 입힌 판', () => {
  it('언어마다 다른 껍데기가 깔리고 입력을 읽는 데까지만 준다', () => {
    const one = drills.list[0];
    if (one === undefined) throw new Error('문제가 없다');
    expect(toDrillItem(one, 'py')?.starter).toContain('sys.stdin.read()');
    expect(toDrillItem(one, 'ts')?.starter).toContain("readFileSync(0, 'utf8')");
    expect(toDrillItem(one, 'java')?.starter).toContain('public class Main');
  });

  it('Monaco 가 아는 언어 id 만 낸다', () => {
    const one = drills.list[0];
    if (one === undefined) throw new Error('문제가 없다');
    for (const lang of ['py', 'ts', 'java'] as const) {
      expect(['python', 'typescript', 'java']).toContain(toDrillItem(one, lang)?.grammar);
    }
  });

  it('판 id 는 문제와 언어를 함께 들고 — 같은 문제를 두 언어로 풀 수 있다', () => {
    const one = drills.list[0];
    if (one === undefined) throw new Error('문제가 없다');
    expect(toDrillItem(one, 'py')?.id).toBe(`${one.id}:py`);
    expect(toDrillItem(one, 'java')?.id).toBe(`${one.id}:java`);
  });

  it('그 언어를 안 받는 문제면 `null` 이다', () => {
    const one = { ...drills.list[0]!, langs: ['py' as const] };
    expect(toDrillItem(one, 'java')).toBeNull();
  });
});

describe('0부의 함정을 실제로 밟는다', () => {
  const table: readonly [string, string][] = [
    ['floor-divide', '-7 2'],
    ['big-product', '2147483647 2'],
    ['float-not-exact', '0.1 0.2 0.3'],
    ['sum-to-n', '100000'],
    ['reverse-text', '한글'],
  ];

  for (const [id, needle] of table) {
    it(`${id} 에 그 값이 든 케이스가 있다`, () => {
      const one = drills.byId.get(id);
      expect(one, id).toBeDefined();
      expect(one?.cases.some((c) => c.stdin.includes(needle)), id).toBe(true);
    });
  }
});
