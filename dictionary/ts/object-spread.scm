; `{ ...base, n: 1 }` — 앞의 객체를 펼쳐 복사하고 뒤에서 덮어쓴다.
; `f(...args)` 의 펼치기는 부모가 객체가 아니라 걸리지 않는다.
; 여는 중괄호도 짚을 자리다 — 복사본이 시작되는 곳이 거기다.
((object
   "{" @pick.3
   (spread_element
     "..." @pick.2
     (_) @pick.1)) @site
 (#set! form "object"))
