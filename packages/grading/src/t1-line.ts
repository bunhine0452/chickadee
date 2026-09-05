/**
 * 한 짝의 정규화 파이프라인 (04 §4.2). **순서가 고정이다** — 표의 1~10단계를 그 순서로
 * 내려가며, 어느 단계에서 끝났는지가 곧 사유가 된다.
 *
 * 11단계(전역 치환)는 블록 전체를 봐야 하므로 여기 없다(`t1-rename.ts`). 여기서 나오는
 * `pending` 이 「자리마다 이름만 다르다 — 블록 전체에서 일관한지 아직 모른다」는 뜻이다.
 *
 * 거터(05 §8)도 이 함수를 쓴다. 그래서 여기에는 AST 도 IPC 도 없다 — 한 줄 < 0.2 ms 예산이
 * 걸린 자리다(04 §4.5).
 */
import { tokenize, type Tok } from '@chickadee/text';

import { meaningful, protectedAt } from './t1-prot.js';
import type { Reason, ReasonCode } from './t1-types.js';

/** 04 §4.2 를 내려간 결과. `pending` 은 11단계로 넘긴다는 뜻이다. */
export type LineStatus = 'exact' | 'equiv' | 'differ' | 'pending';

export interface LineCompare {
  status: LineStatus;
  reasons: Reason[];
  maps: [string, string][];
  /** 9단계에서 토큰 수가 달랐다 — AST 승격(04 §4.5)을 시도할 자리다. */
  astCandidate: boolean;
}

const reason = (code: ReasonCode, detail?: string): Reason =>
  detail === undefined ? { code } : { code, detail };

/**
 * 들여쓰기가 **블록 경계**인 문법 (D152 ⓑ · v06 `b-t1-indent`). 파이썬은 한 칸이 어긋나면
 * 다른 프로그램이라, 폭 차이를 사유로만 남기고 넘어가면 채점이 틀린 답을 맞다고 한다.
 * 나머지 문법에서는 중괄호가 경계를 지므로 폭은 보기의 문제이고 지금 규칙이 맞다.
 */
const INDENT_IS_STRUCTURE = new Set(['python']);

/** 그 문법에서 탭 하나가 공백 몇 칸인가. 파이썬은 PEP 8 을 따라 4다 (D152 ⓑ). */
const tabWidthOf = (grammar?: string): number =>
  (grammar !== undefined && INDENT_IS_STRUCTURE.has(grammar) ? 4 : 2);

/**
 * 들여쓰기 폭. 탭은 기본 2칸으로 센다 — 원본이 탭이고 답안이 공백일 때 폭만 다른 것으로 본다.
 * 파이썬은 4칸이다: 탭 하나를 공백 넷으로 적은 답안이 **같은 깊이**여야 하기 때문이고,
 * 2로 세면 탭 한 번이 공백 둘과 같아져 실제로 다른 깊이가 같다고 나온다.
 */
export function indentWidth(line: string, grammar?: string): number {
  const lead = /^[\t ]*/.exec(line)?.[0] ?? '';
  const tab = tabWidthOf(grammar);
  return [...lead].reduce((n, c) => n + (c === '\t' ? tab : 1), 0);
}

/** 주석 전용 줄인가 — 04 §4.2 2단계. 언어별 접두는 셋이면 충분하다(`//` `#` `--`). */
export function isCommentOnly(line: string): boolean {
  const t = line.trim();
  if (t === '') return false;
  return t.startsWith('//') || t.startsWith('#') || t.startsWith('--')
    || t.startsWith('/*') || t.startsWith('*');
}

/** 줄 끝 주석 제거 — 문자열 안의 `//` 는 `str` 토큰 안에 있어 안전하다 (04 §4.2 3단계). */
export function stripTrailingComment(line: string): { text: string; stripped: boolean } {
  const toks = tokenize(line);
  const at = toks.findIndex((t) => t.k === 'cmt');
  if (at < 0) return { text: line, stripped: false };
  const cut = (toks[at] as Tok).col;
  return { text: line.slice(0, cut).replace(/\s+$/, ''), stripped: true };
}

/**
 * 따옴표 정규화 (04 §4.2 7단계). `'…'` 와 `` `…` ``(`${` 없음) 를 `"…"` 로 바꾼다.
 * 보간이 든 템플릿은 **그대로 둔다** — 04 §4.5 ⓖ 가 템플릿과 연결을 다르다고 못박았고,
 * 여기서 따옴표로 바꿔 버리면 그 판정이 성립하지 않는다.
 */
export function normalizeQuotes(line: string): { text: string; changed: boolean } {
  let changed = false;
  let out = '';
  for (const tok of tokenize(line)) {
    const body = tok.t.slice(1, -1);
    // 안에 `"` 가 있으면 바꾸지 않는다 — `'say \"hi\"'` 를 `"say "hi""` 로 만들면 그 줄이
    // 통째로 다른 토큰 열이 되어, 원래 같았던 짝을 어긋남으로 만든다.
    const swappable = !body.includes('"') && tok.t.length >= 2;
    if (tok.k === 'str' && tok.t.startsWith("'") && swappable) {
      out += `"${body}"`;
      changed = true;
      continue;
    }
    if (tok.k === 'tpl' && !tok.t.includes('${') && swappable) {
      out += `"${body}"`;
      changed = true;
      continue;
    }
    out += tok.t;
  }
  return { text: out, changed };
}

/** 끝의 `;`·`,` 유무. 04 §4.2 6단계는 「다르면 둘 다 제거」다. */
const hasTerminator = (t: string): boolean => /[;,]$/.test(t);

/** 뜻이 있는 토큰의 문자열 열. 자리 비교와 「토큰 열이 같은가」가 이것을 본다. */
export const tokenText = (line: string): string[] => meaningful(tokenize(line)).map((t) => t.t);

/**
 * 04 §4.2 파이프라인 1~10단계.
 *
 * `prot` 는 원본 블록에서 미리 만든 PROT 집합이다(`buildProt`). 거터에서도 같은 집합을
 * 쓴다 — 줄마다 다시 만들면 한 줄 0.2 ms 예산을 못 지킨다.
 */
export function compareLine(
  o: string,
  u: string,
  prot: ReadonlySet<string>,
  grammar?: string,
): LineCompare {
  const reasons: Reason[] = [];
  const maps: [string, string][] = [];
  const none = { maps, astCandidate: false } as const;

  // 1 · 후행 공백
  const or = o.replace(/\s+$/, '');
  const ur = u.replace(/\s+$/, '');
  if (or === ur) return { status: 'exact', reasons, ...none };

  // 2 · 주석 줄
  const oc = isCommentOnly(o);
  const uc = isCommentOnly(u);
  if (oc && uc) return { status: 'equiv', reasons: [reason('COMMENT_TEXT')], ...none };
  if (oc !== uc) {
    return {
      status: 'differ',
      reasons: [reason(oc ? 'COMMENT_MISSING' : 'COMMENT_EXTRA')],
      ...none,
    };
  }

  // 3 · 줄 끝 주석
  const os = stripTrailingComment(or);
  const us = stripTrailingComment(ur);
  // 한쪽만 떼든 양쪽을 떼든, 뗀 뒤에 같아졌다면 다른 것은 줄 끝 주석뿐이었다.
  if (os.stripped || us.stripped) reasons.push(reason('TRAILING_COMMENT'));
  if (os.text === us.text) return { status: 'equiv', reasons, ...none };

  // 4 · 빈 줄 — 여기서 끝난다(양쪽 다 비었으면 1단계가 이미 잡았다).
  const oBlank = os.text.trim() === '';
  const uBlank = us.text.trim() === '';
  if (oBlank && uBlank) return { status: 'exact', reasons, ...none };
  if (oBlank || uBlank) {
    return { status: 'differ', reasons: [reason('BLANK_MISMATCH')], ...none };
  }

  // 5 · 들여쓰기 — 사유만 남기고 계속한다. 다만 들여쓰기가 블록 경계인 문법에서는
  //     **깊이가 다르면 다른 프로그램**이라 여기서 끝난다 (D152 ⓑ). 탭·공백은 그 전에
  //     같은 자로 재므로(`indentWidth`) 「탭이냐 공백이냐」만 다른 답안은 여기 안 걸린다.
  const oIndent = indentWidth(os.text, grammar);
  const uIndent = indentWidth(us.text, grammar);
  if (oIndent !== uIndent) {
    if (grammar !== undefined && INDENT_IS_STRUCTURE.has(grammar)) {
      return {
        status: 'differ',
        reasons: [...reasons, reason('INDENT', `${oIndent} ↔ ${uIndent}`)],
        ...none,
      };
    }
    reasons.push(reason('INDENT'));
  }

  let a = os.text.trim();
  let b = us.text.trim();

  // 6 · 종결자
  if (hasTerminator(a) !== hasTerminator(b)) {
    a = a.replace(/[;,]$/, '');
    b = b.replace(/[;,]$/, '');
    reasons.push(reason('TERMINATOR'));
  }

  // 7 · 따옴표
  const qa = normalizeQuotes(a);
  const qb = normalizeQuotes(b);
  if (qa.changed || qb.changed) {
    const before = tokenText(a).join(' ') === tokenText(b).join(' ');
    a = qa.text;
    b = qb.text;
    // 따옴표를 바꾼 **뒤에** 같아졌을 때만 그것이 사유다. 원래 같았으면 공백 차이다.
    if (!before && tokenText(a).join(' ') === tokenText(b).join(' ')) reasons.push(reason('QUOTE'));
  }

  const ta = meaningful(tokenize(a));
  const tb = meaningful(tokenize(b));

  // 8 · 토큰 열
  if (ta.map((t) => t.t).join(' ') === tb.map((t) => t.t).join(' ')) {
    return {
      status: 'equiv',
      reasons: reasons.length > 0 ? reasons : [reason('WHITESPACE')],
      ...none,
    };
  }

  // 9 · 토큰 수 — 다르면 AST 승격을 시도할 자리다(04 §4.5). 승격이 실패하면 이 사유가 남는다.
  if (ta.length !== tb.length) {
    return {
      status: 'differ',
      reasons: [...reasons, reason('TOKEN_COUNT', `${ta.length} ↔ ${tb.length}`)],
      maps,
      astCandidate: true,
    };
  }

  // 10 · 자리별 비교
  for (let i = 0; i < ta.length; i += 1) {
    const x = ta[i] as Tok;
    const y = tb[i] as Tok;
    if (x.t === y.t) continue;
    if (protectedAt(ta, i, prot) || protectedAt(tb, i, prot)) {
      return {
        status: 'differ',
        reasons: [...reasons, reason('TOKEN_MISMATCH', `${x.t} ↔ ${y.t}`)],
        maps: [],
        astCandidate: true,
      };
    }
    maps.push([x.t, y.t]);
  }

  return { status: 'pending', reasons, maps, astCandidate: false };
}

// ───────── 닮음 (04 §4.1 `sim`) ─────────

/** 따옴표만 다른 것을 같게 보는 토큰 bag. 정렬은 이 bag 의 Dice 계수로 판정한다. */
const simTokens = (line: string): string[] => tokenText(normalizeQuotes(line).text);

/**
 * Dice 계수 (04 §4.1). 빈 줄끼리는 1, 빈 줄과 비공백은 0 — 정렬이 빈 줄을 잃지 않게 하는
 * 규칙이고 목업과 같다.
 *
 * **주석 줄끼리도 1이다.** 04 §4.2 2단계가 주석 문구를 「비교하지 않는다」고 정했으므로
 * 그 문구가 정렬을 좌우해서도 안 된다 — 한국어 주석을 영어로 옮긴 답안(04 §9 #9)은 토큰이
 * 거의 안 겹쳐 Dice 가 0.4 를 못 넘고, 그러면 짝이 안 지어져 `equiv COMMENT_TEXT` 가
 * 영영 나오지 않는다. 창 ±2 가 엉뚱한 주석과 붙는 것을 막는다.
 */
export function sim(a: string, b: string): number {
  const aBlank = a.trim() === '';
  const bBlank = b.trim() === '';
  if (aBlank && bBlank) return 1;
  if (aBlank || bBlank) return 0;
  const aCmt = isCommentOnly(a);
  const bCmt = isCommentOnly(b);
  if (aCmt && bCmt) return 1;
  if (aCmt || bCmt) return 0;
  const x = simTokens(a);
  const y = simTokens(b);
  if (x.length === 0 || y.length === 0) return 0;
  const used = new Array<boolean>(y.length).fill(false);
  let match = 0;
  for (const t of x) {
    for (let i = 0; i < y.length; i += 1) {
      if (!used[i] && y[i] === t) {
        used[i] = true;
        match += 1;
        break;
      }
    }
  }
  return (2 * match) / (x.length + y.length);
}

// ───────── 거터 (05 §8 · 04 §4 머리말) ─────────

/** 타이핑 중 한 줄 판정이 보는 창. 원본 `i−3 … i+3` 만 본다 (04 §4 머리말). */
export const GUTTER_WINDOW = 3;

/**
 * 줄을 벗어날 때 그 줄만 판정한다 (05 §8). 원본의 어느 줄과도 맞지 않으면 `differ` 다.
 *
 * `pending` 을 `equiv` 로 낙관하는 이유: 전역 치환은 블록 전체가 있어야 판정되고 타이핑
 * 중에는 아직 없다. 여기서 `differ` 로 칠하면 이름을 바꿔 쓰는 사람의 거터가 통째로
 * 황갈색이 되어 「틀렸다」로 읽힌다 — 채점이 그때 다시 판정한다.
 */
export function evalLine(
  index: number,
  text: string,
  original: readonly string[],
  prot: ReadonlySet<string>,
  grammar?: string,
): 'exact' | 'equiv' | 'differ' | '' {
  if (text.trim() === '') return '';
  let best: 'equiv' | 'differ' = 'differ';
  const from = Math.max(0, index - GUTTER_WINDOW);
  const to = Math.min(original.length - 1, index + GUTTER_WINDOW);
  for (let j = from; j <= to; j += 1) {
    const r = compareLine(original[j] as string, text, prot, grammar);
    if (r.status === 'exact') return 'exact';
    if (r.status === 'equiv' || r.status === 'pending') best = 'equiv';
  }
  return best;
}
