// 옛 파일 — `var` 는 lexical_declaration 이 아니라 variable_declaration 이다.
var cartCount = 0;

function bumpCart() {
  var next = cartCount + 1;
  cartCount = next;
  return cartCount;
}
