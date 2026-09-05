/**
 * 합성 예제 카드 (D137 · D158 · **D177** · 02 §6.2 「진짜 바닥(E-4)」 · 방안 E-4).
 *
 * 내 코드의 사용처가 전부 미지 4 이상이라 아직 못 여는 개념에, 사전이 들고 있는 **가장
 * 단순한 모양**을 먼저 보여 준다. 재료는 `concept.examples[].code` + `expect.picks` 이고
 * ts 사전은 28/28 이 이미 갖고 있다 — **LLM 을 부르지 않는다.**
 *
 * 이 파일의 계약 하나가 나머지 전부보다 중요하다: **문을 여는 열쇠가 없으면 카드를 만들지
 * 않는다.** 방안 E-4 는 합성 예제에 「반드시 '곧 네 코드 어디에서 이걸 보게 된다'를 함께
 * 예고할 것 — 없으면 앱이 일반 튜토리얼로 변질된다」고 조건을 걸었는데, 조건이 문서에만
 * 있으면 지켜지지 않는다. 그래서 타입이 강제한다.
 *
 * **문은 이제 둘이고 열쇠도 둘이다** (D177 이 D158 ② 를 실물로 옮긴 자리).
 *
 * | 문 | 리포 사정 | 열쇠 |
 * |---|---|---|
 * | {@link makeSyntheticCard} | 자리는 **있는데** 아직 미지가 많아 못 연다 | `previewSiteId` — 「곧 여기서 봅니다」 |
 * | {@link makeAbsentCard} | 자리가 **아예 없다** | `absent` — 「네 코드엔 없다」 + 왜 없나 |
 *
 * 열쇠를 하나로 합치지 않은 이유가 이 파일의 요점이다 — 두 상황은 사용자에게 **다른 말**을
 * 해야 한다. 하나는 예고이고 하나는 부재의 사유다. 열쇠가 하나면 둘이 섞이고, 섞이면
 * D137 이 막으려던 「예고 없는 합성」이 「사유 없는 합성」의 얼굴로 되돌아온다.
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

/**
 * 「네 코드엔 없다」의 **사유** 네 갈래 (D158 ② · D177).
 *
 * 사유가 사전이 아니라 여기 있는 이유는 `exec/order` 의 선례와 같다 — 이 넷은 **개념마다
 * 다르지 않고 언어에도 안 매인다.** 「라이브러리가 이미 그 일을 한다」는 자바에서도
 * 파이썬에서도 참이고, 사전에 두면 개념 수 × 언어 수만큼 같은 문장을 복제하게 된다.
 * 개념마다 다른 것 — 최소 예제와 문항 — 은 사전의 `examples[]` 에 그대로 남는다.
 *
 * | 값 | 뜻 | 자바 예 |
 * |---|---|---|
 * | `framework` | 프레임워크가 대신 만들어 준다 | 롬복이 지운 생성자 · `@EqualsAndHashCode` |
 * | `library` | 이미 있는 것을 부르지 직접 짜지 않는다 | 정렬 · 제네릭 경계 |
 * | `scale` | 이 리포 규모에서는 필요가 안 생겼다 | 추상 클래스 계층 |
 * | `idiom` | 다른 문법이 그 자리를 가져갔다 | `for (;;)` ← 스트림·for-each |
 */
export type AbsenceReason = 'framework' | 'library' | 'scale' | 'idiom';

/**
 * 사유 넷의 i18n 키. **문구는 `packages/i18n` 이 대고 이 파일은 키만 안다** — 카탈로그의
 * 자리는 여기가 아니라 거기다(`exec/order` 의 `renderFirstRun` 과 같은 모양).
 *
 * 지금은 그 키 넷이 아직 없어서 `t()` 로 부르지 않는다. 화면이 이 값을 받아 자기 쪽에서
 * 편다 — 없는 키를 여기서 부르면 타입이 떨어지고, 떨어뜨리지 않으려고 문구를 이 파일에
 * 베껴 두면 카탈로그가 둘이 된다.
 */
export const ABSENCE_MESSAGE_KEY: Record<AbsenceReason, string> = {
  framework: 't0.absentFramework',
  library: 't0.absentLibrary',
  scale: 't0.absentScale',
  idiom: 't0.absentIdiom',
};

/**
 * 개념 → 「없다면 왜 없나」. **없다는 사실은 리포가 정하고**(사용처가 0인가) **사유는 이 표가
 * 정한다.** 둘을 갈라 둔 것이 이 표의 요점이다 — 사유는 리포마다 달라지지 않는다.
 *
 * 표에 없는 개념은 {@link makeAbsentCard} 를 못 부른다. 사유 없이 열리는 문은 두지 않는다
 * (D137 이 `previewSiteId` 로 세운 잠금과 같은 규칙).
 */
const ABSENCE: Readonly<Record<string, AbsenceReason>> = {
  // 스프링·롬복이 소스에서 지워 버린 것. 표본 리포에서 `@RequiredArgsConstructor` 29파일.
  'java/constructor': 'framework',
  'java/equals-hashcode': 'framework',
  // 부르기만 하지 직접 짜지 않는 것. 표본 리포에서 `<T extends …>` 0곳 · `? extends` 0곳.
  'java/generic-bound': 'library',
  // 이 규모에서는 계층이 안 생겼다. 표본 리포에서 `abstract class` 0곳,
  // `extends` 9곳 중 8곳이 예외 계층이다.
  'java/abstract-class': 'scale',
  // 다른 문법이 자리를 가져갔다. 표본 리포에서 `for (;;)` 0곳 · for-each 1곳 · 배열 1곳이고,
  // 그 자리를 스트림(9곳)과 람다(53곳)가 다 쓴다.
  'java/for-loop': 'idiom',
  'java/for-each': 'idiom',
  'java/array': 'idiom',
  // 이 규모에서는 여닫을 자원이 없다. 표본 리포의 빈이 전부 생성자 주입만 쓰는 무상태
  // 서비스라 `@PostConstruct`·`@PreDestroy`·`InitializingBean`·`@Scope`·`@Lazy` 가 0곳이고,
  // 낱말을 더 넓히면 `spring/bean-and-container` 의 자리를 짚게 된다 (D176).
  'spring/bean-lifecycle': 'scale',
};

/**
 * 이 개념이 리포에 없을 때 댈 사유. 없으면 `null` 이고, 그때는 카드를 만들지 않는다.
 */
export const absenceReason = (conceptId: string): AbsenceReason | null =>
  ABSENCE[conceptId] ?? null;

/**
 * 리포에 사용처가 **아예 없는** 개념의 요청. `previewSiteId` 자리에 사유가 들어간다 —
 * 예고할 자리가 없으니 예고 대신 「왜 네 코드엔 없나」를 낸다. 그것 자체가 공학 문항이다
 * (D158 ②).
 */
export interface AbsentRequest extends Omit<T0Request, 'sites' | 'previewSiteId'> {
  /** 「네 코드엔 없다」의 사유. 없으면 만들지 않는다. */
  absent: AbsenceReason;
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
  return bakeFromExamples(req);
}

/**
 * 리포에 자리가 **아예 없는** 개념의 카드 한 장 (D177 · D158 ②).
 *
 * 구워지는 방식은 {@link makeSyntheticCard} 와 같다 — 재료는 같은 `examples[]` 이고
 * 카드 생성기는 이것이 합성인지 모른다. 다른 것은 화면이 그 옆에 무엇을 붙이느냐다:
 * 합성은 「곧 네 코드 여기서 봅니다」를, 이쪽은 「네 코드엔 없다 — {@link AbsenceReason}」를
 * 붙인다. `previewSiteId` 는 **넘기지 않는다**. 없는 자리를 예고하면 그것이 거짓말이다.
 *
 * 1·2부가 이 문으로 선다. 표본 리포에서 `abstract-class`·`generic-bound`·`equals-hashcode`
 * 는 0곳이고, 이 문이 없으면 그 셋은 영영 못 가르친다.
 */
export function makeAbsentCard(req: AbsentRequest): GenResult {
  return bakeFromExamples(req);
}

/**
 * 사전 예제로 카드를 굽는 공통 몸통. 두 문이 이것을 나눠 쓰고, 갈리는 것은 `previewSiteId`
 * 하나다 — {@link AbsentRequest} 에는 그 필드가 없으므로 `undefined` 로 내려간다.
 */
function bakeFromExamples(req: SyntheticRequest | AbsentRequest): GenResult {
  const reasons: string[] = [];
  const preview = 'previewSiteId' in req ? req.previewSiteId : undefined;

  for (let at = 0; at < req.concept.examples.length; at += 1) {
    const input = siteFromExample(req.concept, at);
    if (input === null) continue;
    const full: T0Request = { ...req, sites: [input], ...(preview === undefined ? {} : { previewSiteId: preview }) };
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
