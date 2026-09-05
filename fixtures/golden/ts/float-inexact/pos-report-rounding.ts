// 보고서에 실릴 값만 자릿수를 줄인다.
export function report(ratio: number, score: number) {
  return {
    ratio: ratio.toFixed(3),
    score: score.toPrecision(4),
  };
}
