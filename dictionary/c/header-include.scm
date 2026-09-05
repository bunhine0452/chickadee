; 다른 파일을 그 자리에 붙여 넣기. import 가 아니라 글자 복사다 — 두 번 넣으면 정의가 두 번 생기고,
; 그걸 막으려고 모든 헤더 첫 줄에 `#ifndef` 가 붙는다. 시스템 헤더와 내 헤더를 갈라 내고, 그 방벽
; (include guard)도 한 자리로 짚는다.
((preproc_include
   "#include" @pick.1 @hole
   path: (system_lib_string) @pick.2) @site
 (#set! form "system"))

((preproc_include
   "#include" @pick.1 @hole
   path: (string_literal) @pick.2) @site
 (#set! form "local"))

((preproc_ifdef
   "#ifndef" @pick.1
   name: (identifier) @pick.2
   (preproc_def "#define" @pick.3 name: (identifier))) @site
 (#set! form "guard"))
