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

export function genMeaning(req: T0Request, input: SiteInput): GenResult {
  const { concept } = req;
  const { site } = input;
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
