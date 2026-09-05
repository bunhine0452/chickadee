; 타입 자리를 비워 두는 선언. 각괄호가 **선언 쪽**에 서면 자리를 여는 것이고,
; 쓰는 쪽(`List<String>`)에 서면 그 자리를 채우는 것이다 — 노드가 다르다
; (`type_parameters` 대 `type_arguments`).
;
; 경계(`<T extends …>`)는 `java/generic-bound` 의 자리다. 여기는 **비어 있는 자리 자체**를
; 짚고, 그 자리가 실행 때 지워진다는 것이 이 판의 요점이다.
;
; 구멍은 안 뚫는다 — 정답이 각괄호 한 쌍이라 보기가 사전 문장에 들어가면 태그로 읽힌다.
; yaml 의 `no_hole_reason` 을 보라.
((class_declaration
   "class" @pick.4
   name: (identifier) @pick.2
   type_parameters: (type_parameters) @pick.1
   body: (class_body) @pick.3) @site
 (#set! form "class"))

((method_declaration
   (type_parameters) @pick.1
   type: (_) @pick.4
   name: (identifier) @pick.2
   parameters: (formal_parameters) @pick.3) @site
 (#set! form "method"))
