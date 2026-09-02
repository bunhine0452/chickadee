// 인터페이스의 타입 자리는 함수 선언도 호출도 아니다.
export interface Page<T> {
  rows: T[];
  total: number;
}

export const EMPTY: Page<Order> = { rows: [], total: 0 };
