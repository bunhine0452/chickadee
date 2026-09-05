// 조건에 따라 같은 이름이 다른 값을 가리킨다.
export function pickLabel(ready: boolean) {
  let label = "waiting";
  if (ready) {
    label = "ready";
  }
  return label;
}
