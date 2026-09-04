/**
 * `t(key, vars)` — 화면 문구가 로케일을 만나는 유일한 자리 (D117).
 *
 * 템플릿 엔진을 새로 만들지 않는다. `@chickadee/text` 의 `render()` 필터 연쇄 **위에**
 * 올린 얇은 층이고, 이 파일이 더하는 것은 셋뿐이다 — 카탈로그 고르기, `ko` 폴백,
 * 그리고 `en` 에서 조사 필터를 끄는 것.
 *
 * 로케일은 모듈 상태다. 프로바이더로 200 파일을 꿰지 않는 이유는 전환이 `location.reload()`
 * 이기 때문이다(D117) — 한 번 세우면 그 프로세스가 사는 동안 바뀌지 않는다.
 */
import { isMissing, render, type TemplateVars } from '@chickadee/text';

import { en, ko, type MessageKey } from './catalog.js';
import { detectLocale, type Locale } from './locale.js';

let current: Locale = 'ko';

export const getLocale = (): Locale => current;

/** 부팅이 `settings.locale` 을 읽어 한 번 부른다. 그 뒤로 바꾸지 않는다. */
export function setLocale(locale: Locale): void {
  current = locale;
}

/** 저장된 값이 없을 때 쓰는 추정값. 첫 실행 0단계가 이 값을 미리 고른 채로 뜬다. */
export const guessLocale = detectLocale;

/** 지금 로케일에서 이 키의 원문. 없으면 `ko` — 화면에 빈 자리를 내지 않는다. */
export function template(key: MessageKey): string {
  if (current === 'en') {
    const value = en[key];
    if (value !== undefined) return value;
  }
  return ko[key];
}

/**
 * 문구 하나. 결과는 **평문**이다 — 치환값을 이스케이프하지 않으므로 React 자식으로
 * 그대로 넣는다. HTML 로 그릴 문구(`RichText`)가 생기면 그때 `tHtml` 을 따로 낸다.
 *
 * 변수가 모자라면 빈 문자열이 아니라 **원문을 그대로** 돌려준다. `{{name}}` 이 화면에
 * 보이는 편이 문장이 소리 없이 반 토막 나는 것보다 낫다(02 §8.1 무음 손상 금지).
 */
export function t(key: MessageKey, vars: TemplateVars = {}): string {
  const tpl = template(key);
  const result = render(tpl, vars, { josa: current === 'ko', escape: false });
  return isMissing(result) ? tpl : result.text;
}
