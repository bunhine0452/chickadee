/**
 * 2단계 마스크 — 유지 집합 (04 §3.2).
 *
 *   stage 1  전부 보임
 *   stage 2  아래 유지 집합만 잉크, 나머지는 들여쓰기 유지 + 자리표
 *   stage 3  스펙 카드만 (`t1-spec.ts`)
 *
 * 04 §3.2 표의 다섯 종(주석 줄 · 빈 줄 · 시그니처 · 구조 여는 줄 · 닫힘 줄)을 언어별로
 * 옮긴 것이다. 표의 마지막 열 「폴백(정규식)」은 모르는 문법에 그대로 쓴다 — `file.grammar`
 * 는 nullable TEXT 라 이 길이 늘 열려 있어야 한다.
 *
 * **왜 정규식인가**: 이 판정은 화면이 줄마다 부르는 것이고(05 ClonePad 거터), 원본 AST 는
 * `block.ast_json` 에 있으나 `BlockCandidate` 는 원문 줄만 들고 온다. 줄 단위 판정에
 * AST 를 끌어오면 블록마다 노드 → 줄 사상을 다시 만들어야 하고, 그 사상이 틀리면 화면이
 * 엉뚱한 줄을 지운다. 표 자체가 「행」 단위로 쓰여 있으므로 행으로 판정한다.
 */

/** 04 §3.2 표의 「유지 종류」 다섯. `null` 은 자리표로 지워지는 줄이다. */
export type KeepKind = 'comment' | 'blank' | 'signature' | 'open' | 'close';

interface MaskRules {
  comment: RegExp;
  /** 시그니처. 중첩 함수도 잡히도록 `^\s*` 로 시작한다 — 열 0 에 묶지 않는다. */
  signature: readonly RegExp[];
  /** 구조 여는 줄. 04 §3.2 표에서 ts 만 채워져 있다. */
  open: readonly RegExp[];
  close: readonly RegExp[];
  /** `return (` 다음 줄의 최상위 JSX 루트 여는 태그를 유지한다 (ts 열). */
  jsxRoot: boolean;
  /** docstring 을 주석으로 센다 (py 열). */
  docstring: boolean;
}

/** 04 §3.2 표의 폴백 닫힘 정규식. 문서에 적힌 문자 집합 그대로다. */
const FALLBACK_CLOSE = /^\s*[)\]}<>/;,\s]+$/;
/** 여러 행에 걸친 `return (`. 표의 「구조 여는 줄」 ts·폴백 칸. */
const RETURN_OPEN = /^\s*return\s*\(\s*$/;
/** 닫는 JSX 태그만 있는 행 — `</form>` `</Form.Item>;`. 폴백 정규식은 글자를 못 넘긴다. */
const JSX_CLOSE = /^\s*<\/[A-Za-z][\w.:-]*>[\s;,)\]}]*$/;
/** 여는 JSX 태그만 있는 행. 자기 닫힘(`/>`)은 루트가 아니라 잎이므로 뺀다. */
const JSX_OPEN = /^\s*<(>|[A-Za-z][\w.:-]*(\s[^>]*[^/])?>)\s*$/;

/** 흐름 제어 키워드. `if (x) {` 이 메서드 시그니처로 잡히는 것을 막는다. */
const NOT_METHOD = '(?!(if|for|while|switch|catch|else|do|try|return|with|using)\\b)';

const TS: MaskRules = {
  comment: /^\s*(\/\/|\/\*|\*\/|\*(\s|$))/,
  signature: [
    // `function` 선언 (+ `export`·`default`·`async`), `class` 선언
    /^\s*(export\s+)?(default\s+)?(async\s+)?function\b/,
    /^\s*(export\s+)?(default\s+)?(declare\s+)?(abstract\s+)?class\b/,
    // 값이 화살표 함수인 `lexical_declaration` — `=>` 가 같은 행에 있어야 한다
    /^\s*(export\s+)?(const|let|var)\s+[\w$]+[^=]*=\s*(async\s+)?(function\b|\([^)]*\)\s*(:[^=]*)?=>)/,
    // `method_definition` — 수식어 뒤 이름·인자·본문 `{` 로 끝나는 행
    new RegExp(
      `^\\s*((public|private|protected|readonly|static|abstract|async|get|set|override)\\s+)*`
      + `\\*?\\s*${NOT_METHOD}[\\w$]+\\s*(<[^>]*>)?\\s*\\([^)]*\\)\\s*(:\\s*[^{]*)?\\{\\s*$`,
    ),
  ],
  open: [RETURN_OPEN],
  close: [FALLBACK_CLOSE, JSX_CLOSE],
  jsxRoot: true,
  docstring: false,
};

const PY: MaskRules = {
  comment: /^\s*#/,
  signature: [/^\s*(async\s+)?def\b/, /^\s*class\b/, /^\s*@/],
  // 표의 py 칸은 「구조 여는 줄」·「닫힘 줄」 둘 다 비어 있다 — 들여쓰기가 구조다.
  open: [],
  close: [],
  jsxRoot: false,
  docstring: true,
};

const GO: MaskRules = {
  comment: /^\s*(\/\/|\/\*|\*\/)/,
  signature: [/^\s*func\b/],
  open: [],
  close: [/^\s*\}[\s;,)\]}]*$/],
  jsxRoot: false,
  docstring: false,
};

const RS: MaskRules = {
  comment: /^\s*(\/\/|\/\*|\*\/)/,
  signature: [
    /^\s*(pub(\([^)]*\))?\s+)?(default\s+)?(async\s+)?(const\s+)?(unsafe\s+)?(extern\s+"[^"]*"\s+)?fn\b/,
    /^\s*(unsafe\s+)?impl\b/,
    /^\s*#!?\[/,
  ],
  open: [],
  close: [/^\s*\}[\s;,)\]}]*$/],
  jsxRoot: false,
  docstring: false,
};

const FALLBACK: MaskRules = {
  comment: /^\s*(\/\/|#|--)/,
  signature: [/^\s*(export\s+)?(pub\s+)?(async\s+)?(function|def|func|fn|class|impl)\b/],
  open: [RETURN_OPEN],
  close: [FALLBACK_CLOSE],
  jsxRoot: false,
  docstring: false,
};

/**
 * 04 §3.2 표의 첫 열은 `ts/js(x)` 한 칸이다 — 네 문법을 한 규칙으로 둔다. `.tsx` 파일의
 * 블록에 `typescript` 문법 키가 붙어 오는 일이 있으므로(사전 `extensions` 는 확장자로
 * 문법을 고르지만 `file.grammar` 는 리포마다 다르게 채워질 수 있다) JSX 규칙을 넷 다 켠다.
 */
function rulesFor(grammar: string): MaskRules {
  switch (grammar) {
    case 'typescript': case 'tsx': case 'javascript': case 'jsx':
      return TS;
    case 'python': return PY;
    case 'go': return GO;
    case 'rust': return RS;
    default: return FALLBACK;
  }
}

const matchesAny = (line: string, res: readonly RegExp[]): boolean => res.some((re) => re.test(line));

/**
 * 줄마다 유지 종류, 지워질 줄은 `null`. `keepSet` 이 이것을 걸러 색인만 낸다.
 *
 * 한 번에 훑는다 — docstring 여닫이와 「`return (` 바로 다음 줄」은 앞 줄의 결과에
 * 기대므로 줄 하나만 떼어 판정할 수 없다.
 */
export function keepKinds(lines: readonly string[], grammar: string): (KeepKind | null)[] {
  const rules = rulesFor(grammar);
  const out: (KeepKind | null)[] = [];
  let inDoc = false;
  let prevOpen = false;

  for (const raw of lines) {
    const line = raw;
    let kind: KeepKind | null = null;

    if (rules.docstring) {
      // 삼중 따옴표의 홀짝으로 여닫는다. 코드 한가운데의 삼중 따옴표 리터럴은 잘못 셀 수
      // 있으나, docstring 이 아닌 삼중 따옴표는 py 블록에서 드물다.
      const quotes = (line.match(/"""|'''/g) ?? []).length;
      if (inDoc) {
        if (quotes % 2 === 1) inDoc = false;
        out.push('comment');
        prevOpen = false;
        continue;
      }
      if (quotes > 0) {
        if (quotes % 2 === 1) inDoc = true;
        out.push('comment');
        prevOpen = false;
        continue;
      }
    }

    if (line.trim() === '') kind = 'blank';
    else if (rules.comment.test(line)) kind = 'comment';
    else if (matchesAny(line, rules.signature)) kind = 'signature';
    else if (matchesAny(line, rules.open)) kind = 'open';
    else if (rules.jsxRoot && prevOpen && JSX_OPEN.test(line)) kind = 'open';
    else if (matchesAny(line, rules.close)) kind = 'close';

    out.push(kind);
    prevOpen = kind === 'open';
  }
  return out;
}

/** `payload.show2` — 2단계에 잉크로 남는 **0-based** 줄 색인, 오름차순. */
export function keepSet(lines: readonly string[], grammar: string): number[] {
  const kinds = keepKinds(lines, grammar);
  const out: number[] = [];
  for (let i = 0; i < kinds.length; i += 1) {
    if (kinds[i] !== null) out.push(i);
  }
  return out;
}

/**
 * 지워진 줄에 놓이는 자리표의 폭(em). 목업 `t1.js`:
 * `Math.min(30, Math.max(4, t.trim().length * 0.56))`.
 *
 * 들여쓰기는 자리표가 아니라 줄의 여백으로 그대로 남으므로 트림한 길이만 잰다.
 */
export function placeholderWidth(line: string): number {
  return Math.min(30, Math.max(4, line.trim().length * 0.56));
}
