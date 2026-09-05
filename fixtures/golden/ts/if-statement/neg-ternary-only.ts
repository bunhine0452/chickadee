// 값을 고르는 표기이지 흐름을 가르는 문이 아니다.
export function label(ready: boolean) {
  const text = ready ? "ready" : "waiting";
  return text;
}
