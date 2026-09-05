; 컴파일하면 통째로 사라지는 줄들. 「사라진다」를 정적으로 보이는 자리가 이 셋이다 —
; 타입 전용 선언 둘과 타입만 들여오는 import 하나. 셋 다 돌아가는 코드에 한 글자도 안 남는다.
((interface_declaration name: (_) @pick.1 body: (_) @pick.2) @site
 (#set! form "interface"))

((type_alias_declaration name: (_) @pick.1 value: (_) @pick.2) @site
 (#set! form "alias"))

((import_statement "type" @pick.3 source: (string) @pick.1) @site
 (#set! form "type-import"))
