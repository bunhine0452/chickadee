import type { DeeSymbol } from './symbols';
import { SYMBOL_ID } from './symbols';

/** 판 변수 7개. 겹마다 값이 달라지는 것은 `dee.css` 의 `[data-ly]` 규칙이 정한다. */
const PLATE_VARS = ['--lpaper', '--lk', '--lg', '--lb', '--lt', '--lp', '--ly'] as const;

/**
 * 화면의 Dee 스프라이트를 **자립형 SVG 문자열**로 뽑는다 (목업 `audit.deeStandalone`).
 *
 * `<use href="#deePlates">` 와 `var(--l*)` 는 문서 밖에서 풀리지 않는다 — 판을 제자리에
 * 펼치고 변수를 그 겹의 실제 색으로 바꿔야 이미지로 그려진다.
 *
 * 겹에 따른 판 색을 여기 표로 베끼지 않는다. `dee.css` 와 갈라지기 때문이다 — 실제 요소를
 * 하나 세워 계산된 값을 읽는다. 그래서 이 함수는 **문서가 있어야** 돈다.
 *
 * 두 곳이 쓴다: 06 §2 의 16px 실루엣 게이트와, 스티커의 배경 그림(`deeImageUrl`).
 * 같은 문자열이어야 게이트가 재는 것과 화면에 뜨는 것이 같다.
 */
export function deeStandalone(ly: number, symbol: DeeSymbol = 'badge'): string {
  const node = document.getElementById(SYMBOL_ID[symbol]);
  const plates = document.getElementById('deePlates');
  if (node === null || plates === null) {
    throw new Error('Dee 스프라이트가 문서에 없다 — `DeeSprite` 가 그려졌는지 봐라');
  }

  const probe = document.createElement('div');
  probe.className = 'dee';
  probe.setAttribute('data-ly', String(ly));
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:0;height:0';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const value: Record<string, string> = {};
  for (const name of PLATE_VARS) value[name] = cs.getPropertyValue(name).trim();
  const gray = cs.getPropertyValue('--dee-gray').trim() || '#9CA7AD';
  probe.remove();

  const body = node.innerHTML
    .replace(/<use[^>]*href="#deePlates"[^>]*>(?:<\/use>)?/g, plates.innerHTML)
    .replace(/var\(\s*(--l[a-z]+)\s*\)/g, (whole, name: string) => value[name] ?? whole);

  // 1·2겹의 판은 `url("#htGrayL")` 이라 그 패턴도 같이 실어야 한다.
  const defs = `<defs><pattern id="htGrayL" width="16" height="16" patternUnits="userSpaceOnUse"`
    + ` patternTransform="rotate(22)"><circle cx="8" cy="8" r="4.4" fill="${gray}"/></pattern></defs>`;
  const viewBox = node.getAttribute('viewBox') ?? '0 0 430 430';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100" height="100">`
    + `${defs}${body}</svg>`;
}
