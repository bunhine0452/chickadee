// 값이 있으면 그린다 — 견주지 않고 그대로 둔 조건.
export function render(items: string[], banner: string) {
  if (items) {
    draw(items);
  }
  if (banner) {
    draw([banner]);
  }
}

declare function draw(lines: string[]): void;
