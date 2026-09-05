// 조건마다 견주어 참·거짓을 만든다.
export function render(items: string[], count: number) {
  if (items.length > 0 && count !== 0) {
    draw(items);
  }
}

declare function draw(lines: string[]): void;
