import { describe, expect, it } from 'vitest';

import { nextKind, pickRetrySite, planRetry, type RetryCandidate, type RetryCurrent } from './t0-retry.js';

const current: RetryCurrent = { siteId: 10, shape: 'call-arg', kind: 'meaning', attempt: 0 };

describe('pickRetrySite — 같은 개념 · 다른 Site 우선 (04 §2.3)', () => {
  it('다른 Site 가 있으면 그것을 고른다', () => {
    const sites: RetryCandidate[] = [
      { siteId: 10, shape: 'call-arg' },
      { siteId: 22, shape: 'return' },
    ];
    expect(pickRetrySite(sites, current, [])).toBe(22);
  });

  it('Site 가 하나뿐이면 같은 사용처를 그대로 (보기만 재셔플)', () => {
    expect(pickRetrySite([{ siteId: 10, shape: 'call-arg' }], current, [])).toBe(10);
    expect(pickRetrySite([], current, [])).toBe(10);
  });

  it('오늘 본 Site 는 뒤로 밀린다', () => {
    const sites: RetryCandidate[] = [
      { siteId: 22, shape: 'return' },
      { siteId: 33, shape: 'return' },
    ];
    expect(pickRetrySite(sites, current, [22])).toBe(33);
  });

  it('오늘 본 것끼리면 shape 가 다른 쪽이 먼저다', () => {
    const sites: RetryCandidate[] = [
      { siteId: 22, shape: 'call-arg' },
      { siteId: 33, shape: 'return' },
    ];
    expect(pickRetrySite(sites, current, [22, 33])).toBe(33);
  });

  it('앞 기준이 같으면 unknownCount → siteId 로 끊는다 (난수 없음)', () => {
    const sites: RetryCandidate[] = [
      { siteId: 33, shape: 'return', unknownCount: 2 },
      { siteId: 44, shape: 'return', unknownCount: 1 },
      { siteId: 55, shape: 'return', unknownCount: 1 },
    ];
    expect(pickRetrySite(sites, current, [])).toBe(44);
    expect(pickRetrySite([...sites].reverse(), current, [])).toBe(44);
  });
});

describe('nextKind — 2연속 어긋나면 한 단계 쉽게 (04 §2.3)', () => {
  it('1회로는 안 내린다', () => {
    expect(nextKind('meaning', 0)).toBe('meaning');
    expect(nextKind('meaning', 1)).toBe('meaning');
  });

  it('meaning → blank → point 로 한 단계씩', () => {
    expect(nextKind('meaning', 2)).toBe('blank');
    expect(nextKind('blank', 2)).toBe('point');
    expect(nextKind('point', 2)).toBe('point');
  });

  it('연속이 더 쌓여도 한 번에 한 단계만 내린다', () => {
    expect(nextKind('meaning', 5)).toBe('blank');
  });
});

describe('planRetry — 주문서 한 장', () => {
  it('다른 Site + attempt+1, kind 는 유지', () => {
    const sites: RetryCandidate[] = [{ siteId: 10, shape: 'call-arg' }, { siteId: 22, shape: 'return' }];
    expect(planRetry({ sites, current, consecutiveWrong: 1 })).toEqual({
      siteId: 22, kind: 'meaning', attempt: 1,
    });
  });

  it('Site 가 하나뿐 · 2연속 오답 → 같은 Site, attempt+1, kind 하강', () => {
    expect(planRetry({ sites: [{ siteId: 10, shape: 'call-arg' }], current, consecutiveWrong: 2 })).toEqual({
      siteId: 10, kind: 'blank', attempt: 1,
    });
  });
});
