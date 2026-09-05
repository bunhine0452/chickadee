; 함수 부르기. 부르려면 컴파일러가 먼저 알아야 한다 — `printf` 는 언어가 아니라 `stdio.h` 가 준다.
; 첫 인자를 앵커(`.`)로 하나만 짚는다 — 인자마다 매치가 갈라져 같은 자리가 여러 번 잡히지 않게.
; 구조체 안의 함수 포인터를 부르는 `ops->run(x)` 는 `c/function-pointer` 의 것이라 여기 안 든다.
((call_expression
   function: (identifier) @pick.1
   arguments: (argument_list . (_)? @pick.3) @pick.2) @site
 (#set! form "call"))
