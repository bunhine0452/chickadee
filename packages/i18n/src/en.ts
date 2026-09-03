/**
 * 영어 카탈로그 — `ko` 의 부분집합이다 (D117). 없는 키는 `ko` 로 폴백한다.
 *
 * 인쇄소 은유(대지 = sheet · 판 = plate · 겹 = layer · 인쇄 = print)는 영어에서도 그대로
 * 간다 — 화면 전체가 그 은유 위에 서 있어서 여기만 평범한 낱말로 풀면 나머지와 어긋난다.
 *
 * 조사 필터(`|josa:`)는 쓰지 않는다. 03 §5.1 린트와 `catalog.test.ts` 가 막는다.
 */
import type { MessageKey } from './ko.js';

export const en: Partial<Record<MessageKey, string>> = {
  // 'locale.ko' · 'locale.en' 은 일부러 비운다 — 언어 이름은 그 언어로 적는다.

  'firstRun.note':
    'Your own vibe-coded repo is the textbook. Register one and Chickadee reads its '
    + 'commits and files, lays a sheet per feature, and sets plates from the grammar your '
    + 'code actually uses. It only reads — nothing is written back to the repo.',
  'firstRun.language': 'Display language',
  'firstRun.languageSwitch': 'Choose a display language — 한국어 · English',
  'firstRun.pick': 'Add a repo',

  'settings.look.locale': 'Display language',
  'settings.look.localeSwitch': 'Display language 한국어 · English',
  'settings.look.localeNote':
    'Changing the language redraws the screen. Anything not translated yet shows in Korean.',
};
