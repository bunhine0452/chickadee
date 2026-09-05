; 채널로 주고받기. 타입(`chan T`) · 보내기 · 여러 채널 중 하나 고르기 셋을 잡는다.
; 채널에 **방향**이 있다는 것은 타입 자리에서만 보인다.
((var_spec
   name: (identifier) @pick.2
   type: (channel_type "chan" @pick.1 @hole value: (_) @pick.3)) @site
 (#set! form "decl"))

((send_statement
   channel: (_) @pick.2
   "<-" @pick.1 @hole
   value: (_) @pick.3) @site
 (#set! form "send"))

((call_expression
   function: (identifier) @pick.2
   arguments: (argument_list . (channel_type "chan" @pick.1 @hole value: (_) @pick.3))) @site
 (#eq? @pick.2 "make")
 (#set! form "make"))
