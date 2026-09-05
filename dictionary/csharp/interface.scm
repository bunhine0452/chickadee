; 할 수 있는 일만 정하기. 이름 앞의 `I` 는 관용일 뿐이고 문법이 아니다.
; 구현하는 쪽은 `base_list` 에 이름만 적으므로 「무엇을 약속했나」는 이쪽 선언에만 적혀 있다.
((interface_declaration
   "interface" @pick.1 @hole
   name: (identifier) @pick.2
   body: (declaration_list) @pick.3) @site
 (#set! form "interface"))
