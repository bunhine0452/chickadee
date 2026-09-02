// 경로처럼 생긴 문자열이지만 가져오기가 아니다 — 부르는 이름이 require 가 아니다.
const CHART_PATH = './chart';

export function loadChart(loadModule: (p: string) => unknown) {
  return loadModule(CHART_PATH);
}
