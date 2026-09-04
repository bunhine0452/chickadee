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

  const scms = concept.grammars
    .map((g) => dict.queries.get(keyOf(concept.id, g)))
    .filter((s): s is string => s !== undefined);
  const picks = new Set(scms.flatMap((s) => [...s.matchAll(/@(pick\.[1-9])/g)].map((m) => m[1] ?? '')));
  const hasHole = scms.some((s) => s.includes('@hole'));
  const ctxNames = new Set(
    scms.flatMap((s) => [...s.matchAll(/@ctx\.([a-z_]+)/g)].map((m) => `ctx.${m[1] ?? ''}`)),
  );

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
  // 사용처가 없는 보편·구조 개념(`common/`·`arch/`)은 짚을 코드가 없으므로 제외한다.
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
