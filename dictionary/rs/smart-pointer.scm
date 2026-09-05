; 규칙을 실행 시로 옮기기. `RefCell` 은 빌림 규칙을 **없애는 게 아니라** 어길 때 패닉으로 바꾼다.
; 네 리포 합쳐 26곳 — 합성이 정본이다. 구멍은 `Box`.
((generic_type
   type: (type_identifier) @pick.1 @hole
   type_arguments: (type_arguments "<" @pick.3 . (_) @pick.2)) @site
 (#any-of? @pick.1 "Box" "Rc" "RefCell" "Cell" "Cow" "Weak")
 (#set! form "pointer-type"))

((call_expression
   function: (scoped_identifier
     path: (identifier) @pick.1 @hole
     name: (identifier) @pick.2)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "Box" "Rc" "RefCell" "Cell")
 (#eq? @pick.2 "new")
 (#set! form "pointer-new"))

; `.borrow()` · `.borrow_mut()` — 컴파일러 대신 실행 시가 세는 빌림.
((call_expression
   function: (field_expression
     value: (_) @pick.2
     field: (field_identifier) @pick.1)
   arguments: (arguments) @pick.3) @site
 (#any-of? @pick.1 "borrow" "borrow_mut")
 (#set! form "runtime-borrow"))
