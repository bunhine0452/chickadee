// 이 런타임이 다루는 수의 양 끝을 적어 둔다.
export const range = {
  low: Number.MIN_SAFE_INTEGER,
  high: Number.MAX_SAFE_INTEGER,
  widest: Number.MAX_VALUE,
};

export const whole = (n: number) => Number.isInteger(n);
