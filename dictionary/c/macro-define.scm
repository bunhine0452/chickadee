; 컴파일 전에 글자 바꿔치기. 함수가 아니라 글자 치환이라 `MAX(i++, j)` 가 `i` 를 두 번 늘린다.
; 매크로 몸통은 트리에 없다 — `preproc_arg` 는 불투명 토큰 하나다 (c.md §8 ④).
; 값 없는 `#define X` 는 방벽의 표시라 `c/header-include` 의 것이다.
((preproc_def
   "#define" @pick.1 @hole
   name: (identifier) @pick.2
   value: (preproc_arg) @pick.3) @site
 (#set! form "object"))

((preproc_function_def
   "#define" @pick.1 @hole
   name: (identifier) @pick.2
   parameters: (preproc_params) @pick.3
   value: (preproc_arg)) @site
 (#set! form "function-like"))
