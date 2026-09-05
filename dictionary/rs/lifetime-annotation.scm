; 얼마나 오래 빌리나. 수명은 값의 생존을 **설명**할 뿐 늘리지 않는다 — 두 연구가 독립적으로
; 「가장 큰 벽」으로 잰 자리다 (rs-learning.md §11.1). 빈칸은 안 낸다 — `'a` 는 따옴표와 이름
; 두 토큰이라 보기 넷이 한 종류로 안 선다. yaml 의 `no_hole_reason`.
((reference_type
   "&" @pick.3
   (lifetime) @pick.1
   type: (_) @pick.2) @site
 (#set! form "ref-lifetime"))

((function_item
   name: (identifier) @pick.2
   type_parameters: (type_parameters "<" @pick.3 . (lifetime_parameter) @pick.1)) @site
 (#set! form "fn-lifetime"))

((struct_item
   name: (type_identifier) @pick.2
   type_parameters: (type_parameters "<" @pick.3 . (lifetime_parameter) @pick.1)) @site
 (#set! form "struct-lifetime"))
