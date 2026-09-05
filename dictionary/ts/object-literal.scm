; 이름표 붙은 묶음 만들기 — `{ id: 1 }`.
; 구조분해의 `{ a } = obj` 는 `object_pattern` 이라 여기 안 걸린다. 두 노드가 갈려 있는 덕에
; 「만드는 자리」와 「꺼내는 자리」가 섞이지 않는다.
; 첫 이름표 하나만 짚는다(`.` 앵커) — 안 그러면 이름표 수만큼 사용처가 부풀어 오른다.
((object
   . (pair key: (_) @pick.2 value: (_) @pick.3)) @site @pick.1
 (#set! form "pair"))

; 짧게 쓴 것 — `{ id }` 가 `{ id: id }` 다. 값 자리가 글자로 안 보이는 유일한 꼴이다.
((object
   . (shorthand_property_identifier) @pick.2) @site @pick.1
 (#set! form "shorthand"))
