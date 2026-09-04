/**
 * 영어 카탈로그 — `ko` 의 부분집합이다 (D117). 없는 키는 `ko` 로 폴백한다.
 *
 * 인쇄소 은유(대지 = sheet · 판 = plate · 겹 = layer · 인쇄 = print)는 영어에서도 그대로
 * 간다 — 화면 전체가 그 은유 위에 서 있어서 여기만 평범한 낱말로 풀면 나머지와 어긋난다.
 *
 * `ko.ts` 와 같은 이유로 영역별로 갈라 두었다. 문구는 `en/<영역>.ts` 에 있다.
 */
import { core } from './en/core.js';
import { session } from './en/session.js';
import { cards } from './en/cards.js';
import { grading } from './en/grading.js';
import { ui } from './en/ui.js';
import { home } from './en/home.js';
import { repos } from './en/repos.js';
import { clone } from './en/clone.js';
import type { MessageKey } from './ko.js';

export const en: Partial<Record<MessageKey, string>> = {
  ...core,
  ...session,
  ...cards,
  ...grading,
  ...ui,
  ...home,
  ...repos,
  ...clone,
};
