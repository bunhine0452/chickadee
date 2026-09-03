import { deeStandalone } from './deeStandalone';
import type { DeeSymbol } from './symbols';

/**
 * 스티커 한 판을 **그림 한 장**으로 굽는다 (05 §10 · D115).
 *
 * `<use href="#dee">` 는 인스턴스마다 6 경로(수천 점)를 다시 래스터한다 — 캐시가 없다.
 * 홈은 개념 줄마다 스티커를 하나 놓으므로 그 수가 수백이 되고, 05 §10 의 「화면당 ≤ 40
 * 인스턴스」를 열 배 넘긴다. 같은 그림을 data URI 로 한 번 만들어 두면 엔진이 **한 번만
 * 디코드**하고 나머지는 blit 이다.
 *
 * 그림은 `deeStandalone` 이 만든다 — 16px 실루엣 게이트가 재는 것과 **같은 문자열**이다.
 *
 * 판마다 한 장이면 되는 이유: Dee 팔레트(`--dee-paper`·`--dee-gray`·`--dee-blank`)에는
 * 야간반 갈래가 없다. 그 전제는 `tokens.test.ts` 가 지킨다.
 */
const cache = new Map<string, string>();

export function deeImageUrl(symbol: DeeSymbol, ly: number): string | null {
  const key = `${symbol}|${ly}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  // 스프라이트가 없으면 굽지 않는다. 컴포넌트 테스트는 `Dee` 하나만 그리고 그때는 `<use>` 로
  // 남는 것이 옳다 — 없는 문서를 읽어 던지면 화면이 아니라 하네스가 깨진다.
  if (document.getElementById('deePlates') === null) return null;
  const url = `url("data:image/svg+xml,${encodeURIComponent(deeStandalone(ly, symbol))}")`;
  cache.set(key, url);
  return url;
}

/** 테스트가 판을 갈아 끼울 때. 화면에서는 부르지 않는다. */
export function clearDeeImageCache(): void {
  cache.clear();
}
