/**
 * 유형 선호 · 폴백 사슬 · 생성 불가 (04 §1.4).
 *
 *   prefer(ly): 0–1 → [point, blank, meaning] · 2 → [blank, meaning, point]
 *               3–4 → [meaning, blank, point]
 *
 * 왜: 겹이 낮을수록 인식(지목)이, 높을수록 예측(의미)이 맞다. 사전이 비면 카드가 안 나오는
 * 것이 정상이고, 그 빈자리가 기여 표면이다.
 */
import { genBlank } from './t0-blank.js';
import { genMeaning } from './t0-meaning.js';
import { genPoint } from './t0-point.js';
import { isFailure, type GenResult, type NoPlate, type SiteInput, type T0Card, type T0Kind, type T0Request } from './types.js';

const GENERATORS: Readonly<Record<T0Kind, (req: T0Request, input: SiteInput) => GenResult>> = {
  point: genPoint,
  blank: genBlank,
  meaning: genMeaning,
};

/**
 * 유형을 지정해 만든다. 다시 찍기(04 §2.3)는 「같은 kind 유지, attempt+1」로 오므로
 * 선호 사슬을 타지 않는다 — `@chickadee/grading` 의 `RetryRequest` 가 이 자리다.
 */
export function generateKind(req: T0Request, kind: T0Kind, input: SiteInput): GenResult {
  return GENERATORS[kind](req, input);
}

export function prefer(ly: number): readonly T0Kind[] {
  if (ly <= 1) return ['point', 'blank', 'meaning'];
  if (ly === 2) return ['blank', 'meaning', 'point'];
  return ['meaning', 'blank', 'point'];
}

/** 가장 자주 나온 사유를 홈에 보여 준다. 동률이면 먼저 만난 것. */
function summarize(reasons: readonly string[]): string {
  const count = new Map<string, number>();
  for (const reason of reasons) count.set(reason, (count.get(reason) ?? 0) + 1);
  let best = reasons[0] ?? '쓸 수 있는 사용처가 없다';
  for (const [reason, n] of count) {
    if (n > (count.get(best) ?? 0)) best = reason;
  }
  return best;
}

/**
 * `rank` 순 사용처를 돌며 선호 순서대로 유형을 시도하고 처음 성공한 카드를 돌려준다.
 *
 * leak(정답이 맥락 줄에 그대로 또 보임) 카드는 한 바퀴 미뤄 둔다 — 04 §1.2 의
 * 「순위를 낮춘다(전부 leak 면 허용)」가 이 두 바퀴다.
 */
export function generateT0(req: T0Request): T0Card | NoPlate {
  if (req.sites.length === 0) return { noPlate: true, reason: '리포에 이 문법의 사용처가 없다' };

  const reasons: string[] = [];
  let leaked: T0Card | null = null;

  for (const input of req.sites) {
    for (const kind of prefer(req.ly)) {
      const out = GENERATORS[kind](req, input);
      if (isFailure(out)) {
        reasons.push(out.reason);
        continue;
      }
      if (out.leak === true) {
        leaked ??= out.card;
        continue;
      }
      return out.card;
    }
  }
  return leaked ?? { noPlate: true, reason: summarize(reasons) };
}
