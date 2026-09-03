/**
 * T1 판정 지연 벤치 (06 §1.6: 비교 엔진 20줄 < 20 ms · 40줄 < 35 ms · 차단은 그 2배).
 *
 * 재는 것은 **정규식층까지의 `gradeT1`** 이다 — `ast` 를 안 넘기면 AST 승격층이 돌지 않는다
 * (04 §4.5 의 언어 폴백 경로와 같다). AST 를 넣으려면 `parse_snippet` 이 필요하고 그것은
 * Rust 명령이라 vitest 안에서 못 부른다. 즉 여기 숫자는 **하한**이고, 실제 화면의 지연은
 * 파싱 왕복이 더해진 값이다. 그 왕복은 인제스트 벤치(criterion)가 따로 잰다.
 *
 * 「거터 0.2 ms/줄」은 이 벤치가 재는 것이 아니다 — 거터는 화면 쪽 값이고 `perfRun.ts` 의
 * `t1:monaco` 가 그 자리를 본다(05 §10 예산 250 ms, M4 실측 292~303).
 */
import { bench, describe } from 'vitest';

import { gradeT1 } from '../packages/grading/src/t1-result.js';

import type { T1Input } from '../packages/grading/src/t1-result.js';

/** 원본 한 줄을 만든다 — 선언·호출·조건·반복이 섞이게. 빈 줄도 섞는다(분모에서 빠진다). */
function original(lines: number): string[] {
  const out: string[] = [
    "import { readFile } from 'node:fs/promises';",
    '',
    'export interface Row { id: number; name: string; ok: boolean }',
    '',
  ];
  for (let i = out.length; i < lines; i += 1) {
    const n = i;
    switch (n % 6) {
      case 0: out.push(`const total${n} = rows.reduce((acc, row) => acc + row.id, 0);`); break;
      case 1: out.push(`if (total${n} > ${n} && rows.length !== 0) {`); break;
      case 2: out.push(`  for (const row of rows) collected.push(row.name.trim());`); break;
      case 3: out.push(`  await readFile(\`./out-${n}.json\`, 'utf8');`); break;
      case 4: out.push('}'); break;
      default: out.push(`export const pick${n} = (rows: Row[]): Row | undefined => rows[${n % 5}];`);
    }
  }
  return out;
}

/**
 * 답안 — **정답이 아니다.** 따옴표·세미콜론·변수명 치환(= `equiv` 후보)과 진짜 어긋남
 * (`differ`)과 누락을 섞는다. 전부 `exact` 면 비교기가 가장 싼 길만 지나 벤치가 거짓말한다.
 */
function answer(lines: string[]): string[] {
  return lines
    .filter((_, i) => i % 11 !== 7)                       // 열한 줄에 하나 누락
    .map((line, i) => {
      if (i % 4 === 0) return line.replace(/'/g, '"').replace(/;$/, '');
      if (i % 4 === 1) return line.replace(/\brows\b/g, 'items');
      if (i % 4 === 2) return line.replace(/!==/g, '!=').replace(/&&/g, '||');
      return line;
    });
}

function inputOf(lines: number): T1Input {
  const orig = original(lines);
  return {
    blockId: 1,
    stage: 2,
    original: orig,
    user: answer(orig),
    grammar: 'typescript',
    moduleDecls: ['readFile', 'Row'],
    peeks: 0,
    downgraded: false,
    // 골든과 같은 이유로 시계를 고정한다 — 벤치가 재는 것은 판정이지 `performance.now` 가 아니다.
    clock: () => 0,
  };
}

const small = inputOf(20);
const large = inputOf(40);

describe('T1 비교 엔진 (06 §1.6 — 20줄 20 ms · 40줄 35 ms, 차단은 2배)', () => {
  bench('gradeT1 · 20줄', () => {
    gradeT1(small);
  });

  bench('gradeT1 · 40줄', () => {
    gradeT1(large);
  });
});
