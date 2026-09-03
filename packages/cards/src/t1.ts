/**
 * T1 필사 카드 생성기 (04 §3).
 *
 *   rankBlocks → 후보를 순서대로 → pickConcept(D27) → keepSet(§3.2) → buildSpec(§3.3)
 *   → 왜 게이트 문항(§6) → payload → contentHash
 *
 * 04 §3.1 은 첫 후보를 쓰라고 읽히지만 여기서는 순위대로 **훑는다**. 대표 개념이 없거나
 * 2단계에 지울 줄이 없는 블록은 판을 만들 수 없고, 그때 「판 없음」으로 끝내면 뒤에 있는
 * 멀쩡한 후보를 버리게 된다 — `t0.ts` 의 사용처 순회와 같은 이유다.
 */
import { isMissing, mulberry32, render, seedOf } from '@chickadee/text';
import type { Concept } from '@chickadee/dictionary';
import type { ConceptId } from '@chickadee/store-sql';

import { contentHash } from './hash.js';
import { GEN_VERSION } from './payload.js';
import { pickConcept, rankBlocks } from './t1-block.js';
import { keepKinds } from './t1-mask.js';
import { buildSpec } from './t1-spec.js';
import { baseName } from './vars.js';
import type { NoPlate } from './types.js';
import type { BlockCandidate, BlockConcept, T1Card, T1Payload, T1Request } from './t1-types.js';

/** 04 §6 ② 의 일반 템플릿. 사전 `why_gate` 가 없을 때의 문항이다. */
export const GENERIC_WHY_Q = '이 줄이 없으면 무엇이 달라질까요?';
/**
 * 목업 `T1.why.help` 를 옮긴 것. 목업은 「앞의 9분」이라 그 카드의 예상 시간을 박아 두었는데,
 * 예상 시간은 `card_state.est_min_ema` 에서 나오고 생성 시점에는 없다 — 숫자를 빼고 쓴다.
 */
export const GENERIC_WHY_HELP =
  '한 줄이면 됩니다. 채점하지 않습니다. 다만 건너뛸 수는 없습니다 — '
  + '여기서 뇌가 안 켜지면 앞의 필사는 타자 연습이 됩니다.';

type Why = T1Payload['why'];

/**
 * 왜 게이트 문항 (04 §6 문항 선정).
 *
 * 생성 시점에는 답안이 없어 ②`missing`·③`differ` 행을 알 수 없다. 남는 것은
 * ① 사전 `why_gate` 가 있는 개념이 걸린 줄과 ④ 첫 비-시그니처 문장이고, 둘 다 여기서 낸다.
 * 채점 뒤 `missing`·`differ` 로 문항을 갈아 끼우는 것은 `packages/grading` 의 일이다 (D86).
 *
 * 후보 줄은 **2단계에 지워지는 줄**로 좁힌다 — 유지 집합(시그니처·주석·닫힘)에 대고
 * 「이 줄이 없으면」을 물으면 답이 「문법이 깨진다」밖에 안 나온다. §6 ④ 의 「비-시그니처
 * 문장」을 그렇게 읽었다.
 *
 * `choices` 는 **3개 아니면 0개**다 — 출처 구분이 이 길이에 걸려 있다 (사전 `why_gate` 는
 * 정확히 3개를 요구하고, 일반 템플릿에는 보기가 없다).
 */
function buildWhy(
  candidate: BlockCandidate,
  concepts: readonly BlockConcept[],
  masked: readonly number[],
  req: T1Request,
  seed: number,
): Why {
  const generic = (line: number): Why =>
    ({ line, q: GENERIC_WHY_Q, help: GENERIC_WHY_HELP, choices: [] });
  const fallback = masked[0] ?? 0;

  // ① 사전 `why_gate` 가 있고 토큰이 지워지는 줄에 보이는 개념.
  const hits: { line: number; concept: Concept }[] = [];
  for (const at of concepts) {
    const concept = req.concepts.get(at.conceptId);
    if (!concept?.why_gate || concept.token === null || concept.token === '') continue;
    const line = masked.find((i) => (candidate.lines[i] ?? '').includes(concept.token as string));
    if (line !== undefined) hits.push({ line, concept });
  }
  if (hits.length === 0) return generic(fallback);

  // 동순위는 시드로 (§6). 줄 순으로 세운 뒤 고른다 — 같은 시드면 같은 문항이다.
  hits.sort((a, b) => a.line - b.line || (a.concept.id < b.concept.id ? -1 : 1));
  const hit = hits.length === 1 ? hits[0] : hits[Math.floor(mulberry32(seed)() * hits.length)];
  if (!hit) return generic(fallback);

  const gate = hit.concept.why_gate;
  if (!gate) return generic(fallback);

  // D74 — 문구는 생성 시점에 렌더한 최종 문자열이다. 블록 후보에서 채울 수 있는 변수는
  // 넷뿐이라(picks·ctx·hole 은 Site 것이다) 그 밖을 쓰는 문항은 일반 템플릿으로 내려간다.
  const vars = {
    file: candidate.path,
    'file.base': baseName(candidate.path),
    'site.line': String(candidate.lineStart + hit.line),
    'site.text': (candidate.lines[hit.line] ?? '').trim(),
  };
  const one = (tpl: string): string | null => {
    const out = render(tpl, vars);
    return isMissing(out) ? null : out.text;
  };
  const q = one(gate.q);
  const help = gate.help === undefined ? GENERIC_WHY_HELP : one(gate.help);
  const choices = gate.choices.map((c) => {
    const t = one(c.t);
    const fb = one(c.fb);
    return t === null || fb === null ? null : { t, ok: c.ok, fb };
  });
  if (q === null || help === null || choices.some((c) => c === null)) return generic(hit.line);

  return { line: hit.line, q, help, choices: choices as Why['choices'] };
}

/** 가장 자주 나온 탈락 사유. `t0.ts` 의 `summarize` 와 같은 규칙이다. */
function summarize(reasons: readonly string[]): string {
  const count = new Map<string, number>();
  for (const reason of reasons) count.set(reason, (count.get(reason) ?? 0) + 1);
  let best = reasons[0] ?? '필사할 블록이 없다';
  for (const [reason, n] of count) {
    if (n > (count.get(best) ?? 0)) best = reason;
  }
  return best;
}

export function generateT1(req: T1Request): T1Card | NoPlate {
  if (req.candidates.length === 0) {
    return { noPlate: true, reason: '리포에 필사할 블록 후보가 없다' };
  }
  const { blocks, dropped } = rankBlocks(req.candidates, {
    stage: req.stage,
    ...(req.prints !== undefined ? { prints: req.prints } : {}),
  });
  const reasons = dropped.map((d) => d.reason);

  for (const candidate of blocks) {
    const picked = pickConcept(candidate, { essential: req.essential, concepts: req.concepts });
    if ('reason' in picked) {
      reasons.push(picked.reason);
      continue;
    }
    const kinds = keepKinds(candidate.lines, req.grammar);
    const show2: number[] = [];
    const masked: number[] = [];
    for (const [i, kind] of kinds.entries()) {
      if (kind === null) masked.push(i);
      else show2.push(i);
    }
    if (masked.length === 0) {
      reasons.push('2단계에 지울 줄이 없다 — 전부 시그니처·주석·닫힘이다');
      continue;
    }

    const seed = seedOf(req.repoId, 'transcribe', candidate.textHash, 0, req.dictVersion);
    const payload: T1Payload = {
      track: 't1',
      kind: 'transcribe',
      blockId: candidate.blockId,
      file: candidate.path,
      // 이름 없는 블록(`kind === 'file'`·익명 함수)은 파일명으로 부른다.
      fn: candidate.name !== null && candidate.name !== '' ? `${candidate.name}()` : baseName(candidate.path),
      original: [...candidate.lines],
      show2,
      why: buildWhy(candidate, candidate.concepts, masked, req, seed),
    };
    const spec = buildSpec({
      lines: candidate.lines,
      grammar: req.grammar,
      concepts: candidate.concepts,
      dict: req.concepts,
      path: candidate.path,
      ...(req.whyOwn !== undefined ? { whyOwn: req.whyOwn } : {}),
      // 「…이어서」 조각은 첫 줄이 주석 헤더다 — 3단계에도 그 표시를 남긴다.
      ...(candidate.kind === 'segment' && /^\s*(\/\/|#)\s*…이어서/.test(candidate.lines[0] ?? '')
        ? { header: (candidate.lines[0] ?? '').trim() }
        : {}),
    });

    return {
      blockId: candidate.blockId,
      fileId: candidate.fileId,
      conceptId: picked.primary.conceptId as ConceptId,
      secondary: picked.secondary.map((k) => k.conceptId as ConceptId),
      payload,
      // T1 카드도 `UNIQUE(repo_id, content_hash)` 를 쓴다 (02 `card`). `siteId` 자리에는
      // 대표 개념의 Site 를 넣는다 — 같은 블록에 대표 개념이 바뀌면 다른 카드다.
      contentHash: contentHash({
        conceptId: picked.primary.conceptId,
        kind: 'transcribe',
        siteId: picked.primary.siteId,
        genVersion: GEN_VERSION,
        payload,
      }),
      spec,
      gen: { seed, dictVersion: req.dictVersion, blockId: candidate.blockId, textHash: candidate.textHash },
    };
  }

  return { noPlate: true, reason: summarize(reasons) };
}
