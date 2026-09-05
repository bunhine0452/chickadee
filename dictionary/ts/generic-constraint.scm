; 타입 자리에 조건 걸기 — `extends` 가 여기서는 상속이 아니라 「적어도 이 모양은 되어야 한다」다.
((type_parameter
   name: (type_identifier) @pick.1
   constraint: (constraint (_) @pick.2)) @site
 (#set! form "constraint"))

; 조건 없이 기본값만 준 꼴 — 같은 자리의 다른 갈래라 나란히 잡는다.
((type_parameter
   name: (type_identifier) @pick.1
   value: (default_type (_) @pick.3)) @site
 (#set! form "default"))
