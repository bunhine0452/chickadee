/**
 * 인제스트 진행을 화면의 4칸으로 (05 §2.1 · D47).
 *
 * Rust 의 `walk·parse·git·write` 는 두 칸으로, TS 의 `derive`·`cards` 는 두 칸으로 접힌다.
 * blame 은 배경이라 칸이 없다 (03 §1.5).
 *
 * **묶음은 잡이 실제로 내보내는 순서를 따른다**(D110) — `walk → parse → git → write`.
 * 앞선 묶음(`walk`+`git` / `parse`)은 그 순서와 어긋나 막대가 1 → 2 → 1 → 3 으로 **되돌았다**.
 * 진행 막대가 뒤로 가면 사람은 그것을 고장으로 읽는다.
 *
 * 칸의 너비는 **예상 시간**이다 — 스피너를 쓰지 않기로 한 이상, 남은 양은 시간으로만
 * 말할 수 있다(정본 §3-5). 아래 분값은 03 §7 의 10만 줄 예산 15초를 4칸에 나눈 것이다.
 */
import type { Phase } from '@chickadee/concepts';
import { t, type MessageKey } from '@chickadee/i18n';

import type { QueueItem } from '../../components/shell/TimeQueue.js';

/** 화면의 칸 하나. `phases` 의 어느 단계가 이 칸을 채우는지가 매핑의 전부다. */
export interface Box extends QueueItem {
  phases: readonly Phase[];
}

/**
 * 칸의 뼈대 — 로케일과 무관한 것만 든다. 문구는 **키**로 들고 `boxes()` 가 그때 푼다.
 * 문장을 여기 박으면 모듈이 열리는 시점에 굳어 `setLocale()` 보다 이르다 (D117).
 */
interface BoxSpec {
  kind: string;
  mins: number;
  phases: readonly Phase[];
  labelKey: MessageKey;
  subKey: MessageKey;
}

/**
 * 03 §7 의 예산 배분(파싱+쿼리 8s · 커밋 diff 4s · sqlite 2s)을 분으로 옮긴 값.
 * 실측이 아니라 **예상**이고, 그래서 칸 안의 진행은 실제 `done/total` 이 이긴다.
 */
const SPECS: readonly BoxSpec[] = [
  {
    kind: 'walk',
    mins: 0.18,
    phases: ['walk', 'parse'],
    labelKey: 'ingest.walkLabel',
    subKey: 'ingest.walkSub',
  },
  {
    kind: 'git',
    mins: 0.12,
    phases: ['git', 'write'],
    labelKey: 'ingest.gitLabel',
    subKey: 'ingest.gitSub',
  },
  {
    kind: 'write',
    mins: 0.06,
    phases: ['derive'],
    labelKey: 'ingest.deriveLabel',
    subKey: 'ingest.deriveSub',
  },
  {
    kind: 'cards',
    mins: 0.02,
    phases: ['cards'],
    labelKey: 'ingest.cardsLabel',
    subKey: 'ingest.cardsSub',
  },
];

/** 칸 수. 자리 계산은 문구를 풀지 않아도 된다. */
export const BOX_COUNT = SPECS.length;

/** 화면이 그릴 네 칸. **함수다** — 상수로 두면 로케일보다 먼저 굳는다 (D117). */
export const boxes = (): readonly Box[] =>
  SPECS.map((spec) => ({
    kind: spec.kind,
    mins: spec.mins,
    phases: spec.phases,
    label: t(spec.labelKey),
    sub: t(spec.subKey),
  }));

export interface Progress {
  phase: Phase;
  done: number;
  total: number;
}

/**
 * 지금 어느 칸에 있고 그 칸이 얼마나 찼는가.
 *
 * 한 칸이 단계 둘을 담으면 **칸 안에서도 되돌 수 있다** — 앞 단계가 10/10 으로 칸을 채운
 * 직후 뒤 단계가 0/10 으로 시작하기 때문이다. 그래서 칸 안의 자리를
 * `(단계 순번 + 그 단계의 진행) / 단계 수` 로 잰다: `walk` 10/10 은 0.5, `parse` 0/10 도
 * 0.5, `parse` 10/10 이 1.0 이다. 칸도 채움도 앞으로만 간다 (D110).
 */
export function positionOf(at: Progress | null): { pos: number; progress: number | undefined } {
  if (!at) return { pos: 0, progress: 0 };
  const pos = SPECS.findIndex((spec) => spec.phases.includes(at.phase));
  const spec = SPECS[pos];
  if (pos === -1 || spec === undefined) return { pos: 0, progress: 0 };
  const step = spec.phases.indexOf(at.phase);
  // `total` 이 0 이면 Rust 가 아직 총량을 모르는 것이다(커밋 수가 그렇다) — 그 단계가
  // 시작했다는 것까지만 세고 안쪽 진행은 비운다.
  const inner = at.total > 0 ? Math.min(1, at.done / at.total) : 0;
  const progress = (step + inner) / spec.phases.length;
  return { pos, progress: at.total > 0 || spec.phases.length > 1 ? progress : undefined };
}

/** 끝난 뒤의 자리 — 모든 칸이 찬 상태. */
export const DONE = { pos: BOX_COUNT, progress: 1 } as const;
