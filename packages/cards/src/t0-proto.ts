/**
 * 규약 카드 (D159 `proto/`). JWT·HTTP 메서드·상태 코드처럼 **문법이 아닌 것**을 낸다.
 *
 * 짚을 노드가 없다 — `Bearer` 는 어느 언어에서도 그냥 글자다. 그래서 tree-sitter 쿼리 대신
 * 사전이 댄 **근거 낱말**(`evidence`)이 블록의 글자에 보이는지를 본다. 보이면 그 줄을 자리로
 * 삼아 `t0-exec` 과 **같은 수**로 사용처를 지어 평소 생성기에 넘긴다 — 새 `card.kind` 도
 * 마이그레이션도 없다 (D151·D154 의 선).
 *
 * 문항은 뜻 고르기 하나뿐이다. 지목형은 짚을 자리가 있어야 하고 빈칸형은 뚫을 구멍이
 * 있어야 하는데, 규약에는 둘 다 없다.
 */
import { t } from '@chickadee/i18n';
import type { ConceptId, ConceptSite } from '@chickadee/store-sql';

import { genMeaning } from './t0-meaning.js';
import type { FocusLine, GenResult, LineWindow, SiteInput, T0Request } from './types.js';

/**
 * 규약 카드의 `site_id`. 원장에는 `NULL` 로 들어간다 — 대응하는 `concept_site` 행이 없다.
 * 합성(-1)·추적(-2)과 다른 음수라 셋이 안 섞이고, 진짜 사용처 id 와도 안 겹친다.
 */
export const PROTO_SITE_ID = -3;

export interface ProtoRequest extends Omit<T0Request, 'sites' | 'previewSiteId'> {
  /** 블록의 원문 줄. `n` 은 **파일 기준** 1-based 다. */
  lines: readonly FocusLine[];
  path: string;
  /** 블록 범위 = 창 (D141). */
  window: LineWindow;
  /** 사용처 키. 같은 블록에 같은 카드가 두 번 구워지지 않게 한다. */
  blockHash: string;
}

/** 근거 낱말이 처음 보이는 줄. 없으면 이 블록은 이 개념의 자리가 아니다. */
function evidenceLine(
  lines: readonly FocusLine[],
  marks: readonly string[],
): FocusLine | null {
  for (const line of lines) {
    if (marks.some((mark) => line.t.includes(mark))) return line;
  }
  return null;
}

export function makeProtoCard(req: ProtoRequest): GenResult {
  const marks = req.concept.evidence;
  if (marks.length === 0) return { reason: t('proto.noEvidence') };
  const found = evidenceLine(req.lines, marks);
  if (found === null) return { reason: t('proto.noEvidence') };

  const site: ConceptSite = {
    id: PROTO_SITE_ID, repoId: req.repoId, fileId: 0,
    conceptId: req.concept.id as ConceptId, siteKey: req.blockHash,
    lineStart: found.n, lineEnd: found.n, colStart: 0, colEnd: 0,
    tsNodeKind: null, form: null, shape: 'proto', occurrence: 0,
    excerpt: found.t.trim(),
    picks: {}, hole: null, ctx: {}, lineConcepts: [], uncoveredRatio: 0,
    confidence: 'syntactic', parseQuality: 'ok', isDirty: false, isOversize: false,
    commitId: null, unknownCount: 0, isAlive: true, updatedAt: 0,
  };
  const input: SiteInput = { site, path: req.path, lines: req.lines, block: req.window };
  return genMeaning({ ...req, sites: [input] }, input);
}
