/**
 * 의미형 (04 §1.3). 값 추적 질문의 모든 값은 **템플릿 문장 안의 섹션과 캡처 치환**으로만
 * 정해진다 — 「진짜 값을 계산해 주자」는 실행 채점의 유혹이고 로컬 무실행 원칙을 깬다.
 *
 * 그래서 템플릿이 참조하는 `{{pick.N}}`·`{{ctx.*}}` 가 이 사용처에 없으면 그 문항은 못 쓴다.
 */
import { t } from '@chickadee/i18n';
import { mulberry32, shuffle } from '@chickadee/text';

import { codeLines } from './lines.js';
import { commonPayload, finish, renderDiag, seedFor, type Diag } from './payload.js';
import { buildVars, Renderer } from './vars.js';
import type { GenResult, SiteInput, T0Request } from './types.js';

/**
 * **값이 계산되는 개념**의 꼬리. 이 목록에 걸리는 개념은 4지선다 `meaning` 대신 값 적기로
 * 굽는다 (D187 ③ · `fundamentals.md` §10 ①).
 *
 * 왜 여기서 막나: 4지선다는 소거법으로 맞을 수 있다. 「`int a = 7 / 2;` 뒤 `a` 는?」에
 * 3·3.5·4·3.0 을 늘어놓으면 소수점 있는 둘을 지우고 반올림을 지우면 답이 남는다 —
 * **정수 나눗셈을 몰라도 맞는다.** 값이 계산되는 자리에서 그 형식을 쓰면 재는 것이
 * 이해가 아니라 소거법이다.
 *
 * 왜 **꼬리**로 보나: 같은 축이 언어마다 다른 id 를 쓴다(`java/integer-limit` ·
 * `ts/number-is-double`). 접두어를 열거하면 언어가 늘 때마다 이 목록이 늘고, 그러면
 * 「그 언어만 조용히 4지선다로 남는」 자리가 생긴다.
 *
 * 목록은 둘로 갈린다 —
 *   - **0부 축 여덟** (`docs/curriculum/README.md` §8): 정수 · 실수 · 문자 · 참거짓 ·
 *     연산자 · 형 변환 · 대입 · 비교. `fundConceptId` 가 내는 id 의 꼬리 전부다.
 *   - **1부에서 값이 계산되는 넷**: `arithmetic` · `comparison` · `boolean-literal` ·
 *     `if-statement`. 자바 1부 13개 중 이 넷이고, 나머지 아홉은 값이 안 계산된다
 *     (`ts/arrow-function` 의 「아직 돌지 않은 함수」).
 *
 * 여기 **없는 것**이 규칙의 반이다: 자리를 짚는 것 자체가 값인 개념(`optional-chaining` ·
 * `array-destructuring`)은 소거법이 안 통하므로 `meaning` 이 그대로 맞다.
 */
const VALUE_COMPUTED = new Set([
  // 0부 축 여덟 — 보편형
  'integer-literal', 'float-literal', 'text-literal', 'boolean-value',
  'operator-precedence', 'type-conversion', 'variable-binding', 'comparison',
  // 0부 축 여덟 — 언어별 이름 (`AXIS_CONCEPT` 와 같은 목록이다)
  'integer-limit', 'number-is-double', 'float-inexact', 'text-length',
  'boolean-literal', 'implicit-conversion', 'implicit-cast', 'assignment', 'reassignment',
  // 1부에서 값이 계산되는 넷 중 위에 안 나온 둘
  'arithmetic', 'if-statement',
]);

/**
 * 이 개념은 값이 계산되나 — 그러면 `meaning` 이 아니라 값 적기다 (D187 ③).
 *
 * **`cs/` 는 제외한다.** 기계 개념 45장(D157·D167)은 「값을 묻는 자리」가 아니라 「문법
 * 아래에 깔린 기계를 설명하는 자리」이고, 판이 뜻 고르기 하나뿐이다(빌린 창 · `t0-proto`).
 * 축 이름이 겹친다고 그것까지 막으면 `cs/operator-precedence`·`cs/type-conversion` 두 장이
 * 판을 잃는다 — 그 둘의 값 적기 짝은 **언어 개념 쪽**에 이미 있다.
 */
export const isValueComputed = (conceptId: string): boolean =>
  !conceptId.startsWith('cs/') && VALUE_COMPUTED.has(conceptId.slice(conceptId.indexOf('/') + 1));

/**
 * 합성 예제의 `site_id` (`t0-synthetic.ts` 의 `SYNTHETIC_SITE_ID`). 그쪽을 import 하면
 * `t0-meaning → t0-synthetic → t0 → t0-meaning` 순환이 생겨 값만 여기 옮겨 적었고,
 * **시험이 두 값이 같은지 못박는다**.
 */
const SYNTHETIC_SITE = -1;

export function genMeaning(req: T0Request, input: SiteInput): GenResult {
  const { concept } = req;
  const { site } = input;
  // 값이 계산되는 개념은 **적게 한다** — 이 자리를 4지선다로 두면 소거법이 이해를 대신한다.
  //
  // **1부(합성 예제)에서만이다** (D187 ③ · 문서 §7 표). 내 코드의 사용처에서 나오는 T0 판은
  // 그대로 둔다 — 그 자리의 물음은 「이 값이 무엇인가」가 아니라 「네 코드의 이 자리가 그
  // 개념이다」이고, 값 적기가 대신할 판이 아니다. 여기서 막으면 대신 낼 판도 없이 구멍만
  // 남는다: 시드(`tiny`)로 재 보니 새 판 드롭률이 0% → 18.2% 가 됐다.
  if (site.id === SYNTHETIC_SITE && isValueComputed(concept.id)) {
    return { reason: t('fund.meaningIsValue') };
  }
  if (concept.meaning.length === 0) return { reason: t('t0.dropNoMeaningEntry') };
  // 값 추적은 캡처가 정확해야 한다. 추정으로 잡은 자리에서는 값이 무엇인지 말할 수 없다.
  if (site.confidence === 'heuristic') return { reason: t('t0.dropHeuristicSite') };
  if (site.parseQuality === 'poor') return { reason: t('t0.dropPoorParse') };

  const rng = mulberry32(seedFor(req, 'meaning', input));
  const entry = concept.meaning[Math.floor(rng() * concept.meaning.length)] ?? concept.meaning[0];
  if (!entry) return { reason: t('t0.dropNoMeaningEntry') };

  const r = new Renderer(buildVars(input, concept));
  const rendered = entry.options.map((o) => ({
    t: r.need(o.t),
    ...(o.mono === true ? { mono: true as const } : {}),
    diag: o.diag ? renderDiag(o.diag, r) : null,
  }));
  const common = commonPayload(req, input, r);
  const q = r.need(entry.q);
  const hint = entry.hint === undefined ? '' : r.need(entry.hint);
  if (!r.ok) return { reason: r.reason };
  if (rendered.slice(1).some((o) => o.diag === null)) return { reason: t('t0.dropNoWrongDiag') };

  const order = shuffle(rendered.map((_, i) => i), rng);
  const options = order.map((i) => {
    const o = rendered[i];
    return { t: o?.t ?? '', ...(o?.mono === true ? { mono: true as const } : {}) };
  });
  const why: (Diag | null)[] = order.map((i) => rendered[i]?.diag ?? null);

  return {
    card: finish(req, input, 'meaning', {
      track: 't0', kind: 'meaning', ...common,
      lines: codeLines(input.lines, site.lineStart, [], input.block),
      q, hint, options, answer: order.indexOf(0), why,
    }),
  };
}
