; 기다렸다 값 꺼내기. 반환 타입이 `Task<T>` 로 한 겹 감싸지고, `await` 없이 쓰면 값이 아니라
; 「아직 오지 않은 것」이 나온다.
;
; 구멍은 `await` 하나다 — `async` 는 같은 개념의 다른 자리이지만 두 낱말을 한 빈칸 항목으로
; 못 낸다(첫 보기가 구멍 원문이어야 한다).
((method_declaration
   (modifier) @pick.1
   returns: (_) @pick.2
   name: (identifier) @pick.3) @site
 (#eq? @pick.1 "async")
 (#set! form "async"))

((await_expression
   "await" @pick.1 @hole
   (_) @pick.2) @site
 (#set! form "await"))
