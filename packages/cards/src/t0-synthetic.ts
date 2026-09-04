/**
 * 합성 예제 카드 (D137 · 02 §6.2 「진짜 바닥(E-4)」 · 방안 E-4).
 *
 * 내 코드의 사용처가 전부 미지 4 이상이라 아직 못 여는 개념에, 사전이 들고 있는 **가장
 * 단순한 모양**을 먼저 보여 준다. 재료는 `concept.examples[].code` + `expect.picks` 이고
 * ts 사전은 28/28 이 이미 갖고 있다 — **LLM 을 부르지 않는다.**
 *
 * 이 파일의 계약 하나가 나머지 전부보다 중요하다: **`previewSiteId` 는 선택이 아니라 필수
 * 인자다.** 방안 E-4 는 합성 예제에 「반드시 '곧 네 코드 어디에서 이걸 보게 된다'를 함께
 * 예고할 것 — 없으면 앱이 일반 튜토리얼로 변질된다」고 조건을 걸었는데, 조건이 문서에만
 * 있으면 지켜지지 않는다. 그래서 타입이 강제한다. 리포에 사용처가 없어 예고할 자리가 없는
 * 개념은 **카드를 만들지 않는다.**
 */
import { t } from '@chickadee/i18n';
import type { Concept } from '@chickadee/dictionary';
import type { ConceptId, ConceptSite } from '@chickadee/store-sql';

import { generateKind, prefer } from './t0.js';
import {
  isFailure, type FocusLine, type GenResult, type SiteInput, type T0Request,
} from './types.js';

/**
 * 합성 카드의 `site_id`. 원장에는 `NULL` 로 들어간다 — 대응하는 `concept_site` 행이 없다.
 * 음수라 진짜 사용처 id(자동 증가, 1부터)와 절대 겹치지 않는다.
 */
export const SYNTHETIC_SITE_ID = -1;

/** 합성 카드인가. 원장에 쓰는 쪽과 화면이 같은 판정을 쓴다. */
export const isSynthetic = (siteId: number): boolean => siteId === SYNTHETIC_SITE_ID;

/**
 * 합성 예제 요청. `sites` 는 사전이 주므로 받지 않고, `previewSiteId` 는 **필수**다.
 */
export interface SyntheticRequest extends Omit<T0Request, 'sites' | 'previewSiteId'> {
  /** 「곧 여기서 봅니다」로 예고할 내 코드의 사용처. 없으면 만들지 않는다 (E-4). */
  previewSiteId: number;
}

/** 합성 사용처의 `site_key` — 시드가 여기서 나오므로 개념마다 안정적이어야 한다. */
const syntheticKey = (conceptId: string, at: number): string => `synthetic:${conceptId}:${at}`;

/**
 * 사전 예제 하나를 사용처 모양으로. 카드 생성기는 이것이 합성인지 모르고 평소대로 돈다 —
 * 그래서 지목형의 오답 선정·시드·누설 검사(04 §1.1·§1.2)가 그대로 걸린다.
 */
function siteFromExample(concept: Concept, at: number): SiteInput | null {
  const example = concept.examples[at];
  if (example === undefined || example.expect === 'none') return null;
  const picks = example.expect.picks;
  if (picks === undefined) return null;

  const text = example.code.replace(/\n+$/, '');
  const lines: FocusLine[] = text.split('\n').map((line, i) => ({ n: i + 1, t: line }));
  if (lines.length === 0) return null;

  const site: ConceptSite = {
    id: SYNTHETIC_SITE_ID,
    repoId: 0,
    fileId: 0,
    conceptId: concept.id as ConceptId,
    siteKey: syntheticKey(concept.id, at),
    // 초점은 첫 줄이다 — 사전 예제는 「가장 단순한 모양」이라 대개 한 줄이고, 여러 줄이면
    // 첫 줄이 그 개념이 서는 자리다.
    lineStart: 1,
    lineEnd: lines.length,
    colStart: 0,
    colEnd: (lines[0]?.t.length ?? 0),
    tsNodeKind: null,
    form: example.expect.form ?? null,
    shape: example.expect.form ?? 'synthetic',
    occurrence: 0,
    excerpt: text,
    picks: Object.fromEntries(
      Object.entries(picks).map(([n, v]) => [Number(n), v]),
    ) as Record<number, string>,
    hole: example.expect.hole ?? null,
    ctx: example.expect.ctx ?? {},
    lineConcepts: [concept.id as ConceptId],
    uncoveredRatio: 0,
    confidence: 'syntactic',
    parseQuality: 'ok',
    isDirty: false,
    isOversize: false,
    commitId: null,
    unknownCount: 0,
    isAlive: true,
    updatedAt: 0,
  };

  // 파일 이름 자리에는 경로 대신 「사전 예제」가 선다 — 없는 파일을 가리키면 3단
  // 「다른 자리」와 4단 프롬프트가 거짓말을 한다.
  //
  // 창은 예제 전체다 (D141). 사전 예제는 그 자체가 「가장 단순한 모양」 하나라 감싸는
  // 블록을 따로 찾을 것이 없다 — 예제를 잘라 보여 주면 보여 줄 것이 남지 않는다.
  return { site, path: t('t0.syntheticFile'), lines, block: { from: 1, to: lines.length } };
}

/**
 * 합성 예제 카드 한 장. 사전 예제를 앞에서부터 훑고, 예제마다 평소의 유형 선호 사슬
 * (`prefer(ly)`)을 태워 처음 성공한 것을 돌려준다.
 *
 * **유형을 고정하지 않는다.** 처음에 지목형으로 못박았다가 실측에서 뒤집혔다 — 0장이
 * 담는 뿌리 개념 넷 중 `ts/string-literal`·`ts/number-literal`·`ts/undefined-null` 은
 * 사전에 `point:` 문항이 **0개**고, `ts/const-declaration` 은 문항이 있어도 예제
 * `const total = 42` 에서 짚을 후보가 3개뿐이라 오답 셋을 못 채운다(04 §1.1 은 넷을
 * 요구한다). ts essential 22개 중 `meaning:` 은 22/22, `blank:` 는 2/22 다. 즉 합성이
 * 실제로 설 수 있는 유형은 개념마다 다르고, 그 판단은 이미 `prefer()` 가 갖고 있다.
 *
 * 사전이 채워지면(D137 의 짝인 사전 저작 게이트) 같은 개념이 저절로 지목형으로 올라선다 —
 * 여기를 고칠 필요가 없다.
 */
export function makeSyntheticCard(req: SyntheticRequest): GenResult {
  const reasons: string[] = [];

  for (let at = 0; at < req.concept.examples.length; at += 1) {
    const input = siteFromExample(req.concept, at);
    if (input === null) continue;
    const full: T0Request = { ...req, sites: [input], previewSiteId: req.previewSiteId };
    for (const kind of prefer(req.ly)) {
      const out = generateKind(full, kind, input);
      // 누설(정답이 맥락 줄에 또 보임)은 합성에서 미루지 않는다 — 예제가 한 줄이라 물릴
      // 다음 바퀴가 없고, 예제 자체가 「가장 단순한 모양」이라 그것이 정상이다.
      if (!isFailure(out)) return out;
      reasons.push(out.reason);
    }
  }
  return { reason: reasons[0] ?? t('t0.noExample') };
}
