; 상자 새로 만들기. 구멍은 `new` 라는 고정 낱말이고, 오답은 다른 언어가 같은 자리에 쓰는 낱말이다.
; 「이름이 상자를 가리키기만 한다」가 이 개념이 지는 규칙이다.
((object_creation_expression
   "new" @pick.1 @hole
   type: (_) @pick.2
   arguments: (argument_list) @pick.3) @site
 (#set! form "new"))
