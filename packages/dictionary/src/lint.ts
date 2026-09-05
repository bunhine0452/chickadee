/**
 * 사전 린트 (03 §5.1). 스키마가 잡지 못하는 것 — 참조 무결성, 템플릿 변수, 문체 —
 * 을 본다. `pnpm dict:lint` 가 이 함수를 돌린다.
 *
 * 문체 규칙이 린트인 이유: 「틀렸다」 대신 「그것이 참이 되는 조건」은 정본 §3-2 의
 * 불변 규칙이고, 조사 하드코딩은 값이 무엇인지 모르는 채로 반드시 틀린다 (03 §4.3).
 */
import { mapProse } from './prose.js';
import { koOf, type LangMeta, type Locale, type SourceConcept } from './schema.js';
import { keyOf, type Dict } from './load.js';

export interface LintIssue {
  /** 개념 id, 또는 `_lang.yaml` 이면 언어 이름. */
  at: string;
  rule: string;
  detail: string;
}

/** 사전 문장에서 허용하는 태그 전량 (06 §4.2 와 같은 목록). 속성은 0개다. */
export const ALLOWED_TAGS = ['code', 'b', 'i', 'em', 'br', 'kbd'] as const;

/** 03 §4.3 표. `pick.N` · `ctx.*` 는 패턴으로 따로 본다. */
const PLAIN_VARS = new Set([
  'site.line', 'site.text', 'site.form', 'file', 'file.base', 'hole',
  'other.file', 'other.file.base', 'other.line', 'other.text',
]);
const VAR = /\{\{([#^/]?)([^}|]+)(\|[^}]+)?\}\}/g;
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
/**
 * 변수 바로 뒤의 조사. 값이 `res.user` 인지 `'손님'` 인지 모르므로 반드시 틀린다.
 * 검사 전에 태그를 걷어낸다 — `<code>{{pick.1}}</code> 을` 은 태그만 사이에 낀
 * 같은 실수이고, 태그를 그대로 두면 규칙을 우회하는 법이 되어 버린다.
 */
const JOSA_AFTER_VAR = /\}\}\s*(은|는|이|가|을|를|과|와|으로|로)(\s|$|<)/;

/**
 * 조사만 내고 값을 안 내는 자리. `{{pick.2|josa:이,가}} 돌려준 것` 은 「이 돌려준 것」이 되어
 * 명사가 통째로 빠진다 — 렌더러는 `josa` 필터에 **조사만** 실어 보내기 때문이다(D69).
 * 값을 내는 것은 같은 문장 앞쪽의 `{{pick.2}}` 나 `{{pick.2|code}}` 다.
 */
const JOSA_CALL = /\{\{([a-zA-Z0-9_.]+)\|[^}]*josa:/g;

function josaWithoutValue(text: string): string[] {
  const missing: string[] = [];
  for (const m of text.matchAll(JOSA_CALL)) {
    const name = m[1] ?? '';
    const before = text.slice(0, m.index ?? 0);
    // 같은 이름이 앞에서 한 번이라도 **조사 아닌 형태로** 나왔나.
    const emitted = new RegExp(`\\{\\{${name.replace(/[.]/g, '\\.')}(\\|(?![^}]*josa:)[^}]*)?\\}\\}`).test(before);
    if (!emitted) missing.push(name);
  }
  return missing;
}
/**
 * 판정이 아니라 진단 (정본 §3-2). 언어마다 다른 낱말이라 목록도 언어마다 있다 —
 * `en` 에 한국어 목록을 걸면 아무것도 안 걸리고 초록만 뜬다.
 */
const BANNED_WORDS: Record<Locale, RegExp> = {
  ko: /틀렸|오답|실패했/,
  en: /\b(wrong|incorrect|failed)\b/i,
};

export function lintDict(dict: Dict): LintIssue[] {
  const issues: LintIssue[] = [];
  for (const [lang, meta] of dict.langs) checkLang(lang, meta, dict, issues);
  for (const concept of dict.sources.values()) checkConcept(concept, dict, issues);
  checkCycles(dict, issues);
  return issues.sort((a, b) => a.at.localeCompare(b.at) || a.rule.localeCompare(b.rule));
}

function checkLang(lang: string, meta: LangMeta, dict: Dict, issues: LintIssue[]): void {
  const add = (rule: string, detail: string): void => void issues.push({ at: lang, rule, detail });
  for (const id of meta.essential) {
    if (!dict.sources.has(id)) add('essential-exists', id);
  }
  for (const alt of meta.alternatives) {
    if (!dict.sources.has(alt.gap)) add('alternatives-exists', alt.gap);
    if (!dict.sources.has(alt.present)) add('alternatives-exists', alt.present);
  }
  // 시스템 쿼리는 문법마다 하나면 된다 — 어느 네임스페이스가 갖고 있든 상관없다.
  for (const grammar of meta.grammars) {
    for (const id of ['_imports', '_blocks']) {
      if (!dict.queries.has(keyOf(id, grammar))) add('system-query', `${grammar}/${id}.scm 이 없다`);
    }
  }
}

function checkConcept(concept: SourceConcept, dict: Dict, issues: LintIssue[]): void {
  const add = (rule: string, detail: string): void =>
    void issues.push({ at: concept.id, rule, detail });

  for (const ref of [...concept.prereq, ...concept.confusions]) {
    if (!dict.sources.has(ref)) add('reference-exists', ref);
  }
  if (concept.universal !== null && !dict.sources.has(concept.universal)) {
    add('reference-exists', concept.universal);
  }
  for (const grammar of concept.grammars) {
    if (concept.queries.length > 0 && !dict.queries.has(keyOf(concept.id, grammar))) {
      add('query-for-grammar', grammar);
    }
  }

  const { picks, hasHole, ctxNames } = queryFacts(concept, dict);

  for (const [i, card] of concept.point.entries()) {
    if (!picks.has(card.answer)) add('point-answer-in-query', `point[${i}] ${card.answer}`);
    const wrong = Object.keys(card.diag ?? {});
    for (const key of wrong) {
      if (!picks.has(key)) add('point-diag-in-query', `point[${i}] ${key}`);
      if (key === card.answer) add('point-diag-not-answer', `point[${i}] ${key}`);
    }
  }
  // 빈칸형은 `@hole` 이 있어야 성립하고, 오답은 혼동 쌍의 토큰이어야 한다 (03 §4.4).
  if (concept.blank.length > 0 && !hasHole) add('blank-needs-hole', '쿼리에 @hole 이 없다');
  // 사유는 빈칸형이 **없는** 자리를 설명하는 글이다. 빈칸형이 생긴 뒤에도 남아 있으면
  // 부채 표는 초록인데 이유는 거짓말인 상태가 된다 (D145).
  if (concept.no_hole_reason !== null && concept.blank.length > 0 && hasHole) {
    add('no-hole-reason-stale', 'blank 와 @hole 이 이미 있는데 no_hole_reason 이 남아 있다');
  }
  const confusionTokens = new Set(
    concept.confusions.map((id) => dict.sources.get(id)?.token).filter((t): t is string => !!t),
  );
  // 빈칸형 오답은 혼동 쌍의 **토큰**이라 언어가 없다 — 정본인 `ko` 쪽으로 맞춘다.
  for (const [i, card] of concept.blank.entries()) {
    for (const option of card.options.slice(1)) {
      if (confusionTokens.size > 0 && !confusionTokens.has(koOf(option.t))) {
        add('blank-wrong-from-confusions', `blank[${i}] ${koOf(option.t)}`);
      }
    }
  }
  for (const [i, card] of concept.meaning.entries()) {
    const withDiag = card.options.filter((o) => o.diag).length;
    if (withDiag !== 3) add('meaning-three-diagnoses', `meaning[${i}] ${withDiag}`);
    if (card.options[0]?.diag) add('meaning-answer-first', `meaning[${i}]`);
  }

  // 사전 3층의 `trace` 는 사용자의 코드를 짚어야 한다 — 안 그러면 튜토리얼이 된다.
  // 사용처가 없는 개념(`COMPUTED_NAMESPACES`)은 짚을 코드가 없으므로 제외된다 —
  // 쿼리가 없으면 이 검사 자체가 안 돈다.
  if (concept.queries.length > 0) {
    if (concept.grammars.length === 0) add('grammars-for-query', '쿼리가 있는데 grammars 가 비었다');
    if (!concept.dict.trace.some((t) => /\{\{(site|pick)\./.test(koOf(t)))) {
      add('trace-cites-the-code', 'trace 에 {{site.*}}·{{pick.*}} 참조가 없다');
    }
  }

  // 문장 목록은 로케일 풀기와 **같은 함수**에서 온다 (`prose.ts`) — 목록이 둘이면 새 필드가
  // 한쪽에서만 다뤄진다. 여기서는 사본을 버리고 훑기만 한다.
  const allowed = new Set([...PLAIN_VARS, ...picks, ...ctxNames, ...[...picks].map((p) => `${p}.line`)]);
  mapProse(concept, (where, value) => {
    checkText(`${where}.ko`, koOf(value), 'ko', allowed, add);
    const en = typeof value === 'string' ? undefined : value.en;
    if (en !== undefined) checkText(`${where}.en`, en, 'en', allowed, add);
    return '';
  });
  // `result.value` 는 코드 조각을 끼운 템플릿이라 언어가 없다 — 그래도 렌더되는 문자열이고
  // 한국어 문장 안에 놓이므로 `ko` 규칙 전부를 그대로 받는다 (03 §4.3).
  if (concept.result) checkText('result.value', concept.result.value, 'ko', allowed, add);
  for (const example of concept.examples) {
    if (example.expect !== 'none' && (example.expect.sites ?? 1) < 1) {
      add('example-positive-or-none', example.code.slice(0, 40));
    }
  }
}

/**
 * 문장 하나. `ko` 는 전부 보고, `en` 은 조사 규칙을 뺀 나머지를 본다 — 조사는 한국어 문법이라
 * 영어에 걸면 언제나 통과하는 죽은 규칙이 된다. 태그·속성 검사는 두 언어에 다 건다:
 * 그 규칙이 지키는 것은 문체가 아니라 **HTML 로 렌더된다는 사실**이다 (06 §4.2).
 */
function checkText(
  where: string,
  text: string,
  locale: Locale,
  allowed: ReadonlySet<string>,
  add: (rule: string, detail: string) => void,
): void {
  for (const m of text.matchAll(VAR)) {
    const [, kind = '', raw = ''] = m;
    const name = raw.trim();
    // 섹션 여닫이(`{{#x}}` `{{/x}}` `{{^x}}`)는 변수 이름과 같은 집합을 쓴다.
    if (kind === '/' ) continue;
    if (name === 'other') continue;
    if (!allowed.has(name)) add('template-variable', `${where}: {{${name}}}`);
  }
  for (const m of text.matchAll(TAG)) {
    const [, tag = '', attrs = ''] = m;
    if (!(ALLOWED_TAGS as readonly string[]).includes(tag)) add('html-tag', `${where}: <${tag}>`);
    if (attrs.replace('/', '').trim() !== '') add('html-attribute', `${where}: <${tag} …>`);
  }
  if (locale === 'ko') {
    const bare = text.replace(TAG, '');
    if (JOSA_AFTER_VAR.test(bare)) add('josa-filter', `${where}: 변수 뒤 조사는 |josa: 로`);
    for (const name of josaWithoutValue(text)) {
      add('josa-without-value', `${where}: {{${name}|josa:…}} 앞에 {{${name}}} 이 없다`);
    }
  }
  if (BANNED_WORDS[locale].test(text)) add('diagnosis-not-verdict', `${where}: 정본 §3-2`);
}

/** 선행 그래프에 사이클이 있으면 위상 정렬이 성립하지 않는다 (02 §6.2). */
function checkCycles(dict: Dict, issues: LintIssue[]): void {
  const state = new Map<string, 'open' | 'done'>();
  const walk = (id: string, trail: string[]): void => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'open') {
      issues.push({ at: id, rule: 'prereq-cycle', detail: [...trail, id].join(' → ') });
      return;
    }
    state.set(id, 'open');
    for (const next of dict.sources.get(id)?.prereq ?? []) walk(next, [...trail, id]);
    state.set(id, 'done');
  };
  for (const id of dict.sources.keys()) walk(id, []);
}

/** 개념의 `.scm` 들이 실제로 내는 것. 린트와 부채 표가 같은 자리에서 읽는다. */
function queryFacts(
  concept: SourceConcept,
  dict: Dict,
): { picks: Set<string>; hasHole: boolean; ctxNames: Set<string> } {
  const scms = concept.grammars
    .map((g) => dict.queries.get(keyOf(concept.id, g)))
    .filter((s): s is string => s !== undefined);
  return {
    picks: new Set(scms.flatMap((s) => [...s.matchAll(/@(pick\.[1-9])/g)].map((m) => m[1] ?? ''))),
    hasHole: scms.some((s) => s.includes('@hole')),
    ctxNames: new Set(
      scms.flatMap((s) => [...s.matchAll(/@ctx\.([a-z_]+)/g)].map((m) => `ctx.${m[1] ?? ''}`)),
    ),
  };
}

// ── 사전 저작 부채 (D145) ─────────────────────────────────────────────────────
//
// 위의 `lintDict` 는 **틀린 것**을 잡는다 — 통과가 곧 정답이라 임계가 없다. 여기서 세는
// 것은 **아직 안 쓴 것**이고, 그건 오늘 하루에 사라지지 않는다. 그래서 D132 와 같은 모양을
// 쓴다: 오늘의 실측을 래칫으로 두고 목표를 나란히 적고 표를 매번 찍는다. 임계를 오늘 값에
// 맞춰 두고 목표를 지우면 그 거리가 안 보인다.
//
// 왜 부채가 게이트여야 하는가: 개념 하나가 YAML 150~230줄이고 ko/en 양쪽이라 **사전은 이
// 리포에서 가장 비싼 손 작업**이다. 게이트가 없으면 미뤄지는 것이 기본값이고, `blank:` 2편·
// `why_gate:` 0편이 그 증거다. 그 결과가 판 유형 쏠림이다 —
// `tests/support/quality.test.ts` 의 `KIND_SHARE_RATCHET` 과 이 표는 같은 원인의 앞뒤다.

/** 부채 규칙 하나. 표의 한 줄이 된다. */
export interface DebtCheck {
  /** 래칫 상수의 키. */
  rule: string;
  /** 사람이 읽는 한 줄. */
  label: string;
  /** 지금 충족한 개념 수. */
  met: number;
  /** 이 규칙을 받는 개념 수 = **목표**. */
  total: number;
  /** 아직 못 채운 개념. 괄호 안은 왜 못 채웠는지. */
  gaps: string[];
}

// D150 으로 `ZERO_CHAPTER_DEPTH` 와 `depthWithin` 이 죽어 지웠다. 「먼저 읽기」의 대상이
// 깊이가 아니라 `essential` 소속으로 정해지므로 이 파일은 더 이상 선행 깊이를 세지 않는다 —
// `zero-chapter.ts` 의 상수를 여기 복사해 두던 동기화 부담도 함께 사라졌다.

/** 지목형이 성립하는 최소 후보 수 — 정답 1 + 오답 3 (`packages/cards/src/t0-point.ts`). */
const MIN_PICKS = 3;

/**
 * 문항의 정답이 화면에 **글자로** 나올 때의 그 글자. `examples[].expect` 가 유일한 출처다 —
 * `pick.N` 은 자리 이름이라 그 자체로는 글자가 없고, 무엇이 찍히는지는 예시가 안다.
 */
function answerTokens(concept: SourceConcept): Set<string> {
  const wanted = new Set(concept.point.map((p) => p.answer));
  const tokens = new Set<string>();
  for (const example of concept.examples) {
    if (example.expect === 'none') continue;
    for (const [key, value] of Object.entries(example.expect.picks ?? {})) {
      const name = key.startsWith('pick.') ? key : `pick.${key}`;
      if (wanted.has(name)) tokens.add(value);
    }
    // 빈칸형의 정답은 구멍에 들어 있던 원문이다.
    if (concept.blank.length > 0 && example.expect.hole !== undefined) {
      tokens.add(example.expect.hole);
    }
  }
  return tokens;
}

/**
 * 이 글이 그 토큰을 **글자로** 내주는가.
 *
 * 두 가지를 걷어내고 본다. ① 태그 — `<b>` 의 `b` 는 사람이 읽는 글자가 아니다.
 * ② 문장 부호로 쓰인 마침표·쉼표 — 한국어 문장 끝의 `.` 는 토큰이 아닌데, `.` 이 정답인
 * 개념(`ts/property-access`)에서는 그것까지 걸려 **통과할 수 없는 규칙**이 된다.
 * 식별자 꼴 토큰은 낱말 경계로 본다 — `prev` 가 `previous` 안에서 걸리면 안 된다.
 *
 * **내보내는 이유**: 화면도 같은 판정을 써야 한다. `apps/desktop/src/data/read-first.ts` 가
 * 0장 판 위에 한 줄을 펼지 정할 때 이것을 부른다 — 규칙이 둘이면 린트가 「샌다」고 하는
 * 문장을 화면이 그대로 펴는 일이 생긴다 (D138).
 */
export function revealsToken(text: string, token: string): boolean {
  if (token === '') return false;
  const bare = text.replace(TAG, '').replace(/[.,](?=\s|$)/g, '');
  if (/^[\w$]+$/.test(token)) {
    return new RegExp(`(^|[^\\w$])${token}([^\\w$]|$)`).test(bare);
  }
  return bare.includes(token);
}

/**
 * 사전 저작 부채를 센다. **틀린 것이 아니라 안 쓴 것**이라 실패가 아니라 표다 —
 * 임계는 `dict.test.ts` 의 래칫이 건다.
 */
export function authoringDebt(dict: Dict): DebtCheck[] {
  const essential = [...new Set([...dict.langs.values()].flatMap((m) => m.essential))]
    .filter((id) => dict.sources.has(id))
    .sort();
  const conceptsWithPoint = [...dict.sources.values()]
    .filter((c) => c.point.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id));

  // 「먼저 읽기」가 열릴 수 있는 개념 (D138 → **D150**). 처음에는 0장 후보(깊이 ≤ 2)뿐이었는데
  // D150 이 게이트를 「그 개념의 겹이 0」으로 넓혔다 — 이제 `essential` 은 전부 첫 만남에서
  // 한 줄이 펴지므로 깊이로 좁히면 **린트가 화면보다 좁아진다.** 좁으면 부채 표는 초록인데
  // 화면은 정답을 흘린다.
  const leakPool: string[] = [];
  for (const meta of dict.langs.values()) {
    for (const id of meta.essential) if (dict.sources.has(id)) leakPool.push(id);
  }
  leakPool.sort();

  const blankGaps: string[] = [];
  const whyGaps: string[] = [];
  for (const id of essential) {
    const concept = dict.sources.get(id) as SourceConcept;
    const { hasHole } = queryFacts(concept, dict);
    // 쿼리 없는 네임스페이스(`COMPUTED_NAMESPACES` — `exec/`·`proto/`·`cs/`)는 `@hole` 을
    // **가질 수 없다**: 뚫을 구멍이 있으려면 짚을 노드가 있어야 한다. 그래서 그쪽이
    // `essential` 로 들어오면 통과하는 길이 `no_hole_reason` 하나뿐이고, 그것이 맞다 —
    // 「아직 안 썼다」와 「이 층에는 구멍이 없다」를 사람이 한 줄로 갈라 적는 자리다 (D145 · D157).
    const filled = concept.blank.length > 0 && hasHole;
    if (!filled && concept.no_hole_reason === null) {
      blankGaps.push(`${id}(${concept.blank.length === 0 ? 'blank 없음' : '@hole 없음'})`);
    }
    if (concept.why_gate === undefined) whyGaps.push(id);
  }

  const pickGaps: string[] = [];
  for (const concept of conceptsWithPoint) {
    const n = queryFacts(concept, dict).picks.size;
    if (n < MIN_PICKS) pickGaps.push(`${concept.id}(${n})`);
  }

  const leakGaps: string[] = [];
  let leakTotal = 0;
  for (const id of leakPool) {
    const concept = dict.sources.get(id) as SourceConcept;
    const tokens = answerTokens(concept);
    if (tokens.size === 0) continue; // 짚을 정답이 없는 개념은 샐 것도 없다
    leakTotal += 1;
    const one = concept.dict.one_liner;
    const texts = [koOf(one), typeof one === 'string' ? '' : one.en ?? ''];
    const shown = [...tokens].filter((t) => texts.some((text) => revealsToken(text, t)));
    if (shown.length > 0) leakGaps.push(`${id}(${shown.join(' ')})`);
  }

  return [
    {
      rule: 'blank-or-reason',
      label: 'essential 에 blank+@hole 또는 no_hole_reason',
      met: essential.length - blankGaps.length,
      total: essential.length,
      gaps: blankGaps,
    },
    {
      rule: 'point-picks',
      label: `point 가 있으면 @pick.N ${MIN_PICKS}개 이상`,
      met: conceptsWithPoint.length - pickGaps.length,
      total: conceptsWithPoint.length,
      gaps: pickGaps,
    },
    {
      rule: 'why-gate',
      label: 'essential 에 why_gate',
      met: essential.length - whyGaps.length,
      total: essential.length,
      gaps: whyGaps,
    },
    {
      rule: 'zero-one-liner',
      label: '첫 만남에 펴는 one_liner 가 정답을 안 낸다 (D150)',
      met: leakTotal - leakGaps.length,
      total: leakTotal,
      gaps: leakGaps,
    },
  ];
}

/** 한글·한자는 두 칸을 먹는다. 표가 어긋나면 아무도 안 읽는다. */
const width = (text: string): number =>
  [...text].reduce((n, ch) => n + (/[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(ch) ? 2 : 1), 0);
const padEnd = (text: string, n: number): string => text + ' '.repeat(Math.max(0, n - width(text)));
const padStart = (text: string, n: number): string => ' '.repeat(Math.max(0, n - width(text))) + text;

/** 부채 표 한 판. 통과해도 찍는다 — 사람이 거리를 보는 자리가 그 표다. */
export function debtTable(checks: readonly DebtCheck[], ratchet: Readonly<Record<string, number>>): string {
  const label = Math.max(...checks.map((c) => width(c.label)), 24) + 2;
  const lines = [`${padEnd('사전 저작 부채 (D145)', label + 2)}충족/대상   남은   래칫  못 채운 것`];
  for (const c of checks) {
    const left = c.total - c.met;
    const gaps = c.gaps.length <= 4
      ? c.gaps.join(' · ')
      : `${c.gaps.slice(0, 4).join(' · ')} … +${c.gaps.length - 4}`;
    lines.push(
      `  ${padEnd(c.label, label)}${padStart(`${c.met}/${c.total}`, 7)}`
      + `${padStart(String(left), 7)}${padStart(String(ratchet[c.rule] ?? 0), 7)}  ${gaps || '없음'}`,
    );
  }
  return lines.join('\n');
}
