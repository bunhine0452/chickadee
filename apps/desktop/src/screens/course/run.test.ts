import type { StageVerdict } from '@chickadee/grading';
import type { CardPayload } from '@chickadee/store-sql';
import { describe, expect, test } from 'vitest';

import {
  EST_MIN, answerWindow, foldFlow, foldOrder, plannedMin, queueKindOf, runLangOf, spliceWindow, tally,
  typeOf, type StageCardView,
} from './run.js';

const flow = (answer: string[], traps: string[]): Extract<CardPayload, { track: 't2' }> => ({
  track: 't2', kind: 'flow', q: 'q', hint: 'h', bands: [], files: [], edges: [],
  core: {}, sec: {}, trap: {}, hints: [],
  flow: { answer, deck: [...answer, ...traps] },
});

const card = (type: StageCardView['type'], stageNo: StageCardView['stageNo']): StageCardView => ({
  id: 1, kind: 'point', conceptId: 'exec/order' as StageCardView['conceptId'], stageNo, type,
  payload: { track: 't2', kind: 'flow', q: '', hint: '', bands: [], files: [], edges: [], core: {}, sec: {}, trap: {}, hints: [] },
  estMin: EST_MIN[type],
});

const ok = (v: boolean): StageVerdict =>
  ({ ok: v, pct: v ? 100 : 0, diagnosis: null, okText: null, rule: null, detail: { kind: 'wrong-shape' }, gated: true, run: null });

describe('판 모양 → 유형 (D164 ②)', () => {
  test('t0 지목은 exec, t2 flow 는 hop, t2 radius 는 caller', () => {
    expect(typeOf({ track: 't0', kind: 'point', file: 'a', focus: 1, lines: [], q: '', hint: '', answer: 0, why: [], ok: '', rule: '', prereq: [], uses: [], promptLines: [] })).toBe('exec');
    expect(typeOf(flow(['a', 'b'], []))).toBe('hop');
    expect(typeOf({ ...flow([], []), kind: 'radius' })).toBe('caller');
  });

  test('t3 은 kind 또는 type 이 유형이다 · 세션 판은 null', () => {
    expect(typeOf({ track: 't3', kind: 'cut', stage: 3, file: 'a', focus: 1, lines: [], q: '', hint: '', options: [], answer: 0, why: [], ok: '', rule: '', promptLines: [] })).toBe('cut');
    expect(typeOf({ track: 't1', kind: 'transcribe', blockId: 1, file: 'a', fn: 'f', original: [], show2: [], why: { line: 0, q: '', help: '', choices: [] } })).toBeNull();
    expect(typeOf({ ...flow([], []), kind: 'placement' })).toBeNull();
  });
});

describe('셈과 접기', () => {
  test('handoff 는 묻지 않은 것으로 센다 — 5단이 늘 미달이 되지 않게', () => {
    const cards = [card('reimpl-spec', 5), card('handoff', 5)];
    expect(tally(cards, { 0: ok(true), 1: ok(true) })).toEqual({ asked: 1, correct: 1 });
    expect(tally(cards, { 0: ok(false) })).toEqual({ asked: 1, correct: 0 });
  });

  test('게이트에 안 드는 판정은 묻지 않은 것으로 센다 (D180)', () => {
    const cards = [card('reimpl-spec', 5), card('reimpl-layer', 5)];
    const off = { ...ok(true), gated: false };
    // 러너도 테스트도 없으면 5단은 셀 것이 없다 — asked 0 이면 그 단은 통과하지 않고 통과선이 내려간다.
    expect(tally(cards, { 0: off, 1: off })).toEqual({ asked: 0, correct: 0 });
    expect(tally(cards, { 0: ok(true), 1: off })).toEqual({ asked: 1, correct: 1 });
  });

  test('foldOrder 는 양 끝을 남기고 가운데를 고르게 뽑는다 (foldPath 와 같은 규칙)', () => {
    expect(foldOrder(['a', 'b', 'c', 'd', 'e'])).toEqual(['a', 'c', 'e']);
    expect(foldOrder(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(foldOrder(['a', 'b'])).toEqual(['a', 'b']);
  });

  test('foldFlow 는 정답을 3칸으로 접고 접힌 칸을 덱에서도 뺀다', () => {
    const folded = foldFlow(flow(['v', 'ctl', 'svc', 'dao', 'xml'], ['trap']));
    expect(folded.flow?.answer).toEqual(['v', 'svc', 'xml']);
    expect(folded.flow?.deck).toEqual(['v', 'svc', 'xml', 'trap']);
  });

  test('큐 칸 색은 세 트랙 별칭뿐이다', () => {
    expect(queueKindOf('cut')).toBe('t0');
    expect(queueKindOf('hop')).toBe('t2');
    expect(queueKindOf('patch-line')).toBe('t1');
    expect(plannedMin([card('hop', 2), card('cut', 3)])).toBe(3);
  });
});

describe('답을 파일 창으로 (D180)', () => {
  const repair = (over: Partial<Extract<CardPayload, { kind: 'repair' }>> = {}): CardPayload => ({
    track: 't3', kind: 'repair', type: 'patch-line', stage: 4, q: 'q',
    file: 'BACK/src/main/java/com/x/AuthService.java', grammar: 'java', goal: 'g',
    commit: { h: 'abc1234', d: '2026-01-02', m: 'fix' },
    lines: ['a();', 'b();'], from: 10, target: 1, expected: ['B();'], promptLines: [], ...over,
  });

  test('한 줄 수정 — 창이 그대로 답이 된다', () => {
    const win = answerWindow(repair(), { kind: 'lines', lines: ['a();', 'B();'] });
    expect(win).toEqual({ file: 'BACK/src/main/java/com/x/AuthService.java', grammar: 'java', from: 10, count: 2, lines: ['a();', 'B();'] });
  });

  test('자리 고르기 — 고른 자리에 그 줄을 끼운다', () => {
    const win = answerWindow(repair({ type: 'patch-place' }), { kind: 'place', at: 1 });
    expect(win?.lines).toEqual(['a();', 'B();', 'b();']);
  });

  test('창을 원본 전문에 끼운다 — 앞뒤는 그대로', () => {
    const full = ['l1', 'l2', 'l3', 'l4', 'l5'];
    const win = { file: 'f', grammar: 'java', from: 2, count: 2, lines: ['X', 'Y', 'Z'] };
    expect(spliceWindow(full, win)).toBe('l1\nX\nY\nZ\nl4\nl5');
  });

  test('러너가 아는 언어만 — 지금은 자바 하나다', () => {
    expect(runLangOf('java')).toBe('java');
    expect(runLangOf('javascript')).toBeNull();
  });
});
