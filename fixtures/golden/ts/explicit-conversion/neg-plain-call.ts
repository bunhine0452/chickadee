// 부르기는 하지만 종류를 바꾸지 않는다.
export function load(raw: string) {
  return parse(raw);
}

declare function parse(raw: string): unknown;
