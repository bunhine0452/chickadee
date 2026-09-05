; 내가 대신 보증하기. 검사를 끄는 게 아니라 「컴파일러가 확인하던 것을 내가 보증한다」는
; 표시다 — 빌림 검사기는 그대로 돈다. 네 리포 합쳐 11곳, `forbid(unsafe_code)` 인 리포도 있다.
; 구멍은 `unsafe`.
((unsafe_block
   "unsafe" @pick.1 @hole
   (block "{" @pick.3) @pick.2) @site
 (#set! form "unsafe-block"))

((function_item
   (function_modifiers "unsafe" @pick.1 @hole)
   name: (identifier) @pick.2
   parameters: (parameters) @pick.3) @site
 (#set! form "unsafe-fn"))

; `extern "C" { … }` — 바깥 언어의 함수. 부르는 쪽이 전부 `unsafe` 다.
((foreign_mod_item
   (extern_modifier) @pick.1
   body: (declaration_list "{" @pick.3) @pick.2) @site
 (#set! form "extern"))
