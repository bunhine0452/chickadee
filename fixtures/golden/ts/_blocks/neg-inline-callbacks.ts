// 화살표가 이름에 묶이지 않고 인자로만 지나간다 — 덩어리로 떼어 낼 것이 없다.
export const ids = rows.map((row) => row.id);
export const open = rows.filter((row) => !row.done).map((row) => row.id);
