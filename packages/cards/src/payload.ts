/**
 * 세 유형이 함께 쓰는 페이로드 조각 — 정답 해설·규칙·사전 3층·선행·다른 자리
 * (04 §2.1 · §2.4). 사다리가 이것을 읽는다.
 */
import { t } from '@chickadee/i18n';
import { seedOf } from '@chickadee/text';
import type { Concept } from '@chickadee/dictionary';
import type { ConceptId, DictLayer } from '@chickadee/store-sql';

import { contentHash } from './hash.js';
import { promptLines } from './lines.js';
import { baseName, Renderer } from './vars.js';
import type { SiteInput, T0Card, T0Kind, T0Payload, T0Request } from './types.js';

/** 카드 생성기 버전. 규칙이 바뀌면 올린다 — `card.gen_version` 과 같은 수다. */
export const GEN_VERSION = 1;

export type Diag = NonNullable<T0Payload['why'][number]>;

/** 사전의 진단 하나를 렌더한다. `edge` 는 「가장 날카로운 자리」 두 줄이다. */
export function renderDiag(
  raw: { t: string; edge?: { h: string; code: string[] } | undefined },
  r: Renderer,
): Diag {
  const t = r.need(raw.t);
  if (!raw.edge) return { t };
  return { t, edge: { h: r.need(raw.edge.h), code: raw.edge.code.map((line) => r.need(line)) } };
}

/** 사전 3층. `k` 는 목업 `data.js` 의 라벨 그대로다. */
function dictLayers(concept: Concept, focus: number, r: Renderer): DictLayer[] | undefined {
  const layers: DictLayer[] = [];
  const oneLiner = r.maybe(concept.dict.one_liner);
  if (oneLiner !== undefined) layers.push({ k: t('card.dictOneLiner'), t: oneLiner });
  const why = r.maybe(concept.dict.why);
  if (why !== undefined) layers.push({ k: t('card.dictWhy'), t: why });
  const steps = concept.dict.trace.map((step) => r.maybe(step));
  // 한 단계라도 이 사용처에서 못 쓰면 층 전체를 뺀다 — 04 §2.4 가 `rule`·`ok` 로 대신한다.
  if (steps.length > 0 && steps.every((s) => s !== undefined)) {
    layers.push({ k: t('card.dictTrace', { focus: String(focus) }), steps: steps as string[] });
  }
  return layers.length > 0 ? layers : undefined;
}

/** 선행 개념 이름. 목업의 `속성 접근 <code>.</code>` 모양이다. */
function prereqOf(
  concept: Concept,
  concepts: ReadonlyMap<string, Concept>,
): { conceptId: ConceptId; n: string }[] {
  return concept.prereq.map((id) => {
    const at = concepts.get(id);
    const token = at?.token;
    const name = at?.name.ko ?? id;
    return { conceptId: id as ConceptId, n: token ? `${name} <code>${token}</code>` : name };
  });
}

export interface Common {
  ok: string;
  rule: string;
  file: string;
  focus: number;
  promptLines: string[];
  prereq: { conceptId: ConceptId; n: string }[];
  uses: { siteId: number; f: string; l: number }[];
  result?: { label: string; value: string; note: string };
  dict?: DictLayer[];
  payoff?: string;
  bridge?: string;
  transferFrom?: ConceptId;
  previewSiteId?: number;
}

/** 유형과 무관한 부분 전부. `ok`·`rule` 은 필수라 실패하면 그 유형을 못 쓴다. */
export function commonPayload(req: T0Request, input: SiteInput, r: Renderer): Common {
  const { concept } = req;
  const focus = input.site.lineStart;
  const result = concept.result && {
    label: r.maybe(concept.result.label),
    value: r.maybe(concept.result.value),
    note: r.maybe(concept.result.note),
  };
  const dict = dictLayers(concept, focus, r);
  const payoff = r.maybe(concept.payoff);
  const bridge = r.maybe(concept.bridge);

  return {
    ok: r.need(concept.ok),
    rule: r.need(concept.rule),
    file: input.path,
    focus,
    promptLines: promptLines(input.lines, focus),
    prereq: prereqOf(concept, req.concepts),
    uses: (input.others ?? []).map((o) => ({ siteId: o.siteId, f: o.file, l: o.line })),
    ...(result?.label !== undefined && result.value !== undefined && result.note !== undefined
      ? { result: { label: result.label, value: result.value, note: result.note } }
      : {}),
    ...(dict ? { dict } : {}),
    ...(payoff !== undefined ? { payoff } : {}),
    ...(bridge !== undefined ? { bridge } : {}),
    ...(req.transferFrom !== undefined ? { transferFrom: req.transferFrom } : {}),
    ...(req.previewSiteId !== undefined ? { previewSiteId: req.previewSiteId } : {}),
  };
}

/** 04 §0: `seedOf(repoId, kind, targetId, attempt, dictVersion)`. */
export function seedFor(req: T0Request, kind: T0Kind, input: SiteInput): number {
  // targetId 는 `site.id`(자동 증가)가 아니라 `siteKey` 다 — 줄이 밀려도 같은 카드가
  // 다시 나와야 재생성 계약이 성립한다 (03 §1.6 · D70).
  return seedOf(req.repoId, kind, input.site.siteKey, req.attempt, req.dictVersion);
}

export function finish(
  req: T0Request,
  input: SiteInput,
  kind: T0Kind,
  payload: T0Payload,
): T0Card {
  const siteId = input.site.id;
  return {
    conceptId: input.site.conceptId,
    siteId,
    kind,
    payload,
    contentHash: contentHash({
      conceptId: input.site.conceptId, kind, siteId, genVersion: GEN_VERSION, payload,
    }),
    gen: { seed: seedFor(req, kind, input), dictVersion: req.dictVersion, attempt: req.attempt, siteId },
  };
}

/** `{{other.*}}` 가 가리키는 다른 자리의 파일명 — 진단문이 「같은 리포, 다른 줄」을 짚는다. */
export const otherLabel = (input: SiteInput): string | null => {
  const other = input.others?.[0];
  return other ? `${baseName(other.file)}:${other.line}` : null;
};
