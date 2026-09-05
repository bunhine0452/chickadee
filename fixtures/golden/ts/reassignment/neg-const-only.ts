// 만들기만 하고 다시 묶지 않는다.
export function summary(name: string, count: number) {
  const title = name;
  const size = count;
  return { title, size };
}
