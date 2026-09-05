/**
 * 「먼저 읽기」 (D138).
 *
 * 이 파일이 지키는 것 둘 — **0장 밖에서는 절대 안 열린다**(정본 §1) 와
 * **정답을 누설하는 한 줄은 안 낸다**(D138).
 */
import type { CardPayload } from '@chickadee/store-sql';
import { describe, expect, test } from 'vitest';

import { answerText, leaksAnswer, readFirstText } from './read-first.js';

type T0Payload = Extract<CardPayload, { track: 't0' }>;

const ZERO = new Set(['ts/const-declaration', 'ts/property-access']);

function point(picks: readonly string[], answer: number, oneLiner?: string): T0Payload {
  return {
    track: 't0',
    kind: 'point',
    file: 'src/a.ts',
    focus: 1,
    lines: [{ n: 1, seg: picks.map((t, i) => ({ t, pick: i + 1 })), target: true }],
    q: '',
    hint: '',
    answer,
    why: [],
    ok: '',
    rule: '',
    prereq: [],
    uses: [],
    promptLines: [],
    ...(oneLiner === undefined ? {} : { dict: [{ k: '한 줄', t: oneLiner }] }),
  };
}

function meaning(options: readonly string[], answer: number, oneLiner?: string): T0Payload {
  return {
    ...point([], answer, oneLiner),
    kind: 'meaning',
    options: options.map((t) => ({ t })),
  };
}

describe('정답 글자 꺼내기', () => {
  test('지목형은 코드 줄의 조각에서', () => {
    expect(answerText(point(['const', 'total', '42'], 0))).toBe('const');
    expect(answerText(point(['const', 'total', '42'], 2))).toBe('42');
  });

  test('의미형·빈칸형은 보기에서', () => {
    expect(answerText(meaning(['10', '20'], 1))).toBe('20');
  });

  test('조각도 보기도 없으면 null', () => {
    expect(answerText(point([], 0))).toBeNull();
  });
});

describe('누설 판정 — 사전 린트와 같은 규칙을 쓴다', () => {
  test('정답 낱말이 한 줄에 적혀 있으면 누설이다', () => {
    expect(leaksAnswer('<code>const</code> 는 이름 하나에 값을 묶는다.', 'const')).toBe(true);
  });

  test('낱말이 한 줄에 없으면 누설이 아니다', () => {
    expect(leaksAnswer('값에 이름을 붙이고 다시 묶지 않는다.', 'const')).toBe(false);
  });

  test('기호 정답도 센다 — 린트가 부채로 세는 것을 화면이 펴면 안 된다', () => {
    expect(leaksAnswer('<code>a.b</code> 는 a 안에서 b 를 꺼낸다.', '.')).toBe(true);
    expect(leaksAnswer('<code>a ?? b</code> 는 a 가 없을 때만 b.', '??')).toBe(true);
  });

  test('문장 끝 마침표는 토큰이 아니다 — 아니면 `.` 개념이 영영 못 지나간다', () => {
    expect(leaksAnswer('값을 꺼낸다.', '.')).toBe(false);
  });

  test('식별자는 낱말 경계로 본다 — prev 가 previous 안에서 안 걸린다', () => {
    expect(leaksAnswer('previous 값을 받는다', 'prev')).toBe(false);
    expect(leaksAnswer('prev 값을 받는다', 'prev')).toBe(true);
  });

  test('정답을 모르면 누설이 아니다', () => {
    expect(leaksAnswer('무엇이든', null)).toBe(false);
  });
});

describe('판 위에 펴는 한 줄', () => {
  test('0장 개념이고 누설이 없으면 편다', () => {
    const p = point(['let', 'x', '1'], 1, '값에 이름을 붙이고 다시 묶지 않는다.');
    expect(readFirstText(p, 'ts/const-declaration', ZERO))
      .toBe('값에 이름을 붙이고 다시 묶지 않는다.');
  });

  test('겹이 오른 개념에는 절대 안 편다 — 정본 §1 의 예외는 첫 만남뿐이다 (D150)', () => {
    const p = point(['let', 'x', '1'], 1, '값에 이름을 붙인다.');
    expect(readFirstText(p, 'ts/async-await', ZERO)).toBeNull();
  });

  test('누설하는 한 줄은 조용히 안 낸다', () => {
    const p = point(['const', 'total', '42'], 0, '<code>const</code> 는 이름을 묶는다.');
    expect(readFirstText(p, 'ts/const-declaration', ZERO)).toBeNull();
  });

  test('사전 1층이 없으면 안 낸다', () => {
    expect(readFirstText(point(['a'], 0), 'ts/const-declaration', ZERO)).toBeNull();
  });

  test('1층이 문장이 아니라 단계 목록이면 안 낸다', () => {
    const p: T0Payload = { ...point(['a'], 0), dict: [{ k: '따라가기', steps: ['하나', '둘'] }] };
    expect(readFirstText(p, 'ts/const-declaration', ZERO)).toBeNull();
  });

  test('0장이 안 열린 리포에서는 아무 판에도 안 편다', () => {
    const p = point(['let', 'x', '1'], 1, '값에 이름을 붙인다.');
    expect(readFirstText(p, 'ts/const-declaration', new Set())).toBeNull();
  });
});
