; `str` 은 글자, `bytes` 는 바이트. `len("가")` 는 1 인데 `len("가".encode())` 는 3 이다.
; 그 다리가 코드에 적히는 자리는 `.encode()` · `.decode()` · `encoding=` 셋이고,
; 사용자 리포 둘에서 이 셋이 개념의 사용처 거의 전부다.
;
; `len(...)` 은 안 잡는다 — 리스트·사전·집합에도 같은 함수가 쓰여서 「무엇을 세고 있나」가
; 그 줄에 안 적혀 있다. 글자 길이임이 코드에 보이는 자리는 **문자열 리터럴을 세는 곳**뿐이다.

; 글자 → 바이트, 바이트 → 글자.
((call
   function: (attribute
               object: (_) @pick.2
               attribute: (identifier) @pick.1)
   arguments: (argument_list) @pick.3) @site
 (#match? @pick.1 "^(encode|decode)$")
 (#set! form "bridge"))

; `encoding="utf-8"` — 어느 규칙으로 옮길지를 적는 자리. 안 적으면 OS 가 정한다.
((keyword_argument
   name: (identifier) @pick.1
   "=" @pick.3
   value: (string) @pick.2) @site
 (#eq? @pick.1 "encoding")
 (#set! form "encoding"))

; 문자열 리터럴의 길이 — 무엇을 세는지가 그 줄에 그대로 보인다.
((call
   function: (identifier) @pick.1
   arguments: (argument_list "(" @pick.3 . (string) @pick.2)) @site
 (#eq? @pick.1 "len")
 (#set! form "count"))
