; 자리를 만들며 이름을 붙이는 줄. 구멍은 **타입 자리**다 — C++ 은 이름 앞에 무엇을 담을지 적는다.
;
; **`argument_list` 모양은 안 잡는다.** `Widget w(x);` 와 `Widget w(T *p);` 는 표면이 같은데
; 하나는 변수 초기화이고 하나는 함수 선언이다 — 문법 자신이 `prec.dynamic` 으로만 가르는
; 자리라(`cpp.md` §8 ②) 사전이 가르는 척하지 않는다. `= 값` 과 `{}` 두 모양만 든다.
((declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (init_declarator
     declarator: (identifier) @pick.2
     value: (_) @pick.3)) @site
 (#set! form "init"))

; 값을 안 적은 줄. 0 이 아니라 **정해지지 않은 값**으로 시작한다는 것이 이 판의 요점이다.
((declaration
   type: (primitive_type) @pick.1 @hole
   declarator: (identifier) @pick.2) @site
 (#set! form "bare"))
