; 없을 수 있는 값 건너뛰기. 트리에서 `?.` 과 `.` 은 같은 노드라 **물음표가 붙어 있는지**로만
; 갈린다 (swift.md §8 함정 ③). 물음표는 `navigation_expression` 의 자식이고 이름이 없어
; 글자로 잡는다.
((navigation_expression
   target: (_) @pick.2
   "?" @pick.1
   suffix: (navigation_suffix suffix: (simple_identifier) @pick.3)) @site
 (#set! form "chain"))

; 첨자를 건너뛰는 꼴 — `arr?[0]`.
((call_expression
   (navigation_expression target: (_) @pick.2 "?" @pick.1)
   (call_suffix (value_arguments "[" (value_argument value: (_) @pick.3)))) @site
 (#set! form "chain-subscript"))
