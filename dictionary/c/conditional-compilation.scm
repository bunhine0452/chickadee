; 갈래 하나만 컴파일하기. 한 파일에 두 갈래가 다 적혀 있는데 하나만 컴파일된다 — 어느 쪽이 사는지는
; 빌드 옵션이 정한다. 파서는 두 갈래를 다 트리에 두므로 캡처가 둘 다 뜬다(c.md §8 ②).
; 방벽(`#ifndef X` + `#define X`)도 이 노드라 `c/header-include` 와 겹친다 — 그것도 조건부 컴파일이다.
((preproc_ifdef
   ["#ifdef" "#ifndef"] @pick.1 @hole
   name: (identifier) @pick.2
   alternative: (_)? @pick.3) @site
 (#set! form "ifdef"))

((preproc_if
   "#if" @pick.1 @hole
   condition: (_) @pick.2
   alternative: (_)? @pick.3) @site
 (#set! form "if"))
