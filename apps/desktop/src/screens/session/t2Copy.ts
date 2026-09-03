/**
 * T2 판의 한국어 문구 (05 §5 · 04 §8). `t1Copy.ts` 와 같은 자리다 — 문구를 화면에서 떼어
 * 두면 조판 규칙(짧은 평서문·`keep-all`)을 한곳에서 지킬 수 있다.
 *
 * 카드에 구워진 문구(질문·힌트·사유)는 여기 없다. 그것은 생성 시점에 렌더된 최종
 * 문자열이고(D74) 리포마다 다르다. 여기 있는 것은 **어느 리포에서나 같은** 말뿐이다.
 */
import type { T2Result } from '@chickadee/grading';

/** 판 머리의 종별 이름. `card.kind` 그대로 온다. */
export const KIND_NAME = {
  placement: '책임 배치',
  radius: '영향 반경',
  flow: '흐름 추적',
  direction: '의존성 방향',
} as const;

/** 종별 부제 — 「무엇으로 채점하는가」를 먼저 말한다 (정본 §2). */
export const KIND_SUB = {
  placement: '정답지 = 실제 커밋 · 부분 점수',
  radius: '정답지 = 지도의 화살표 방향 · 부분 점수',
  flow: '정답지 = 지도의 경로',
  direction: '5문항 · 지도를 보고 답해도 됩니다',
} as const;

/** 지도 아래 안내 두 줄. 목업 `.map-status` 의 기본 문장이다. */
export const MAP_HINT = '정답을 맞히는 게 목적이 아니라, 내 프로젝트가 어떻게 나뉘어 있는지 감을 잡는 게 목적입니다.';

/** 채점 머리의 제목. 04 §8.2 의 문턱(85·65)과 같은 자리에서 갈린다. */
export function verdictTitle(result: T2Result): string {
  if (result.pct === 100) return '완벽합니다';
  if (result.verdict === 'advance') return '거의 맞았어요';
  if (result.pct >= 65) return '거의 맞았어요';
  return '다시 한 번 볼까요';
}

/** 길잡이 한 줄 — 채점 직후 Dee 가 하는 말. */
export function guideAfter(result: T2Result): { say: string; motion: 'hop' | 'tilt' } {
  if (result.pct === 100) return { say: '완벽해요. 층을 다 짚었어요.', motion: 'hop' };
  if (result.pct >= 85) return { say: '거의 맞았어요. 놓친 자리가 깜빡여요.', motion: 'hop' };
  return { say: '놓친 파일부터 봐요. 거기가 오늘의 핵심이에요.', motion: 'tilt' };
}

/**
 * 라이브 리전 문구 (05 §7). 도장과 색이 나르는 것을 글자로도 나른다.
 * 「꼭 고쳐야 할」은 core 의 화면 이름이다 — 목업이 쓰는 말 그대로.
 */
export function liveAfter(result: T2Result): string {
  const core = result.found.length + result.missed.length;
  return `채점했습니다. 꼭 고쳐야 할 ${core}개 중 ${result.found.length}개를 찾았습니다.`;
}

/** 힌트 버튼 문구. 감점이 아니라는 것을 버튼 자체가 말한다 (정본 §3-1). */
export const HINT_NOTE = '힌트는 감점이 아닙니다. 놓친 파일은 채점 뒤 지도에서 깜빡입니다.';

/** 「이것도 맞다」 — 접수 전후 문구 (04 §8.4). */
export const APPEAL_IDLE = '이것도 맞다고 생각해요';
export const APPEAL_DONE = '「이것도 맞다」 의견 접수됨';
export const APPEAL_NOTE = '정답지는 커밋 1건이라 더 넓은 정답이 있을 수 있어요. 같은 의견이 쌓이면 이 문제의 정답지를 넓힙니다.';
