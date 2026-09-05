/**
 * `order` — 조각을 순서대로 세운다 (D187 ⑱ · `docs/program/fundamentals.md` §13).
 *
 * ## 자리는 **5단의 1겹**이다
 *
 * `pedagogy.md` §2.2 가 셋을 재 보고 그렇게 정했다. 4·5단 「사이」의 새 단이 아니다 —
 * 단을 여섯으로 늘리면 `stage_reached BETWEEN 0 AND 5`(`0007`)와 통과 판정이 전부 바뀐다.
 * Ericson 2022 의 배치도 그쪽이다: faded Parsons 는 Parsons 와 쓰기 **사이**에 놓이고
 * Parsons 자체는 쓰기의 **비계**다. T1 페이딩이 이미 3겹이고 섞기는 그 앞의 0겹이다.
 *
 * ## 채점은 새로 만들지 않는다
 *
 * `pct = 맞은 인접 쌍 / (N−1)` — 2단 `hop` 의 규칙 그대로다(`exercises.md` §2). 부분 점수가
 * 있고 결정론이며 난수가 안 든다. 정답 순서는 재료가 이미 알고 있다.
 *
 * ## 오답 진단을 **사람이 안 적는다**
 *
 * 정본 §3-2 는 「당신이 고른 그것이 참이 되는 조건」을 요구한다. 순열에서 그 조건은
 * **틀린 인접 쌍마다 「왜 B 가 A 보다 먼저인가」**이고, 그 답은 재료의 사실에 이미 있다 —
 * 홉이면 **부르는 방향**(칸 i 의 줄이 칸 i+1 을 부른다), 사다리면 **그때의 타입**이다.
 * 그래서 조각마다 `fact` 한 줄을 싣고 채점기(`packages/grading/src/order.ts`)가 거기서
 * 문장을 **계산한다**. `siblings` 가 값 적기에서 한 일과 같은 수법이다.
 *
 * 재료 둘 — 챕터의 홉 순서(`StageRequest.paths`, `packages/course/src/hops.ts` 가 낸 것)와
 * 0부 카탈로그의 `FoldStep` 사다리(`fundamentals.ts`). 앞은 코스 판이고 뒤는 순수 함수다.
 */
import { t } from '@chickadee/i18n';
import type { Hop } from '@chickadee/concepts';
import type { CardPayload } from '@chickadee/store-sql';

import { buildValueItems, valueText, FUND_DIALECTS, type FundLang } from './fundamentals.js';
import { finishStage, nodeId, rngOf, shortNode, stageSeed } from './stage-common.js';
import type { StageCard, StageDrop, StageRequest } from './stage-types.js';
import { baseName } from './vars.js';

type OrderPayload = Extract<CardPayload, { kind: 'order' }>;

/** 조각 수의 아래·위. 3 미만이면 순열이 둘뿐이고, 7 을 넘으면 한 판이 30초를 넘는다. */
export const ORDER_MIN = 3;
export const ORDER_MAX = 7;
/** 한 챕터가 내는 `order` 판의 상한. 5단은 판 하나가 길어 두 장이면 충분하다. */
export const MAX_ORDER = 2;

/** 간선 종류 → 사람이 읽는 이름. 진단문이 이 낱말로 방향을 말한다. */
const EDGE_LABEL = {
  static: 'chapter.orderEdgeStatic',
  http: 'chapter.orderEdgeHttp',
  dynamic: 'chapter.orderEdgeDynamic',
  type: 'chapter.orderEdgeType',
} as const;

/**
 * 섞는다. 시드는 `stageSeed` 라 같은 챕터에 언제나 같은 덱이 나오고(04 §9), **정답과 같은
 * 순서로는 안 낸다** — 그 판은 아무것도 안 묻는다.
 */
export function shuffleDeck(answer: readonly string[], seed: number): string[] {
  const rnd = rngOf(seed);
  const deck = [...answer];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    const a = deck[i] as string;
    deck[i] = deck[j] as string;
    deck[j] = a;
  }
  if (deck.length > 1 && deck.every((p, i) => p === answer[i])) {
    const head = deck[0] as string;
    deck[0] = deck[deck.length - 1] as string;
    deck[deck.length - 1] = head;
  }
  return deck;
}

interface Piece { id: string; t: string; fact: string }

/**
 * 홉 줄기 하나를 조각으로. 칸 i 의 `line` 은 **칸 i+1 을 부른 줄**이므로(`hops.ts` 계약),
 * 그 한 값이 곧 「이 칸이 다음 칸보다 먼저인 이유」다. 마지막 칸은 부르는 곳이 없다.
 */
export function hopPieces(hops: readonly Hop[]): Piece[] {
  return hops.map((h, i) => {
    const next = hops[i + 1];
    const id = nodeId(h.path, h.line);
    if (next === undefined) {
      return { id, t: shortNode(h.path, h.line), fact: t('chapter.orderFactLast') };
    }
    return {
      id,
      t: shortNode(h.path, h.line),
      fact: t('chapter.orderFactHop', {
        here: baseName(h.path),
        line: h.line === null ? '?' : String(h.line),
        next: baseName(next.path),
        edge: t(EDGE_LABEL[h.kind ?? 'static']),
      }),
    };
  });
}

/**
 * 챕터의 `order` 판 — 재료는 요청 줄기다. 줄기가 길면 앞 `ORDER_MAX` 칸만 쓴다(뒤 반쪽은
 * 2단 `hop` 이 이미 두 장으로 자른다). 같은 파일이 두 칸에 오면 안 낸다 — 노드가 겹치면
 * 순열의 정답이 하나가 아니다.
 */
export function buildOrders(req: StageRequest): { cards: StageCard[]; drops: StageDrop[] } {
  const cards: StageCard[] = [];
  const drops: StageDrop[] = [];
  if (req.paths.length === 0) {
    return { cards, drops: [{ type: 'order', reason: t('stage.noPaths') }] };
  }
  for (const path of req.paths) {
    if (cards.length >= MAX_ORDER) break;
    const hops = path.slice(0, ORDER_MAX);
    if (hops.length < ORDER_MIN) {
      drops.push({ type: 'order', reason: t('chapter.orderTooShort', { n: String(ORDER_MIN) }) });
      continue;
    }
    const pieces = hopPieces(hops);
    const ids = pieces.map((p) => p.id);
    if (new Set(ids).size !== ids.length) {
      drops.push({ type: 'order', reason: t('chapter.orderDupNode') });
      continue;
    }
    const key = `${ids[0] ?? ''}>${ids[ids.length - 1] ?? ''}`;
    const first = hops[0] as Hop;
    const last = hops[hops.length - 1] as Hop;
    const payload: OrderPayload = {
      track: 't3', kind: 'order', stage: 5,
      q: t('chapter.orderQ', { first: baseName(first.path), last: baseName(last.path) }),
      hint: t('chapter.orderHint'),
      pieces,
      answer: ids,
      deck: shuffleDeck(ids, stageSeed(req, 'order', key)),
      ok: t('chapter.orderOk'),
      rule: t('chapter.orderRule'),
      promptLines: pieces.map((p) => `${p.t} — ${p.fact}`),
    };
    cards.push(finishStage({
      req, type: 'order', key, fileId: req.files.get(first.path)?.fileId ?? null, payload,
    }));
  }
  return { cards, drops };
}

/**
 * 0부의 `order` — 재료는 카탈로그의 `FoldStep` 사다리다. **순수 함수이고 리포를 안 본다**
 * (`buildValueItems` 와 같은 자리). 조각이 접힘의 한 걸음이고 `fact` 는 그때의 타입이라,
 * 「왜 이 걸음이 먼저인가」가 타입 하나로 답해진다 — `7 / 2` 는 `int / int` 일 때만 3 이다.
 *
 * 앱에 아직 안 걸려 있다. 걸리는 자리는 코스 1부이고 그 배선은 `curriculum.ts` 의 몫이다.
 */
export function buildLadderOrders(lang: FundLang): OrderPayload[] {
  const dialect = FUND_DIALECTS[lang];
  const out: OrderPayload[] = [];
  for (const item of buildValueItems(lang).items) {
    if (item.fold.length < ORDER_MIN) continue;
    const pieces: Piece[] = item.fold.map((step, i) => ({
      id: `${item.id}#${String(i)}`,
      t: step.code,
      fact: t('chapter.orderFactFold', { type: step.type }),
    }));
    const ids = pieces.map((p) => p.id);
    out.push({
      track: 't3', kind: 'order', stage: 5,
      q: t('chapter.orderFoldQ', { name: item.target.name, lang: dialect.name }),
      hint: t('chapter.orderHint'),
      pieces,
      answer: ids,
      // 시드는 식 id — 리포가 없으므로 `stageSeed` 를 못 쓴다. 같은 언어에 같은 덱이다.
      deck: shuffleDeck(ids, seedOfText(item.id)),
      ok: t('chapter.orderFoldOk', { value: valueText(item.expected) }),
      rule: t('chapter.orderRule'),
      promptLines: pieces.map((p) => `${p.t} — ${p.fact}`),
    });
  }
  return out;
}

/** 글자 하나로 시드. FNV-1a 32비트의 곱셈만 — 카드 해시와 같은 상수다. */
function seedOfText(text: string): number {
  let h = 0x81_1c_9d_c5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01_00_01_93) >>> 0;
  }
  return h;
}
