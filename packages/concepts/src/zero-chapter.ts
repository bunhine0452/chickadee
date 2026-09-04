/**
 * 「0장 — 이 언어의 바닥」 (D136 · 정본 §4 · 방안 E-2).
 *
 * 그 언어를 처음 보는 사용자 앞에 붙는 **유한한 프롤로그**다. 별도 입문 과정이 아니다 —
 * 정본 §4 가 거부한 것은 「과정」이고, E-2 가 채택 상태로 남긴 것이 이 「프롤로그」다.
 *
 * 이 파일이 지켜야 하는 것은 하나다: **끝이 있다.** 상한 {@link ZERO_CHAPTER_MAX} 와
 * {@link isDone} 의 조건 셋이 「일반 튜토리얼로의 변질」을 막는 유일한 방벽이고, 둘 다
 * 테스트로 못박혀 있다. 재료를 늘리고 싶으면 그 테스트를 먼저 고쳐야 한다 — 일부러 그렇게
 * 두었다.
 *
 * 담기는 것의 우선순위 (D136):
 *   ① 내 코드의 뿌리 사용처 — 미지가 적어 지금 열 수 있는 것
 *   ② 사용처는 있는데 미지가 많아 아직 못 여는 것 → 합성 예제 + 그 사용처 예고 (D137)
 *   리포에 사용처가 **아예 없는** 개념은 넣지 않는다. 예고할 자리가 없으면 E-4 의 규칙을
 *   지킬 수 없고, 지킬 수 없으면 만들지 않는 것이 맞다.
 */
import {
  NEWCOMER_CLEAR_OKS, NEWCOMER_MIN_ROOT_NEW,
  prereqDepth, type BestSite, type NewcomerFlag, type RootResult,
} from './new-rank.js';
import { MAX_UNKNOWN_FOR_NEW, type LayerOf } from './unknown-rank.js';

/**
 * 0장에 담기는 판의 최대 수. 하루 새 판 2장(D12)이라 **12일**이면 끝난다.
 *
 * 8 → 24 (D147 — 프로그래밍이 처음인 사용자를 대상에 넣으면서). 이것은 길이가 아니라
 * **천장**이다. 그 언어를 이미 아는 사람은 {@link isDone} 의 둘째 조건(뿌리 4장 중 3장)으로
 * 네댓 장에서 빠져나가 24장을 다 보지 않는다 — 그 조건이 초보에게만 꺼진다.
 */
export const ZERO_CHAPTER_MAX = 24;

/**
 * 0장 대지의 `unit.name`. **화면에 나오지 않는 안정 키다** — 라벨은 `t('home.zeroChapter')`
 * 가 낸다. 대지 이름은 `(repo_id, name)` 유일 키라 로케일을 타면 언어를 바꿀 때마다 대지가
 * 하나씩 늘어난다 (D117 · D118).
 */
export const ZERO_CHAPTER_UNIT = '__zero__';

/** 색인 띠 맨 앞에 세우는 순번. `home.units` 가 `order_idx` 로 정렬한다. */
export const ZERO_CHAPTER_ORDER = -1;

/**
 * 0장에 드는 개념의 선행 깊이 상한. 뿌리(0)에서 두 단(2) 위까지다.
 *
 * 1 → 2 (D147). **고르는 근거는 안 바뀌었다** — 후보가 상한 언저리에 오게 두어 「무엇을
 * 자를까」가 임의의 문제가 되지 않게 하는 값을 고른다. 상한이 8 이던 때는 그 값이 1 이었고,
 * 24 이면서 사전에 바닥 개념(조건문·함수 정의·`return`·비교·재대입·반복문)이 들어온 뒤로는
 * 2 다. 상한을 또 옮기면 이 값도 같은 규칙으로 다시 고른다.
 */
export const ZERO_CHAPTER_MAX_DEPTH = 2;

/** 0장 판 하나. */
export interface ZeroChapterPlate {
  conceptId: string;
  /** 내 코드의 사용처. `null` 이면 합성 예제 자리다 (D137). */
  siteId: number | null;
  /**
   * 합성일 때 「곧 여기서 봅니다」로 예고할 사용처 (E-4). 합성이 아니면 `null`.
   * 합성인데 이 값이 없는 판은 **만들어지지 않는다** — {@link zeroChapterPlates} 가 거른다.
   */
  previewSiteId: number | null;
  /** 후보 집합 안에서의 선행 깊이. 0 이 뿌리다. */
  depth: number;
}

export interface ZeroChapterInput {
  /** 그 언어 `_lang.yaml` 의 `essential`. */
  essential: readonly string[];
  prereqOf: (conceptId: string) => readonly string[];
  /** 개념 → 내 코드의 첫 노출. 리포에 사용처가 없으면 `null`. */
  bestSiteOf: (conceptId: string) => BestSite | null;
}

/**
 * 0장 대지를 **만들 것인가**. 그 언어 essential 중 1겹 이상이 하나도 없을 때만 참이다.
 *
 * 원장을 볼 뿐 사용자에게 아무것도 묻지 않는다 — 별도 배치고사를 만들지 않는다는 결정
 * (정본 §4 · 방안 E-5)이 여기서도 그대로다. 한 번 만든 대지는 이 값이 거짓이 되어도
 * 사라지지 않는다(대지 행이 이미 있다) — 끝남은 {@link isDone} 이 따로 판정한다.
 */
export function shouldOpen(essential: readonly string[], layerOf: LayerOf): boolean {
  return essential.length > 0 && essential.every((id) => layerOf(id) === 0);
}

/**
 * 0장에 담을 판을 순서대로. 최대 {@link ZERO_CHAPTER_MAX} 장이다.
 *
 * 정렬은 ① 내 코드 사용처가 먼저(합성은 뒤) ② 선행 깊이 ③ 미지 적은 것 ④ id 다.
 * ①이 먼저인 것이 「내 코드가 교재」의 첫째 방벽이다 — 웬만한 리포에 `const`·문자열·숫자·
 * 속성 접근·호출이 없을 수 없으므로 실제로 합성은 0~2장에 그친다.
 */
export function zeroChapterPlates(input: ZeroChapterInput): ZeroChapterPlate[] {
  const depth = prereqDepth(input.essential, input.prereqOf);

  const rows = input.essential.flatMap((conceptId) => {
    const d = depth.get(conceptId) ?? 0;
    if (d > ZERO_CHAPTER_MAX_DEPTH) return [];
    const best = input.bestSiteOf(conceptId);
    // 리포에 사용처가 없다 — 예고할 자리가 없으므로 0장에 넣지 않는다 (D137).
    if (best === null) return [];
    const synthetic = best.unknown > MAX_UNKNOWN_FOR_NEW;
    return [{
      conceptId,
      siteId: synthetic ? null : best.siteId,
      previewSiteId: synthetic ? best.siteId : null,
      depth: d,
      unknown: best.unknown,
    }];
  });

  return rows
    .sort(
      (a, b) =>
        Number(a.siteId === null) - Number(b.siteId === null)
        || a.depth - b.depth
        || a.unknown - b.unknown
        || a.conceptId.localeCompare(b.conceptId),
    )
    .slice(0, ZERO_CHAPTER_MAX)
    .map(({ conceptId, siteId, previewSiteId, depth: d }) => ({
      conceptId, siteId, previewSiteId, depth: d,
    }));
}

/**
 * 뿌리 개념 4장 중 3장을 맞힌 세션이 나왔는가 — {@link isDone} 의 둘째 조건.
 *
 * `newcomerFlag` 의 첫 분기와 **같은 상수**를 쓴다(02 §6.4). 0장을 위해 새 임계를 만들면
 * 두 곳이 따로 움직여 「초보라고 판단하는 선」과 「0장을 닫는 선」이 어긋난다.
 */
export function rootCleared(results: readonly RootResult[]): boolean {
  const oks = results.filter((r) => r.ok && !r.dunno).length;
  return results.length >= NEWCOMER_MIN_ROOT_NEW && oks >= NEWCOMER_CLEAR_OKS;
}

export interface ZeroChapterDoneInput {
  plates: readonly ZeroChapterPlate[];
  layerOf: LayerOf;
  newcomer: NewcomerFlag;
  /** {@link rootCleared} 의 값. */
  cleared: boolean;
  /** 설정 「학습」에서 껐는가. */
  disabled: boolean;
  /**
   * 첫 실행에서 「프로그래밍이 처음」이라고 답했는가 (D147). 참이면 **둘째 조건이 꺼진다** —
   * 뿌리 넉 장을 운으로 맞혀 12일치 프롤로그가 나흘에 닫히는 것을 막는다. 설정 「학습」에서
   * 언제든 바꿀 수 있고, 바꾸면 다음 판정부터 적용된다.
   */
  declaredNewcomer: boolean;
}

/**
 * 0장이 끝났는가. 셋 중 하나면 끝이다 (D136 · D147) —
 *   ① 담긴 개념이 모두 1겹 이상 ② 초보가 아니고 뿌리 4장 중 3장을 맞힌 세션이 나옴
 *   ③ 설정에서 끔.
 *
 * ②는 **스스로 초보라고 답한 사용자에게는 적용되지 않는다**(D147). 그 조건은 「이 언어만
 * 처음인 숙련자」를 빨리 내보내려고 있는 것이라, 프로그래밍이 처음인 사람에게 그대로 걸면
 * 늘려 놓은 상한이 무의미해진다.
 *
 * 끝나도 색인 띠의 칩은 **완료 도장과 함께 남는다** — 다시 열 수 있다. 잠그는 것은 없다.
 */
export function isDone(input: ZeroChapterDoneInput): boolean {
  if (input.disabled) return true;
  if (!input.declaredNewcomer && input.newcomer === 'none' && input.cleared) return true;
  return input.plates.length > 0 && input.plates.every((p) => input.layerOf(p.conceptId) >= 1);
}
