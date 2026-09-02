// 많이 팔린 순 상위 다섯 — 거르고, 정렬하고, 자른 뒤 이름만 남긴다.
export function topSellers(products: Product[]) {
  return products
    .filter((product) => product.sold > 0)
    .sort((one, other) => other.sold - one.sold)
    .slice(0, 5)
    .map((product) => product.name);
}
