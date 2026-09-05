; 타입을 안 적고 이름 만들기. 요점은 「타입이 없다」가 아니라 **오른쪽을 보고 정한다**이고,
; 그 정하기가 참조와 못 만진다는 약속을 **떼어 낸다**는 것이다 (`cpp.md` §9 #12).
((declaration
   type: (placeholder_type_specifier) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "auto"))

; 참조를 도로 붙인 것 — 여기서는 복사가 안 일어난다. 한 글자가 줄을 하나 그릴지 둘 그릴지 정한다.
((declaration
   type: (placeholder_type_specifier) @pick.1 @hole
   declarator: (init_declarator
     declarator: (reference_declarator (identifier) @pick.2)
     value: (_) @pick.3)) @site
 (#set! form "autoref"))
