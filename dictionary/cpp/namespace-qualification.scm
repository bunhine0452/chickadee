; 이름공간 안의 이름. 점은 **값 안**을 열고 이 기호는 **이름 안**을 연다 — 그 갈림이 이 판이다.
((qualified_identifier
   scope: (namespace_identifier) @pick.2
   "::" @pick.1 @hole
   name: (_) @pick.3) @site
 (#set! form "qualified"))
