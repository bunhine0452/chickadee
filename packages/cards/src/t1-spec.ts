/**
 * 3단계 스펙 카드 (04 §3.3). 원본이 사라지고 이것만 남는다.
 *
 * `mustHold` 출처 우선순위는 ①사용자 ②사전 ③AST 휴리스틱이고, **①이 있으면 ②③은 3개까지만**
 * 보탠다. 왜: 스펙을 전부 자동 생성하면 「무엇을 지키는지」를 앱이 대신 말해 능동 출력이
 * 사라진다 (§3.3 마지막 문장).
 *
 * ③을 AST 가 아니라 줄 텍스트의 정규식으로 뽑는다. 이유 둘 —
 *  1. `packages/cards` 는 `@chickadee/ipc-client` 를 import 할 수 없다 (01 §2 의존 방향,
 *     eslint 가 강제). `AstLite` 는 `store-sql` 이 타입만 재수출하므로 타입은 보이지만
 *     `parse_snippet` 을 부를 길이 없다.
 *  2. 후보 행(`block.candidates`)이 생성기까지 들고 오는 것은 블록 원문 줄이다 (D86 —
 *     새 의존은 없다). `block.ast_json` 을 함께 실어 오면 노드 → 줄 사상을 여기서 다시
 *     만들어야 하고, 그 사상이 틀리면 스펙 카드가 없는 줄을 짚는다.
 * 대신 뽑는 넷(외부 호출·지역 변수 수·반환 루트·조기 반환 수)은 전부 **행 모양**으로
 * 드러나는 것만 골랐다. 정규식이 놓치면 항목이 빠질 뿐 틀린 문장은 나오지 않는다.
 */
import { escapeHtml, isMissing, josa, render } from '@chickadee/text';
import type { Concept } from '@chickadee/dictionary';

import { signatureRange } from './t1-block.js';
import { keepKinds } from './t1-mask.js';
import type { BlockConcept, SpecCard } from './t1-types.js';

/** ①사용자 문장이 있을 때 ②③을 몇 개까지 보태는가 (04 §3.3). */
export const EXTRA_LIMIT = 3;

export interface SpecInput {
  lines: readonly string[];
  grammar: string;
  /** 블록 안에 걸린 개념. ②사전 층이 이들의 `dict.one_liner` 를 쓴다. */
  concepts: readonly BlockConcept[];
  /** 사전. 여기 없는 개념은 ② 층에서 빠진다. */
  dict: ReadonlyMap<string, Concept>;
  /** 2단계 통과 직후 사용자가 쓴 「이 함수가 지켜야 할 것」 2~4줄. */
  whyOwn?: readonly string[];
  /** 조각 카드의 「…이어서」 헤더. `SpecCard.header` 로 그대로 나간다. */
  header?: string;
  /** 리포 상대 경로. 사전 문장의 `{{file}}`·`{{file.base}}` 를 채운다. */
  path?: string;
}

type Hold = SpecCard['mustHold'][number];

/** 호출 이름으로 세지 않는 것 — 흐름 제어와 선언 키워드. */
const NOT_CALL = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'throw', 'do', 'else', 'try', 'with',
  'function', 'class', 'new', 'typeof', 'await', 'yield', 'delete', 'void', 'super', 'def',
  'fn', 'func', 'impl', 'match', 'print', 'lambda', 'elif', 'and', 'or', 'not', 'in', 'is',
]);

const identsOf = (text: string): string[] => text.match(/[A-Za-z_$][\w$]*/g) ?? [];

/**
 * 블록 안에서 이름이 묶이는 자리 전부 — 선언·시그니처 인자·화살표 인자.
 * 이 집합에 없는 호출 이름을 「외부 호출」로 본다 (import 된 것의 근사).
 */
function boundNames(lines: readonly string[]): Set<string> {
  const out = new Set<string>();
  const add = (text: string | undefined): void => {
    for (const name of identsOf(text ?? '')) out.add(name);
  };
  for (const line of lines) {
    // `const { submit, error } = …` · `let [a, b] = …` · `x := …`(go) · `x = …`(py 대입)
    const decl = /\b(?:const|let|var)\s+([^=]+?)\s*[=;:]/.exec(line);
    if (decl) add(decl[1]);
    const walrus = /^\s*([\w$,\s[\]{}]+?)\s*:?=[^=]/.exec(line);
    if (walrus) add(walrus[1]);
    // 선언 시그니처의 이름과 인자
    const sig = /\b(?:function|def|fn|func)\s+([\w$]+)\s*\(([^)]*)\)/.exec(line);
    if (sig) { add(sig[1]); add(sig[2]); }
    // 화살표 인자 — `(e) => …` · `e => …`
    for (const m of line.matchAll(/\(([^()]*)\)\s*=>/g)) add(m[1]);
    for (const m of line.matchAll(/(?:^|[^\w$.])([\w$]+)\s*=>/g)) add(m[1]);
  }
  return out;
}

/** 이 블록이 부르는 외부 이름. `a.b()` 같은 멤버 호출은 값 쪽에 매이므로 세지 않는다. */
function externalCalls(lines: readonly string[]): { names: string[]; anchor: number[] } {
  const bound = boundNames(lines);
  const seen = new Map<string, number>();
  for (const [i, line] of lines.entries()) {
    // 문자열·주석 안의 괄호까지 가려낼 수는 없다. 주석 줄은 미리 뺀다.
    if (/^\s*(\/\/|#|--|\*)/.test(line)) continue;
    for (const m of line.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) {
      const name = m[2] ?? '';
      if (NOT_CALL.has(name) || bound.has(name) || seen.has(name)) continue;
      seen.set(name, i);
    }
  }
  return { names: [...seen.keys()], anchor: [...seen.values()] };
}

/** 선언된 지역 변수(상태 포함)의 이름. `const [email, setEmail] = useState()` 는 둘이다. */
function locals(lines: readonly string[]): { names: string[]; anchor: number[] } {
  const names = new Set<string>();
  const anchor: number[] = [];
  for (const [i, line] of lines.entries()) {
    const decl = /\b(?:const|let|var)\s+([^=]+?)\s*=[^=]/.exec(line);
    if (!decl) continue;
    const before = names.size;
    for (const name of identsOf(decl[1] ?? '')) names.add(name);
    if (names.size > before) anchor.push(i);
  }
  return { names: [...names], anchor };
}

/** 반환 루트 요소 — `return (` 다음 줄이나 `return <X …>` 의 태그 이름. */
function returnRoot(
  lines: readonly string[],
  grammar: string,
): { tag: string; line: number } | null {
  const kinds = keepKinds(lines, grammar);
  for (const [i, line] of lines.entries()) {
    if (kinds[i] !== 'open') continue;
    const tag = /^\s*<([A-Za-z][\w.:-]*)/.exec(line);
    if (tag?.[1] !== undefined) return { tag: tag[1], line: i };
  }
  for (const [i, line] of lines.entries()) {
    const tag = /^\s*return\s*<([A-Za-z][\w.:-]*)/.exec(line);
    if (tag?.[1] !== undefined) return { tag: tag[1], line: i };
  }
  return null;
}

/** 한 줄 가드 — `if (…) return x` 처럼 조건과 반환이 같은 행에 있는 것. */
const GUARD_RETURN = /^\s*(if|else|unless|guard|when|match)\b.*\b(return|throw)\b/;

/**
 * 조기 반환 — 본문 최상위보다 깊은 자리의 `return`·`throw` 와 한 줄 가드. 마지막 반환은
 * 본문 최상위에 홀로 있으므로 둘 중 어느 쪽에도 걸리지 않는다.
 */
function earlyReturns(
  lines: readonly string[],
  grammar: string,
): { count: number; anchor: number[] } {
  const sig = signatureRange(lines, grammar);
  const bodyFrom = sig === null ? 0 : sig.end + 1;
  const body = lines.slice(bodyFrom);
  const base = body.find((l) => l.trim() !== '');
  if (base === undefined) return { count: 0, anchor: [] };
  const baseIndent = (/^\s*/.exec(base)?.[0] ?? '').length;
  const anchor: number[] = [];
  for (const [i, line] of body.entries()) {
    const deeper = /^\s*(return|throw)\b/.test(line)
      && (/^\s*/.exec(line)?.[0] ?? '').length > baseIndent;
    if (deeper || GUARD_RETURN.test(line)) anchor.push(bodyFrom + i);
  }
  return { count: anchor.length, anchor };
}

const code = (text: string): string => `<code>${escapeHtml(text)}</code>`;

/**
 * 조사만. `josa` 는 낱말 + 조사를 돌려주므로 낱말 길이만큼 잘라 낸다 — 여기서는 낱말이
 * 이미 `<code>` 로 감싸여 문장에 들어가 있고, 조사를 정하는 것은 그 안의 낱말이다.
 */
const particle = (word: string, withBatchim: string, without: string): string =>
  josa(word, withBatchim, without).slice(word.length);

/** ③AST 휴리스틱 넷. 근거가 없는 항목은 문장을 만들지 않는다. */
function astHolds(lines: readonly string[], grammar: string): Hold[] {
  const out: Hold[] = [];

  const calls = externalCalls(lines);
  if (calls.names.length > 0) {
    const last = calls.names[calls.names.length - 1] ?? '';
    const list = calls.names.map(code).join(' · ');
    out.push({
      text: `${list} ${particle(last, '을', '를')} 부른다`,
      source: 'ast',
      anchor: calls.anchor,
    });
  }

  const local = locals(lines);
  if (local.names.length > 0) {
    out.push({
      text: `지역 변수 ${local.names.length}개를 선언한다 — ${local.names.map(code).join(' · ')}`,
      source: 'ast',
      anchor: local.anchor,
    });
  }

  const root = returnRoot(lines, grammar);
  if (root) {
    out.push({
      // 조사는 태그 이름이 정한다 — `<form>` 의 마지막 글자는 `>` 라 받침을 못 센다.
      text: `${code(`<${root.tag}>`)} ${particle(root.tag, '을', '를')} 루트로 돌려준다`,
      source: 'ast',
      anchor: [root.line],
    });
  }

  const early = earlyReturns(lines, grammar);
  if (early.count > 0) {
    out.push({
      text: `조기 반환이 ${early.count}군데 있다`,
      source: 'ast',
      anchor: early.anchor,
    });
  }

  return out;
}

/** 개념의 토큰이 보이는 줄 색인. 토큰이 없거나 안 보이면 빈 배열이다. */
function anchorOf(lines: readonly string[], token: string | null): number[] {
  if (token === null || token === '') return [];
  const out: number[] = [];
  for (const [i, line] of lines.entries()) {
    if (line.includes(token)) out.push(i);
  }
  return out;
}

/**
 * ②사전 층 — 블록 안 개념의 `dict.one_liner`. D74 대로 **생성 시점에** 렌더한다.
 * 이 사용처에 없는 변수를 쓰는 문장은 그 항목만 빠진다 (`vars.ts` 의 `maybe` 와 같은 규칙).
 */
function dictHolds(input: SpecInput): Hold[] {
  const vars: Record<string, string> = {};
  if (input.path !== undefined) {
    vars['file'] = input.path;
    vars['file.base'] = input.path.slice(input.path.lastIndexOf('/') + 1);
  }
  const out: Hold[] = [];
  // 사전 `difficulty` 낮은 것부터 — 쉬운 것이 위에 오는 편이 스펙으로 읽기 낫다.
  const sorted = [...input.concepts].sort((a, b) => {
    const da = input.dict.get(a.conceptId)?.difficulty ?? 0;
    const db = input.dict.get(b.conceptId)?.difficulty ?? 0;
    return da - db || (a.conceptId < b.conceptId ? -1 : a.conceptId > b.conceptId ? 1 : 0);
  });
  for (const at of sorted) {
    const concept = input.dict.get(at.conceptId);
    if (!concept) continue;
    const rendered = render(concept.dict.one_liner, {
      ...vars, concept: concept.name.ko, ...(concept.token !== null ? { token: concept.token } : {}),
    });
    if (isMissing(rendered)) continue;
    out.push({ text: rendered.text, source: 'dict', anchor: anchorOf(input.lines, concept.token) });
  }
  return out;
}

export function buildSpec(input: SpecInput): SpecCard {
  const sig = signatureRange(input.lines, input.grammar);
  const signature = sig === null ? [] : input.lines.slice(sig.start, sig.end + 1);

  const own: Hold[] = (input.whyOwn ?? [])
    .map((t) => t.trim())
    .filter((t) => t !== '')
    // 사용자 문장은 짚을 줄이 없다 — 「이 함수가 지켜야 할 것」은 블록 전체에 걸린다.
    .map((text) => ({ text, source: 'user' as const, anchor: [] }));

  const extra = [...dictHolds(input), ...astHolds(input.lines, input.grammar)];
  const mustHold = [...own, ...(own.length > 0 ? extra.slice(0, EXTRA_LIMIT) : extra)];

  return {
    signature,
    ...(input.header !== undefined ? { header: input.header } : {}),
    mustHold,
  };
}
