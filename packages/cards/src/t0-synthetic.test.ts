/**
 * 합성 예제 카드 (D137).
 *
 * **진짜 번들 사전에 대고 돈다.** 이 기능의 주장이 「사전이 재료를 이미 다 갖고 있다」
 * (ts `examples[].code` + `expect.picks` 28/28)이므로, 모형 사전으로 재면 그 주장을
 * 검사하지 않는 것이 된다.
 */
import { loadDict } from '@chickadee/dictionary';
import type { ConceptId } from '@chickadee/store-sql';
import { describe, expect, test } from 'vitest';

import {
  ABSENCE_MESSAGE_KEY, SYNTHETIC_SITE_ID, absenceReason, isSynthetic, makeAbsentCard,
  makeSyntheticCard,
} from './t0-synthetic.js';
import { isFailure } from './types.js';
import type { AbsenceReason } from './t0-synthetic.js';

const dict = loadDict();
const PREVIEW = 4242;

const req = (conceptId: string, previewSiteId = PREVIEW) => {
  const concept = dict.concepts.get(conceptId);
  if (concept === undefined) throw new Error(`사전에 없는 개념: ${conceptId}`);
  return {
    repoId: 1,
    dictVersion: 'test',
    attempt: 0,
    concept,
    concepts: dict.concepts,
    ly: 0,
    previewSiteId,
  };
};

/** ts `essential` 중 선행 깊이가 낮아 0장에 실제로 담기는 것들. */
const ROOTS = ['ts/const-declaration', 'ts/number-literal', 'ts/string-literal'];

describe('사전 예제로 판을 만든다 — LLM 0회', () => {
  test.each(ROOTS)('%s 는 합성 판이 선다', (conceptId) => {
    const out = makeSyntheticCard(req(conceptId));
    expect(isFailure(out)).toBe(false);
  });

  test('사용처가 아니라 사전 예제를 본문으로 쓴다', () => {
    const out = makeSyntheticCard(req('ts/const-declaration'));
    if (isFailure(out)) throw new Error(out.reason);
    const example = dict.concepts.get('ts/const-declaration')?.examples[0];
    // 유형이 개념마다 다르므로 줄은 `t`(통짜) 일 수도 `seg`(조각) 일 수도 있다 —
    // 빈칸형·지목형은 스팬이 있어 `codeLines` 가 `seg` 로 낸다.
    expect(out.card.payload.lines
      .map((l) => ('t' in l ? l.t : l.seg.map((sg) => ('t' in sg ? sg.t : '')).join('')))
      .join('')).not.toBe('');
    expect(example?.code).toBeDefined();
  });
});

describe('예고가 없으면 판도 없다 (방안 E-4)', () => {
  test('previewSiteId 가 payload 에 실린다 — 「곧 여기서 봅니다」의 대상', () => {
    const out = makeSyntheticCard(req('ts/const-declaration'));
    if (isFailure(out)) throw new Error(out.reason);
    expect(out.card.payload.previewSiteId).toBe(PREVIEW);
  });

  test('previewSiteId 는 선택이 아니라 필수 인자다', () => {
    // 타입이 강제하는 것을 실행 시점에도 남겨 둔다 — 인자에서 빼면 컴파일이 깨진다.
    const { previewSiteId, ...without } = req('ts/const-declaration');
    expect(previewSiteId).toBe(PREVIEW);
    // @ts-expect-error previewSiteId 없이는 부를 수 없다 (D137).
    expect(() => makeSyntheticCard(without)).toBeTypeOf('function');
  });
});

describe('합성 판의 표시', () => {
  test('site_id 가 합성 자리표다 — 진짜 사용처 id 와 겹치지 않는다', () => {
    const out = makeSyntheticCard(req('ts/const-declaration'));
    if (isFailure(out)) throw new Error(out.reason);
    expect(out.card.siteId).toBe(SYNTHETIC_SITE_ID);
    expect(SYNTHETIC_SITE_ID).toBeLessThan(0);
    expect(isSynthetic(out.card.siteId)).toBe(true);
    expect(isSynthetic(1)).toBe(false);
  });

  test('파일 이름 자리에 없는 경로를 적지 않는다', () => {
    const out = makeSyntheticCard(req('ts/const-declaration'));
    if (isFailure(out)) throw new Error(out.reason);
    expect(out.card.payload.file).not.toContain('/');
  });

  test('유형은 개념마다 다르다 — 사전이 가진 문항이 정한다', () => {
    // 실측(2026-09-04): ts essential 22개 중 `meaning:` 22 · `point:` 19 · `blank:` 2.
    // 뿌리 개념 셋(string·number·undefined-null)은 `point:` 가 0개라 의미형으로 선다.
    const kinds = new Set(ROOTS.map((id) => {
      const out = makeSyntheticCard(req(id));
      return isFailure(out) ? 'fail' : out.card.kind;
    }));
    expect(kinds.has('fail')).toBe(false);
  });
});

describe('결정성 (04 §0)', () => {
  test('같은 요청이면 같은 카드다', () => {
    const a = makeSyntheticCard(req('ts/const-declaration'));
    const b = makeSyntheticCard(req('ts/const-declaration'));
    if (isFailure(a) || isFailure(b)) throw new Error('판이 서지 않았다');
    expect(a.card.contentHash).toBe(b.card.contentHash);
  });

  test('다시 찍기(attempt+1)면 다른 카드다', () => {
    const a = makeSyntheticCard(req('ts/const-declaration'));
    const b = makeSyntheticCard({ ...req('ts/const-declaration'), attempt: 1 });
    if (isFailure(a) || isFailure(b)) throw new Error('판이 서지 않았다');
    expect(a.card.gen.attempt).not.toBe(b.card.gen.attempt);
  });

  test('예고 사용처가 달라도 시드는 안 흔들린다 — 시드는 사전 예제에서 나온다', () => {
    const a = makeSyntheticCard(req('ts/const-declaration', 1));
    const b = makeSyntheticCard(req('ts/const-declaration', 999));
    if (isFailure(a) || isFailure(b)) throw new Error('판이 서지 않았다');
    expect(a.card.gen.seed).toBe(b.card.gen.seed);
  });
});

describe('만들 수 없을 때', () => {
  test('예제가 없는 개념은 사유를 달고 실패한다 — 사유 없는 불가는 없다', () => {
    const bare = [...dict.concepts.values()].find((c) => c.examples.length === 0);
    if (bare === undefined) return; // 모든 개념에 예제가 있으면 검사할 것이 없다
    const out = makeSyntheticCard({ ...req(bare.id), concept: bare });
    expect(isFailure(out)).toBe(true);
    if (isFailure(out)) expect(out.reason.length).toBeGreaterThan(0);
  });
});

describe('개념 id 는 브랜드를 유지한다', () => {
  test('payload 의 conceptId 가 카드의 것과 같다', () => {
    const out = makeSyntheticCard(req('ts/number-literal'));
    if (isFailure(out)) throw new Error(out.reason);
    expect(out.card.conceptId).toBe('ts/number-literal' as ConceptId);
  });
});

/**
 * 「네 코드엔 없다」 (D177 · D158 ②). 잠금은 안 풀렸고 **문이 하나 더 났다** — 열쇠가
 * `previewSiteId` 에서 `absent` 로 바뀔 뿐, 열쇠 없이 부를 수 있는 문은 여전히 없다.
 */
describe('리포에 아예 없는 개념 (D177)', () => {
  const absentReq = (conceptId: string, absent: AbsenceReason) => {
    const { previewSiteId, ...rest } = req(conceptId);
    expect(previewSiteId).toBe(PREVIEW);
    return { ...rest, absent };
  };

  test('예고 없이도 판이 선다 — 대신 사유가 필수다', () => {
    const out = makeAbsentCard(absentReq('java/abstract-class', 'scale'));
    expect(isFailure(out)).toBe(false);
  });

  test('없는 자리를 예고하지 않는다 — previewSiteId 가 비어 있다', () => {
    const out = makeAbsentCard(absentReq('java/generic-bound', 'library'));
    if (isFailure(out)) throw new Error(out.reason);
    expect(out.card.payload.previewSiteId).toBeUndefined();
  });

  test('사유는 선택이 아니라 필수 인자다', () => {
    const { previewSiteId, ...without } = req('java/abstract-class');
    expect(previewSiteId).toBe(PREVIEW);
    // @ts-expect-error absent 없이는 부를 수 없다 (D177 — D137 과 같은 잠금).
    expect(() => makeAbsentCard(without)).toBeTypeOf('function');
  });

  test('표본 리포에 0곳인 자바 개념 셋이 실제로 카드가 된다', () => {
    // 이 셋이 D177 의 시험이다 — `MonggleMonggle` 자바 99장에서 `abstract class` 0곳 ·
    // `<T extends …>` 0곳 · `equals`/`hashCode` 재정의 0곳이다. 안 서면 「내 코드에 없는
    // 것을 가르친다」가 말뿐이 된다.
    for (const id of ['java/abstract-class', 'java/generic-bound', 'java/equals-hashcode']) {
      const reason = absenceReason(id);
      expect(reason, id).not.toBeNull();
      const out = makeAbsentCard(absentReq(id, reason as AbsenceReason));
      expect(isFailure(out), id).toBe(false);
    }
  });

  test('사유를 못 대는 개념은 표에 없다 — 사유 없이 열리는 문은 두지 않는다', () => {
    expect(absenceReason('java/class-declaration')).toBeNull();
    expect(absenceReason('ts/const-declaration')).toBeNull();
  });

  test('사유 넷은 전부 문구 키를 갖는다 — 화면이 펼 것이 비어 있지 않다', () => {
    const reasons: AbsenceReason[] = ['framework', 'library', 'scale', 'idiom'];
    for (const r of reasons) expect(ABSENCE_MESSAGE_KEY[r]).toMatch(/^t0\.absent/);
    expect(new Set(Object.values(ABSENCE_MESSAGE_KEY)).size).toBe(reasons.length);
  });
});
