/**
 * 한국어 카탈로그 — **키 집합의 정본**이다 (D117).
 *
 * 이 파일은 영역 파일을 모으기만 한다. 문구는 `ko/<영역>.ts` 에 있고, 영역을 가른 이유는
 * 세션 넷이 동시에 문구를 늘려도 같은 줄에서 부딪히지 않게 하기 위해서다. 새 영역이
 * 필요하면 파일을 하나 더 만들고 여기에 한 줄을 더한다 — **그 한 줄은 상위 세션이 쓴다.**
 *
 * 키 이름은 `화면.자리` 다. 같은 문구를 두 화면이 쓰면 키를 나누지 않고 하나를 공유한다.
 */
import { core } from './ko/core.js';
import { session } from './ko/session.js';
import { cards } from './ko/cards.js';
import { grading } from './ko/grading.js';
import { ui } from './ko/ui.js';
import { home } from './ko/home.js';
import { repos } from './ko/repos.js';
import { clone } from './ko/clone.js';
import { course } from './ko/course.js';
import { run } from './ko/run.js';

export const ko = {
  ...core,
  ...session,
  ...cards,
  ...grading,
  ...ui,
  ...home,
  ...repos,
  ...clone,
  ...course,
  ...run,
} as const;

/** 카탈로그가 가진 키 전부. `en` 은 이 중 일부만 가진다. */
export type MessageKey = keyof typeof ko;
