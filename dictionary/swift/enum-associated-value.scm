; 경우마다 값 데리고 다니기. 다른 언어의 `enum` 은 이름표 하나인데 Swift 는 경우마다
; 다른 값을 데리고 다닌다 — `data_contents:` 가 그 값 목록이다.
((enum_entry
   "case" @pick.1 @hole
   name: (simple_identifier) @pick.2
   data_contents: (enum_type_parameters) @pick.3) @site
 (#set! form "assoc"))
