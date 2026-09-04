/**
 * 빈칸형 (04 §1.2). 구멍은 `@hole` 캡처이고 보기 4개는 **사전이 준 것만** 쓴다 —
 * 색인에서 오답을 만드는 폴백은 두지 않는다. 오답에는 진단이 붙어야 하고 진단은
 * 사전에만 있기 때문이다.
 */
import { t } from '@chickadee/i18n';
import { mulberry32, shuffle, tokenize } from '@chickadee/text';

import { codeLines, lineAt, spanOf, LINES_WINDOW, type Span } from './lines.js';
import { commonPayload, finish, renderDiag, seedFor, type Diag } from './payload.js';
import { buildVars, Renderer } from './vars.js';
import type { GenResult, SiteInput, T0Request } from './types.js';

/** 한 글자 구멍은 지목형으로 보낸다 — `?.` `map` `=>` 처럼 뜻이 있는 폭이어야 한다. */
const MIN_HOLE = 2;

const plainText = (html: string): string => html.replace(/<[^>]+>/g, '');

/** 보기 4개가 같은 종류인가 (id↔id). 종류가 섞이면 답이 눈에 보인다. */
function sameKind(options: readonly string[]): boolean {
  const kinds = options.map((t) => {
    const tokens = tokenize(plainText(t)).filter((x) => x.k !== 'ws');
    return tokens.length === 1 ? (tokens[0]?.k ?? '') : 'many';
  });
  return kinds.every((k) => k !== 'many' && k === kinds[0]);
}

export function genBlank(req: T0Request, input: SiteInput): GenResult {
  const { concept } = req;
  const { site } = input;
  if (site.hole === null) return { reason: t('t0.dropNoHole') };
  const hole = site.hole;
  if (hole.length < MIN_HOLE) return { reason: t('t0.dropHoleTooShort') };
  if (concept.blank.length === 0) return { reason: t('t0.dropNoBlankEntry') };

  const rng = mulberry32(seedFor(req, 'blank', input));
  const entry = concept.blank[Math.floor(rng() * concept.blank.length)] ?? concept.blank[0];
  if (!entry) return { reason: t('t0.dropNoBlankEntry') };

  const vars = buildVars(input, concept);
  const r = new Renderer(vars);
  const rendered = entry.options.map((o) => ({
    t: r.need(o.t),
    ...(o.mono === true ? { mono: true as const } : {}),
    diag: o.diag ? renderDiag(o.diag, r) : null,
  }));
  if (!r.ok) return { reason: r.reason };

  // ⓐ 첫 보기는 구멍 원문이어야 한다. 아니면 이 문항은 이 사용처의 것이 아니다.
  if (rendered[0]?.t !== hole) return { reason: t('t0.dropFirstOptionDiffers', { hole }) };
  // ⓑ 종류가 섞이면 오답이 오답으로 보인다.
  if (!sameKind(rendered.map((o) => o.t))) return { reason: t('t0.dropOptionKinds') };
  // 진단이 빠진 오답은 「틀렸다」만 남긴다 — 그런 카드는 내지 않는다 (04 §2.1).
  if (rendered.slice(1).some((o) => o.diag === null)) return { reason: t('t0.dropNoWrongDiag') };

  const focusLine = lineAt(input.lines, site.lineStart);
  if (!focusLine) return { reason: t('t0.dropNoFocusLine') };
  const at = focusLine.n === site.lineStart ? site.colStart : 0;
  const found = spanOf(focusLine, hole, at) ?? spanOf(focusLine, hole);
  if (!found) return { reason: t('t0.dropHoleNotInFocus', { hole }) };
  const span: Span = { ...found, hole: true };

  // 정답 토큰이 맥락 줄에 또 보이면 「보고 베낀다」 — 순위를 낮춘다 (전부 leak 이면 허용).
  const leak = input.lines
    .filter((l) => Math.abs(l.n - site.lineStart) <= LINES_WINDOW)
    .reduce((n, l) => n + l.t.split(hole).length - 1, 0) > 1;

  const order = shuffle(rendered.map((_, i) => i), rng);
  const options = order.map((i) => {
    const o = rendered[i];
    return { t: o?.t ?? '', ...(o?.mono === true ? { mono: true as const } : {}) };
  });
  const why: (Diag | null)[] = order.map((i) => rendered[i]?.diag ?? null);
  const answer = order.indexOf(0);

  const common = commonPayload(req, input, r);
  const q = r.need(entry.q);
  const hint = entry.hint === undefined ? '' : r.need(entry.hint);
  if (!r.ok) return { reason: r.reason };

  const card = finish(req, input, 'blank', {
    track: 't0', kind: 'blank', ...common,
    lines: codeLines(input.lines, site.lineStart, [span]),
    q, hint, options, answer, why,
  });
  return leak ? { card, leak: true } : { card };
}
