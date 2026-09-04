/**
 * 개념 안에서 **사람이 읽는 문자열이 어디인지**의 유일한 목록 (03 §4.4 · D118).
 *
 * 목록이 둘이면 새 필드가 한쪽에서만 다뤄진다 — 로케일은 풀렸는데 린트는 안 보거나, 그
 * 반대가 된다. 그래서 로케일 풀기(`resolve.ts`)와 린트(`lint.ts`)가 같은 함수를 부른다.
 *
 * 여기 없는 문자열은 언어가 없는 것이다: `id` · `token` · `answer` · `result.value` ·
 * 쿼리 파일 이름 · 예시 코드. `name` 도 없다 — 두 언어가 원장의 `name_ko`·`name_en` 두 열로
 * 갈라져 들어가므로 하나로 풀면 안 된다 (마이그레이션 0002).
 */
import type { Localized, SourceConcept } from './schema.js';

/** 문자열 하나를 보고, 그 자리에 들어갈 글을 돌려준다. */
export type Visit = (path: string, value: Localized) => string;

/**
 * 사람이 읽는 문자열을 `visit` 의 결과로 갈아 끼운 사본. 나머지 필드는 그대로 복사된다 —
 * 개념은 순수 JSON 이라 복사가 곧 깊은 복사다.
 */
export function mapProse(concept: SourceConcept, visit: Visit): Record<string, unknown> {
  const out = JSON.parse(JSON.stringify(concept)) as Record<string, unknown> & {
    dict: { one_liner: string; why: string; trace: string[] };
    result?: { label: string; note: string };
    misconceptions: string[];
    meaning: Question[];
    point: { q: string; hint?: string; diag?: Record<string, PlainDiag> }[];
    blank: Question[];
    why_gate?: { q: string; help?: string; choices: { t: string; fb: string }[] };
  };

  out.dict.one_liner = visit('dict.one_liner', concept.dict.one_liner);
  out.dict.why = visit('dict.why', concept.dict.why);
  out.dict.trace = concept.dict.trace.map((t, i) => visit(`dict.trace[${i}]`, t));
  out['rule'] = visit('rule', concept.rule);
  out['ok'] = visit('ok', concept.ok);
  if (concept.payoff !== undefined) out['payoff'] = visit('payoff', concept.payoff);
  if (concept.bridge !== undefined) out['bridge'] = visit('bridge', concept.bridge);
  if (concept.result && out.result) {
    out.result.label = visit('result.label', concept.result.label);
    out.result.note = visit('result.note', concept.result.note);
  }
  out.misconceptions = concept.misconceptions.map((t, i) => visit(`misconceptions[${i}]`, t));

  for (const kind of ['meaning', 'blank'] as const) {
    for (const [i, card] of concept[kind].entries()) {
      const target = out[kind][i];
      if (!target) continue;
      target.q = visit(`${kind}[${i}].q`, card.q);
      if (card.hint !== undefined) target.hint = visit(`${kind}[${i}].hint`, card.hint);
      for (const [j, option] of card.options.entries()) {
        const slot = target.options[j];
        if (!slot) continue;
        slot.t = visit(`${kind}[${i}].options[${j}]`, option.t);
        if (option.diag && slot.diag) {
          mapDiag(`${kind}[${i}].options[${j}].diag`, option.diag, slot.diag, visit);
        }
      }
    }
  }

  for (const [i, card] of concept.point.entries()) {
    const target = out.point[i];
    if (!target) continue;
    target.q = visit(`point[${i}].q`, card.q);
    if (card.hint !== undefined) target.hint = visit(`point[${i}].hint`, card.hint);
    for (const [key, value] of Object.entries(card.diag ?? {})) {
      const slot = target.diag?.[key];
      if (slot) mapDiag(`point[${i}].diag.${key}`, value, slot, visit);
    }
  }

  if (concept.why_gate && out.why_gate) {
    out.why_gate.q = visit('why_gate.q', concept.why_gate.q);
    if (concept.why_gate.help !== undefined) {
      out.why_gate.help = visit('why_gate.help', concept.why_gate.help);
    }
    for (const [i, choice] of concept.why_gate.choices.entries()) {
      const slot = out.why_gate.choices[i];
      if (!slot) continue;
      slot.t = visit(`why_gate.choices[${i}].t`, choice.t);
      slot.fb = visit(`why_gate.choices[${i}].fb`, choice.fb);
    }
  }
  return out;
}

/** 원문 쪽 진단 — 아직 두 언어를 들고 있다. */
interface Diag { t: Localized; edge?: { h: Localized } | undefined }
/** 사본 쪽 진단 — `visit` 의 결과가 들어갈 자리다. */
interface PlainDiag { t: string; edge?: { h: string } | undefined }
interface Question { q: string; hint?: string; options: { t: string; diag?: PlainDiag }[] }

function mapDiag(where: string, from: Diag, to: PlainDiag, visit: Visit): void {
  to.t = visit(`${where}.t`, from.t);
  if (from.edge && to.edge) to.edge.h = visit(`${where}.edge.h`, from.edge.h);
}
