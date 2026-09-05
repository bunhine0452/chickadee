// 이름 하나가 줄마다 다른 값을 가리킨다.
export function countUp(start: number) {
  let attempts = start;
  attempts = 0;
  let label = "";
  label = "done";
  return { attempts, label };
}
