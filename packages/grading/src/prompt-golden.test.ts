/**
 * 4단 프롬프트 골든 (06 §3.3-4 · D8 · 04 §2.4).
 *
 * 06 §3.3-4 가 요구하는 시험이 이것이다 — 「`buildPrompt` 골든 — 9줄 초과 없음,
 * `/`·`\` 포함 경로 문자열·리포명 없음」. 케이스는 `__golden__/prompt/*.json` 이고
 * `golden.test.ts`(T0) 와 같은 배치다: 파일 하나가 케이스 하나, 각 케이스가 문서의
 * 규칙을 `rule` 로 참조한다.
 *
 * 두 겹으로 본다 — `golden-t1.test.ts` 와 같다:
 *
 * - `expect.header` · `expect.fenceCount` · `absent` — **문서의 그 문장**을 손으로 옮긴 것.
 *   문서가 정본이므로 생성하지 않는다. 이 칸이 깨지면 규칙이 깨진 것이다.
 * - `expect.prompt` — 프롬프트 전문의 회귀 스냅샷. `UPDATE_GOLDEN=1` 로 다시 쓰고
 *   diff 를 눈으로 본다. 이 칸이 깨지면 무엇이 달라졌는지 diff 한 줄로 보인다.
 *
 * 커밋 메시지·작성자·리포명은 `buildPrompt` 가 **인자로도 받지 않는다**. 그래도 재는
 * 이유는 인자가 늘어나는 날 이 테스트가 먼저 빨개지게 하기 위해서다 — 06 §3.3 은
 * 「지금 안 샌다」가 아니라 「앞으로도 안 샌다」를 요구한다.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import { buildPrompt, MAX_PROMPT_LINES, promptCodeLines, type ConceptRef } from './ladder.js';
import type { T0Card } from './t0.js';

interface PromptCase {
  name: string;
  /** 06 · 04 문서의 규칙 문장. 케이스가 왜 있는지가 여기 적힌다. */
  rule: string;
  card: T0Card;
  concept: ConceptRef;
  sel: number | null;
  stuck: string;
  /** 프롬프트 어디에도 없어야 하는 글자 — 리포명·커밋 메시지·작성자 (06 §3.3-2). */
  absent: string[];
  expect: { header: string; fenceCount: number; prompt: string[] };
}

const DIR = new URL('./__golden__/prompt/', import.meta.url).pathname;
const entries = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((file) => ({ file, one: JSON.parse(readFileSync(join(DIR, file), 'utf8')) as PromptCase }));
const UPDATE = process.env['UPDATE_GOLDEN'] === '1';

/** 04 §2.4 의 첫 줄 규약. base name 은 무엇이든 될 수 있지만 행 번호는 숫자다. */
const HEADER = /^파일 (.+) (\d+)행 근처입니다\.$/;
/** 06 §3.3-4 — 경로 구분자. 펜스 **밖**에는 하나도 없어야 한다. */
const SEPARATOR = /[/\\]/;

/** `buildPrompt` 가 펜스 앞에 두는 줄 수(헤더·빈 줄·여는 ```)와 뒤에 두는 줄 수. */
const BEFORE = 3;
const AFTER = 7;

/**
 * 프롬프트를 「펜스 안」과 「펜스 밖」으로 가른다.
 *
 * 정규식으로 백틱 세 개를 찾지 않는 이유: 코드 자체가 백틱 세 개를 담을 수 있고 그러면
 * 자르는 자리가 밀린다. 펜스에 들어가는 줄 수는 `promptCodeLines` 가 정하므로 그 수만큼
 * 세어 자른다 — 코드 내용이 무엇이든 자르는 자리가 흔들리지 않는다.
 */
function cut(out: string, card: T0Card): { fence: string[]; outside: string; lines: string[] } {
  const lines = out.split('\n');
  const n = promptCodeLines(card).length;
  return {
    fence: lines.slice(BEFORE, BEFORE + n),
    outside: [...lines.slice(0, BEFORE), ...lines.slice(BEFORE + n)].join('\n'),
    lines,
  };
}

/** 경로에서 디렉터리 조각만. base name 은 D8 이 허용하므로 뺀다. */
function dirSegments(path: string): string[] {
  return path.split(SEPARATOR).slice(0, -1).filter((s) => s !== '');
}

describe('buildPrompt 골든 — 06 §3.3 전송 범위', () => {
  test('케이스가 비어 있지 않다 — 디렉터리를 잘못 잡으면 조용히 0건이 된다', () => {
    expect(entries.length).toBeGreaterThanOrEqual(6);
  });

  test('모든 케이스가 문서의 규칙을 참조한다', () => {
    for (const e of entries) expect(e.one.rule).toMatch(/06 §3\.3|D8/);
  });

  test.each(entries.map((e) => [e.one.name, e] as const))('%s', (_name, e) => {
    const c = e.one;
    const out = buildPrompt({ card: c.card, concept: c.concept, sel: c.sel, stuck: c.stuck });
    const { fence, outside, lines } = cut(out, c.card);

    // ① 첫 줄이 04 §2.4 의 형태이고, 담긴 것은 base name 과 행 번호뿐이다.
    expect(lines[0]).toBe(c.expect.header);
    expect(c.expect.header).toMatch(HEADER);
    expect(HEADER.exec(c.expect.header)?.[2]).toBe(String(c.card.focus));

    // ② 9줄 초과 없음 (06 §3.3-1). 펜스가 실제로 그 자리에서 닫히는지도 같이 본다.
    expect(fence).toHaveLength(c.expect.fenceCount);
    expect(fence.length).toBeLessThanOrEqual(MAX_PROMPT_LINES);
    expect(lines[BEFORE - 1]).toBe('```');
    expect(lines[BEFORE + fence.length]).toBe('```');

    // ③ 펜스 밖에 경로 구분자가 없다 — 펜스 안의 `/` 는 사용자가 보내기로 한 자기 코드다.
    expect(outside).not.toMatch(SEPARATOR);

    // ④ 디렉터리가 한 조각도 새지 않는다 (D8).
    for (const seg of dirSegments(c.card.file)) expect(out).not.toContain(seg);

    // ⑤ 리포명·커밋 메시지·작성자 없음 (06 §3.3-2).
    for (const forbidden of c.absent) expect(out).not.toContain(forbidden);

    // ⑥ 전문 회귀 스냅샷.
    if (UPDATE) {
      c.expect.prompt = out.split('\n');
      writeFileSync(join(DIR, e.file), `${JSON.stringify(c, null, 2)}\n`);
    } else {
      expect(out.split('\n')).toEqual(c.expect.prompt);
    }
  });

  test('같은 입력이면 같은 프롬프트다 — 사다리는 두 번 열려도 같은 글을 낸다', () => {
    for (const { one: c } of entries) {
      const args = { card: c.card, concept: c.concept, sel: c.sel, stuck: c.stuck };
      expect(buildPrompt(args)).toBe(buildPrompt(args));
    }
  });
});

// ─── property (06 §1.3 · §3.3-4) ────────────────────────────────────────────

/**
 * 케이스 8건은 사람이 떠올린 8가지다. 경로가 새는 사고는 사람이 안 떠올린 모양에서 난다 —
 * 조각이 0개인 경로, 공백뿐인 파일 이름, 구분자가 섞인 절대 경로. 그래서 같은 두 규칙을
 * 무작위로 다시 흔든다: **9줄 이하**와 **펜스 밖 경로 조각 부재**.
 */
const SEED = 20260903;
const RUNS = 1_000;
const opts = { numRuns: RUNS, seed: SEED } as const;

/** 경로 조각에 쓰는 글자. 구분자는 일부러 뺀다 — 잇는 쪽이 넣는다. */
const segment = fc.string({
  unit: fc.constantFrom('a', 'B', '9', '_', '-', '.', '가', '힣', ' '),
  minLength: 1,
  maxLength: 12,
});

/** 임의의 경로와 그 경로가 내야 하는 base name. base 는 **독립 오라클**이다 — `fileBaseName` 을 쓰지 않는다. */
const pathArb = fc
  .tuple(fc.array(segment, { maxLength: 6 }), segment, fc.constantFrom('/', '\\'))
  .map(([dirs, base, sep]) => ({ file: [...dirs, base].join(sep), base }));

/** 코드 줄에는 구분자를 **일부러 넣는다** — 펜스 안의 `/` 가 밖으로 안 새는 것이 요점이다. */
const codeLine = fc.string({
  unit: fc.constantFrom('a', 'Z', '0', '(', ')', ' ', '=', '.', '+', '/', '\\', '?', '_'),
  maxLength: 40,
});

/** 「막힌 지점」은 사용자가 친 글이다. 구분자 없는 글자만 쓴다 — 있어도 그것은 경로가 아니라 사용자 것이다. */
const stuckArb = fc.string({
  unit: fc.constantFrom('가', '나', '다', ' ', '?', '!', '요'),
  maxLength: 30,
});

const focusArb = fc.integer({ min: 1, max: 100_000 });
const linesArb = fc.array(codeLine, { maxLength: 20 });
const CONCEPT: ConceptRef = { name: '옵셔널 체이닝', token: '?.' };

/** `promptLines` 가 비면 `card.lines` 로 되돌아간다 — 폴백 경로도 같은 규칙을 지켜야 한다. */
function cardOf(file: string, focus: number, promptLines: string[]): T0Card {
  return {
    track: 't0',
    kind: 'meaning',
    file,
    focus,
    lines: [{ n: focus, target: true, t: 'const nick = res.user' }],
    q: '무엇을 돌려줍니까?',
    hint: '값 하나입니다.',
    options: [{ t: '멈추고 undefined' }, { t: '오류' }],
    answer: 0,
    why: [null, { t: '던지는 것은 점입니다.' }],
    ok: '멈춥니다.',
    rule: '없으면 멈춘다.',
    prereq: [],
    uses: [],
    promptLines,
  };
}

describe('buildPrompt property — 임의의 경로·행·파일 길이', () => {
  test('펜스는 언제나 9줄 이하다 (06 §3.3-1)', () => {
    fc.assert(
      fc.property(pathArb, focusArb, linesArb, ({ file }, focus, promptLines) => {
        const card = cardOf(file, focus, promptLines);
        const body = promptCodeLines(card);
        expect(body.length).toBeLessThanOrEqual(MAX_PROMPT_LINES);
        // 원소 하나가 줄바꿈을 품으면 원소는 9개여도 **찍히는 줄**은 10이 된다.
        for (const line of body) expect(line).not.toContain('\n');
        // 그래서 상한은 출력 전체의 줄 수로도 확인한다.
        const out = buildPrompt({ card, concept: CONCEPT, sel: null });
        expect(out.split('\n')).toHaveLength(body.length + BEFORE + AFTER);
      }),
      opts,
    );
  });

  test('펜스 밖에는 경로 조각이 없고 첫 줄은 base name 하나다 (D8 · 06 §3.3-2)', () => {
    fc.assert(
      fc.property(
        pathArb,
        focusArb,
        linesArb,
        stuckArb,
        fc.option(fc.integer({ min: 0, max: 1 }), { nil: null }),
        ({ file, base }, focus, promptLines, stuck, sel) => {
          const card = cardOf(file, focus, promptLines);
          const out = buildPrompt({ card, concept: CONCEPT, sel, stuck });
          const { outside, lines } = cut(out, card);
          expect(lines[0]).toBe(`파일 ${base} ${focus}행 근처입니다.`);
          expect(outside).not.toMatch(SEPARATOR);
        },
      ),
      opts,
    );
  });
});
