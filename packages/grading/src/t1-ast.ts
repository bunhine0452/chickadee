/**
 * AST 동등 판정 승격 (04 §4.5).
 *
 * 정규식층이 `differ` 로 끝낸 자리에서 **문장 단위로** 다시 본다. 줄이 아니라 문장인 이유는
 * 줄 나눔이 뜻을 바꾸지 않기 때문이다 — `return (` + `<form>` 두 줄과 `return <form>` 한 줄은
 * 같은 문장이고, 줄로 비교하면 영원히 다르다.
 *
 * **파싱은 여기서 하지 않는다.** 원본 AST 는 `block.ast_json` 캐시이고 답안 AST 는 채점
 * 시점에 앱이 `parse_snippet` 을 한 번 불러 넘긴다(04 §4.5 · D87). 그래서 이 패키지는
 * 여전히 IPC 를 모르고, 이 함수는 동기다.
 */
import type { AstLite } from '@chickadee/ipc-client';

import type { Reason, T1Row } from './t1-types.js';

/** 04 §4.5 — 답안 AST 의 `ERROR` 비율이 이 값을 넘으면 승격하지 않는다. */
export const ERROR_RATIO_LIMIT = 0.2;
/** 한 묶음이 덮는 최대 행 수 (04 §4.5). */
export const MAX_RUN_LINES = 8;

/** 04 §4.5 성공 사유의 세부. */
export type AstDetail = 'PAREN' | 'BLOCK' | 'ARROW_PARENS' | 'LINE_BREAK';

/** 속성·타입 자리의 식별자 — 이름을 바꿀 수 없으므로 α-변환에서 제외한다. */
const FIXED_IDENT_KINDS = new Set([
  'property_identifier', 'shorthand_property_identifier', 'shorthand_property_identifier_pattern',
  'field_identifier', 'type_identifier', 'predefined_type', 'jsx_attribute_name',
  'attribute_name', 'label_name', 'package_identifier', 'namespace_identifier',
]);

/** 자유 식별자 노드 종류 — 여기 것만 §4.3 맵으로 치환한다. */
const FREE_IDENT_KINDS = new Set(['identifier', 'variable_name', 'name']);

/** ⓒ 언랩 대상 — 자식 하나만 감싼 괄호. */
const PAREN_KINDS = new Set(['parenthesized_expression', 'parenthesized_type', 'parenthesized']);

/** ⓔ 매개변수 한 겹 — typescript 문법이 `(x)` 를 이렇게 싼다. */
const PARAM_KINDS = new Set(['required_parameter', 'optional_parameter', 'parameter']);

/** ⓒ 버릴 후행 구두점. 줄 나눔·종결자는 뜻이 아니다. */
const DROPPED_PUNCT = new Set([';', ',']);

export interface AstPair {
  /** 원본 블록의 AST — `block.ast_json` 캐시 (D14). */
  original: AstLite;
  /** 원본 블록의 원문. 바이트 오프셋을 행으로 옮기는 데 쓴다. */
  originalText: readonly string[];
  /** 답안 AST — 채점 시 `parse_snippet` 1회. */
  user: AstLite;
  userText: readonly string[];
}

export interface PromoteInput extends AstPair {
  /** 정규식층이 낸 행들. `exact` 행이 묶음의 경계를 만든다. */
  rows: readonly T1Row[];
  /** 04 §4.3 이 **받아들인** 치환 맵(a → b). 원본 쪽 자유 식별자에 적용한다. */
  accepted: ReadonlyMap<string, string>;
  /** 치환 불가 이름 (04 §4.4). */
  prot: ReadonlySet<string>;
}

/**
 * 한 묶음의 승격 결과.
 *
 * `promoted === false` 는 **정규식 결과를 유지한다**는 뜻이고(04 §4.5), `reasons` 만 더한다 —
 * `PARSE_ERROR`·`TEMPLATE_VS_CONCAT` 이 그 자리다.
 */
export interface AstOutcome {
  promoted: boolean;
  reasons: Reason[];
  /** 승격이 삼킨 답안 줄 — 문장이 여러 줄로 나뉘어 `extra` 로 남았던 것들. */
  absorbed: number[];
}

/** 승격 게이트. 04 §4.5 의 「양쪽 AST 가 있고 답안 ERROR 비율 ≤ 20 %」를 본다. */
export function canPromote(user: AstLite): boolean {
  const { total, errors } = countNodes(user);
  return total > 0 && errors / total <= ERROR_RATIO_LIMIT;
}

function countNodes(node: AstLite): { total: number; errors: number } {
  let total = 1;
  let errors = node.kind === 'ERROR' || node.kind === 'MISSING' ? 1 : 0;
  for (const child of node.children) {
    const sub = countNodes(child);
    total += sub.total;
    errors += sub.errors;
  }
  return { total, errors };
}

/**
 * `differ`·`missing` 행 묶음을 문장 단위로 다시 본다. 같으면 그 묶음이 덮은 **행 전부**가
 * `equiv` 다.
 */
export function promote(input: PromoteInput): Map<number, AstOutcome> {
  const out = new Map<number, AstOutcome>();
  if (!canPromote(input.user)) return out;

  const oLines = lineStarts(input.originalText);
  const uLines = lineStarts(input.userText);

  for (const run of runsOf(input.rows)) {
    const oFrom = run[0]?.oi ?? -1;
    const oTo = run[run.length - 1]?.oi ?? -1;
    const paired = run.filter((r) => r.ui >= 0).map((r) => r.ui);
    if (oFrom < 0 || paired.length === 0) continue;

    const o = cover(input.original, oLines, oFrom, oTo);
    const u = cover(input.user, uLines, Math.min(...paired), Math.max(...paired));
    if (o.nodes.length === 0 || u.nodes.length === 0) continue;

    const absorbed: number[] = [];
    for (let line = u.from; line <= u.to; line += 1) {
      if (!paired.includes(line)) absorbed.push(line);
    }

    // ERROR 노드가 덮인 행에 있으면 사유만 더하고 정규식 결과를 유지한다 (04 §4.5).
    if (hasError(u.nodes)) {
      for (const row of run) out.set(row.oi, { promoted: false, reasons: [{ code: 'PARSE_ERROR' }], absorbed: [] });
      continue;
    }

    const oSeq = sequence(o.nodes, input.accepted, input.prot);
    const uSeq = sequence(u.nodes, new Map(), input.prot);
    if (oSeq.join(' ') !== uSeq.join(' ')) {
      if (templateVersusConcat(o.nodes, u.nodes)) {
        for (const row of run) {
          out.set(row.oi, { promoted: false, reasons: [{ code: 'TEMPLATE_VS_CONCAT' }], absorbed: [] });
        }
      }
      continue;
    }

    const detail = detailOf(o, u);
    for (const row of run) {
      out.set(row.oi, { promoted: true, reasons: [{ code: 'AST_EQUIV', detail }], absorbed });
    }
  }

  return out;
}

/**
 * 템플릿 리터럴 ↔ 문자열 연결인가 (04 §4.5 ⓖ). **언제나 다름**이지만 사유가 다르다 —
 * 「자동으로 같음을 증명할 수 없다」가 아니라 「뜻이 다르다」이고, 그 구별이 이의 루프에서
 * 「절대 동등이 될 수 없는 목록」(04 §5)의 근거가 된다.
 */
export function templateVersusConcat(a: readonly AstLite[], b: readonly AstLite[]): boolean {
  const tplA = anyKind(a, 'template_string');
  const tplB = anyKind(b, 'template_string');
  const catA = anyKind(a, 'binary_expression');
  const catB = anyKind(b, 'binary_expression');
  return (tplA && !tplB && catB) || (tplB && !tplA && catA);
}

const anyKind = (nodes: readonly AstLite[], kind: string): boolean =>
  nodes.some((n) => hasKind(n, kind));

function hasKind(node: AstLite, kind: string): boolean {
  if (node.kind === kind) return true;
  return node.children.some((c) => hasKind(c, kind));
}

const hasError = (nodes: readonly AstLite[]): boolean =>
  nodes.some((n) => countNodes(n).errors > 0);

/** 무엇이 달랐길래 같아졌나 — 화면에 그대로 보이는 세부다. */
function detailOf(o: Covered, u: Covered): AstDetail {
  if (o.to - o.from !== u.to - u.from) return 'LINE_BREAK';
  if (anyKind(o.nodes, 'statement_block') !== anyKind(u.nodes, 'statement_block')) return 'BLOCK';
  if (paren(o.nodes) !== paren(u.nodes)) return 'PAREN';
  if (anyKind(o.nodes, 'formal_parameters') !== anyKind(u.nodes, 'formal_parameters')) {
    return 'ARROW_PARENS';
  }
  return 'LINE_BREAK';
}

const paren = (nodes: readonly AstLite[]): boolean =>
  nodes.some((n) => [...PAREN_KINDS].some((k) => hasKind(n, k)));

/** `exact` 가 아닌 행이 이어진 묶음. 8행을 넘으면 자른다 (04 §4.5). */
export function runsOf(rows: readonly T1Row[]): T1Row[][] {
  const runs: T1Row[][] = [];
  let current: T1Row[] = [];
  for (const row of rows) {
    if (row.status === 'exact' || row.status === 'equiv' || row.oi < 0) {
      if (current.length > 0) runs.push(current);
      current = [];
      continue;
    }
    current.push(row);
    if (current.length === MAX_RUN_LINES) {
      runs.push(current);
      current = [];
    }
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

/**
 * 줄 시작 바이트 오프셋 표. `AstLite.start/end` 가 바이트라 이것 없이는 행으로 옮길 수 없다
 * (04 §4.5). 한국어 주석이 든 블록에서 글자 수로 세면 오프셋이 통째로 밀린다.
 */
export function lineStarts(lines: readonly string[]): number[] {
  const encoder = new TextEncoder();
  const out: number[] = [0];
  let at = 0;
  for (const line of lines) {
    at += encoder.encode(line).length + 1; // 개행 1바이트
    out.push(at);
  }
  return out;
}

/** 바이트 오프셋 → 0-based 행. */
export function lineAt(starts: readonly number[], byte: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((starts[mid] as number) <= byte) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** 구간을 덮는 문장들과 그 문장들이 실제로 차지한 행 범위. */
export interface Covered {
  nodes: AstLite[];
  from: number;
  to: number;
}

/**
 * `from..to` 행을 덮는 **가장 큰** 노드들. 부모가 구간 밖으로 새면 자식들로 내려가고,
 * 구간에 걸친 문장이 구간보다 길면 **구간을 그 문장까지 넓힌다**.
 *
 * 넓히는 것이 요점이다: `if err != nil { return err }` 한 줄을 세 줄로 나눠 쓴 답안에서
 * 어긋난 행은 첫 줄뿐인데, 그 줄만 덮는 노드는 조건식(`err != nil`)이라 원본의 `if` 문과
 * 비교할 수가 없다. 04 §4.5 의 비교 단위가 「줄이 아니라 문장」인 것이 이 뜻이다.
 *
 * 노드 종류 이름 표를 쓰지 않는 이유는 문법마다 그 이름이 다르고(`lexical_declaration` ·
 * `short_var_declaration` · `let_declaration`), 표를 쓰면 새 문법이 조용히 승격을 잃는다.
 */
export function cover(
  root: AstLite,
  starts: readonly number[],
  from: number,
  to: number,
): Covered {
  let lo = from;
  let hi = to;
  let nodes: AstLite[] = [];

  // 구간을 넓히면 더 큰 문장이 들어올 수 있으므로 고정점까지 돈다. 블록 하나가 40줄
  // 상한이라 반복은 몇 번에 끝난다.
  for (let round = 0; round < MAX_RUN_LINES + 2; round += 1) {
    nodes = [];
    let grew = false;
    const walk = (node: AstLite): void => {
      const a = lineAt(starts, node.start);
      const b = lineAt(starts, Math.max(node.start, node.end - 1));
      if (b < lo || a > hi) return;
      if (!node.named) {
        for (const child of node.children) walk(child);
        return;
      }
      if (a >= lo && b <= hi) {
        nodes.push(node);
        return;
      }
      // 구간을 **감싸는** 노드(함수·블록)는 넓히지 않고 안으로 들어간다. 넓히면 블록 통째
      // 비교가 되어 04 §4.6 이 버린 「AST 동일성 한 판」이 된다.
      const encloses = a < lo && b > hi;
      // 구간 안에서 **시작해 밖으로 나가거나**, 밖에서 시작해 구간 안에서 끝나는 문장 —
      // 그것이 여러 줄로 나뉜 문장이다. 그 문장까지 구간을 넓힌다.
      if (!encloses && node !== root && isStatementish(node)) {
        if (a < lo) {
          lo = a;
          grew = true;
        }
        if (b > hi) {
          hi = b;
          grew = true;
        }
        return;
      }
      for (const child of node.children) walk(child);
    };
    walk(root);
    if (!grew) break;
  }

  return { nodes, from: lo, to: hi };
}

/**
 * 문장으로 볼 만한 노드인가 — 구간을 넓힐 자격이다. 이름 표를 완전히 피할 수 없는 유일한
 * 자리다: 넓히기를 아무 노드에나 허용하면 표현식 하나가 블록 전체를 삼킨다. 접미사로
 * 판정해 문법을 늘려도 대체로 맞게 둔다.
 */
function isStatementish(node: AstLite): boolean {
  return /(_statement|_declaration|_definition|_item|_clause|_expression|_element|_block)$/
    .test(node.kind) || node.kind === 'block' || node.kind === 'statement';
}

/**
 * 정규화 노드열 — 전위 순회, 노드 `kind` + 잎 텍스트 (04 §4.5).
 *
 * ⓐ 자유 식별자는 §4.3 이 받아들인 맵으로 치환한다. **독립 α-번호를 매기지 않는다** —
 *   양쪽에 각자 번호를 매기면 「한 줄만 이름을 바꾼」 답안도 같은 열이 되어 §4.3 의 검증
 *   ④가 무의미해진다. 맵을 쓰면 §4.3 이 거부한 치환은 여기서도 다른 이름으로 남는다.
 * ⓑ 문자열 리터럴은 따옴표만 정규화하고 내용은 그대로 둔다.
 * ⓒ 후행 `;`·`,` 와 자식 하나짜리 괄호를 버린다.
 * ⓓ 문장 하나짜리 `statement_block` 은 그 문장으로 읽는다.
 * ⓔ 단일 매개변수 `formal_parameters` 는 그 식별자로 읽는다.
 * ⓕ 줄 나눔은 애초에 열에 들어가지 않는다(행 정보는 결과 표시에만).
 * ⓗ 연산자·인자 순서·`await`·`?.`·리터럴 값은 잎 텍스트로 그대로 남으므로 언제나 다르다.
 */
export function sequence(
  nodes: readonly AstLite[],
  accepted: ReadonlyMap<string, string>,
  prot: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (const node of nodes) emit(node, accepted, prot, out);
  return out;
}

function emit(
  node: AstLite,
  accepted: ReadonlyMap<string, string>,
  prot: ReadonlySet<string>,
  out: string[],
): void {
  // ⓒ 후행 구두점
  if (node.children.length === 0 && node.text !== undefined && DROPPED_PUNCT.has(node.text)) return;
  // 이름 없는 잎 중 순수 구두점은 뜻이 아니다 — 연산자는 이름 없는 잎이지만 뜻이므로 남는다.
  if (!node.named && node.children.length === 0 && node.text !== undefined
    && /^[()[\]{}]$/.test(node.text)) {
    return;
  }

  const unwrapped = unwrap(node);
  if (unwrapped !== null) {
    emit(unwrapped, accepted, prot, out);
    return;
  }

  if (node.children.length === 0) {
    out.push(`${node.kind}:${leafText(node, accepted, prot)}`);
    return;
  }
  out.push(node.kind);
  for (const child of node.children) emit(child, accepted, prot, out);
}

/** ⓒⓓⓔ — 뜻을 바꾸지 않는 껍데기 하나를 벗긴다. 벗길 것이 없으면 `null`. */
function unwrap(node: AstLite): AstLite | null {
  const named = node.children.filter((c) => c.named);
  if (PAREN_KINDS.has(node.kind) && named.length === 1) return named[0] as AstLite;
  if (node.kind === 'statement_block' && named.length === 1) return named[0] as AstLite;
  if (node.kind === 'block' && named.length === 1) return named[0] as AstLite;
  // ⓔ 단일 매개변수 화살표 — `x =>` 와 `(x) =>` 를 같게 본다. **typescript 문법은 괄호 안을
  // `required_parameter` 로 한 겹 더 싼다**(javascript 는 `identifier` 직접) — 종류를 못박으면
  // 그 한 겹 때문에 04 §9 #19 가 통과하지 않는다. 그래서 「자식이 하나면 벗긴다」로 둔다.
  if (node.kind === 'formal_parameters' && named.length === 1) return named[0] as AstLite;
  if (PARAM_KINDS.has(node.kind) && named.length === 1) return named[0] as AstLite;
  if (node.kind === 'expression_statement' && named.length === 1) return named[0] as AstLite;
  return null;
}

function leafText(
  node: AstLite,
  accepted: ReadonlyMap<string, string>,
  prot: ReadonlySet<string>,
): string {
  const text = node.text ?? '';
  // ⓑ 문자열 리터럴 — 따옴표만 정규화한다.
  if (/^['"`]/.test(text) && text.length >= 2 && !text.includes('${')) {
    return `"${text.slice(1, -1)}"`;
  }
  // ⓐ 자유 식별자 — 받아들인 치환만 적용한다.
  if (FREE_IDENT_KINDS.has(node.kind) && !FIXED_IDENT_KINDS.has(node.kind) && !prot.has(text)) {
    return accepted.get(text) ?? text;
  }
  return text;
}
