/**
 * 사전 문장 템플릿 렌더러 — 03 §4.3 의 mustache 부분집합 (D39 · D69 · D74).
 *
 * 문법은 `{{var}}` · 섹션 `{{#name}}…{{/name}}` · 부정 `{{^name}}…{{/name}}` ·
 * 필터 연쇄 `{{pick.1|code|josa:이,가}}` 뿐이다. 표현식을 평가하는 엔진은 두지 않는다
 * (06 §4.2) — 사전은 커뮤니티 기여 데이터이고 값은 사용자 코드다.
 *
 * **템플릿 리터럴은 이스케이프하지 않고 치환된 값만 이스케이프한다.** 사전 원문에는
 * 허용 태그 6종이 이미 들어 있고(`code b i em br kbd`), 코드에서 온 값에는 `<` 가
 * 들어올 수 있다. 이 경계가 흐려지면 사전이 태그를 못 쓰거나 코드가 태그가 된다.
 *
 * 없는 변수는 빈 문자열이 아니라 `missing` 이다 — 04 §1.3 이 「템플릿이 참조하는
 * 변수가 이 Site 에 없으면 그 템플릿은 불가」를 판정으로 요구하기 때문이다.
 */

/** 이름 → 값. 점이 든 이름(`pick.1`·`ctx.fallback`)도 중첩 없이 평평한 키다. */
export type TemplateVars = Readonly<Record<string, string>>;

export type RenderResult = { text: string } | { missing: string[] };

/** 호출자가 분기에 쓰는 좁히기. */
export const isMissing = (r: RenderResult): r is { missing: string[] } => 'missing' in r;

interface Filter {
  name: string;
  args: string[];
}

type Section = { k: 'section'; name: string; inverted: boolean; body: Node[] };
type Node =
  | { k: 'text'; t: string }
  | { k: 'var'; name: string; filters: Filter[] }
  | Section;

const TAG = /\{\{([#^/]?)([^{}]*)\}\}/g;

const ESCAPES: ReadonlyMap<string, string> = new Map([
  ['&', '&amp;'], ['<', '&lt;'], ['>', '&gt;'], ['"', '&quot;'], ["'", '&#39;'],
]);

/** 치환되는 값에만 쓴다. 템플릿 리터럴에는 쓰지 않는다 — 위 파일 주석 참조. */
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPES.get(c) ?? c);
}

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const JAMO_PER_SYLLABLE = 28;

/**
 * 받침 유무 판정 — `design/src/ink/util.js` 의 `josa` 를 그대로 옮겼다.
 * 한글이 아니면 영문 자음으로 끝나는지를 본다(`res.user` → 받침 있음처럼 취급).
 */
function hasBatchim(word: string): boolean {
  const plain = word.replace(/<[^>]+>/g, '').trim();
  const code = plain.charCodeAt(plain.length - 1);
  if (code >= HANGUL_START && code <= HANGUL_END) {
    return (code - HANGUL_START) % JAMO_PER_SYLLABLE !== 0;
  }
  return /[^aeiouAEIOU\W\d]$/.test(plain) && !/[.?!)\]>]$/.test(plain);
}

/**
 * 목업 `util.js` 와 같은 서명 — 05 가 화면 문구에 그대로 쓴다.
 * 템플릿 필터는 이것이 아니라 `hasBatchim` 만 쓴다(아래 `applyFilters` 주석).
 */
export function josa(word: string, withBatchim: string, withoutBatchim: string): string {
  return word + (hasBatchim(word) ? withBatchim : withoutBatchim);
}

function parseFilter(raw: string): Filter {
  const at = raw.indexOf(':');
  if (at === -1) return { name: raw.trim(), args: [] };
  return { name: raw.slice(0, at).trim(), args: raw.slice(at + 1).split(',').map((a) => a.trim()) };
}

function parse(tpl: string): Node[] {
  const root: Node[] = [];
  const open: { node: Section; parent: Node[] }[] = [];
  let body = root;
  let last = 0;

  TAG.lastIndex = 0;
  for (let m = TAG.exec(tpl); m !== null; m = TAG.exec(tpl)) {
    if (m.index > last) body.push({ k: 'text', t: tpl.slice(last, m.index) });
    last = TAG.lastIndex;
    const sigil = m[1] ?? '';
    const raw = (m[2] ?? '').trim();

    if (sigil === '#' || sigil === '^') {
      const node: Section = { k: 'section', name: raw, inverted: sigil === '^', body: [] };
      body.push(node);
      open.push({ node, parent: body });
      body = node.body;
      continue;
    }
    if (sigil === '/') {
      const top = open.at(-1);
      // 짝이 안 맞는 닫힘은 글자로 둔다 — 사전 오타 하나가 문장 전체를 삼키지 않게.
      if (top === undefined || top.node.name !== raw) {
        body.push({ k: 'text', t: m[0] });
        continue;
      }
      open.pop();
      body = top.parent;
      continue;
    }
    const [name = '', ...rest] = raw.split('|');
    body.push({ k: 'var', name: name.trim(), filters: rest.map(parseFilter) });
  }
  if (last < tpl.length) body.push({ k: 'text', t: tpl.slice(last) });
  return root;
}

/** 섹션은 값이 있고 비어 있지 않으면 참이다. `{{#other}}` 처럼 묶음 이름도 받는다. */
function truthy(vars: TemplateVars, name: string): boolean {
  const own = vars[name];
  if (own !== undefined) return own !== '';
  const prefix = `${name}.`;
  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith(prefix) && value !== '') return true;
  }
  return false;
}

/**
 * 필터 연쇄 (D69). `code` 는 감싸고, `josa` 는 **조사만** 낸다.
 *
 * 왜 `josa` 가 값을 다시 내지 않는가: 사전은 `{{pick.1|code}}{{pick.1|josa:은,는}}` 처럼
 * 값과 조사를 나눠 쓴다(번들 사전 185곳). 조사가 값을 또 내면 「res.user 가」 가 아니라
 * 「res.userres.user 가」 가 된다. 대신 **앞선 필터가 있으면** 그 결과 뒤에 붙인다 —
 * D69 가 드는 `{{pick.1|code|josa:이,가}}`(감싸면서 조사까지)가 이 자리다.
 */
function applyFilters(raw: string, filters: readonly Filter[], missing: string[]): string {
  let text = escapeHtml(raw);
  for (const [i, filter] of filters.entries()) {
    if (filter.name === 'code') {
      text = `<code>${text}</code>`;
      continue;
    }
    if (filter.name === 'josa') {
      const [withBatchim = '', without = ''] = filter.args;
      const particle = hasBatchim(raw) ? withBatchim : without;
      text = i === 0 ? particle : text + particle;
      continue;
    }
    missing.push(`|${filter.name}`);
  }
  return text;
}

function emit(nodes: readonly Node[], vars: TemplateVars, missing: string[]): string {
  let out = '';
  for (const node of nodes) {
    if (node.k === 'text') {
      out += node.t;
      continue;
    }
    if (node.k === 'section') {
      if (truthy(vars, node.name) !== node.inverted) out += emit(node.body, vars, missing);
      continue;
    }
    const value = vars[node.name];
    if (value === undefined) {
      missing.push(node.name);
      continue;
    }
    out += applyFilters(value, node.filters, missing);
  }
  return out;
}

/**
 * 템플릿 하나를 렌더한다. 참조된 변수가 하나라도 없으면 문장 대신 그 이름들을 돌려준다 —
 * 호출자(04 §1.3)가 「이 템플릿은 이 Site 에 못 쓴다」를 그것으로 판정한다.
 * 거짓 섹션 안쪽은 렌더되지 않으므로 그 안의 변수는 없어도 된다.
 */
export function render(tpl: string, vars: TemplateVars): RenderResult {
  const missing: string[] = [];
  const text = emit(parse(tpl), vars, missing);
  return missing.length > 0 ? { missing: [...new Set(missing)] } : { text };
}
