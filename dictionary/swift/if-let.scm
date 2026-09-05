; 없음을 벗겨 이름 붙이기. 벗겨진 값에 **새 이름**이 생기고 그 이름은 블록 안에서만 산다.
; `condition:` 이 되풀이 필드라 `=` 를 못으로 박아야 오른쪽 식이 잡힌다.
((if_statement
   (value_binding_pattern mutability: _ @pick.1 @hole)
   bound_identifier: (simple_identifier) @pick.2
   "="
   condition: (_) @pick.3) @site
 (#set! form "iflet"))

; 짧은 꼴 — `if let name { … }` (Swift 5.7). 오른쪽이 없어 이름 하나만 적는다.
; 짧은 꼴 `if let name {` — 바인딩 패턴 자체가 `condition` 필드에 온다(긴 꼴은 식이 그 자리).
((if_statement
   condition: (value_binding_pattern mutability: _ @pick.1 @hole)
   bound_identifier: (simple_identifier) @pick.2
   . (statements) @pick.3) @site
 (#set! form "iflet-short"))
