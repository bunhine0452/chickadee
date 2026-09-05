; 할 줄 아는 것의 목록. 두 자리가 한 개념이다 — 목록을 **적는 곳**과 그 목록을 **받겠다고
; 적는 곳**. Go 와 달리 자바는 `implements` 라고 적어야만 그 이름으로 받아진다.
((interface_declaration
   "interface" @pick.1 @hole
   name: (identifier) @pick.2
   body: (interface_body) @pick.3) @site
 (#set! form "declare"))

((super_interfaces
   "implements" @pick.1
   (type_list (_) @pick.2)) @site
 (#set! form "implements"))
