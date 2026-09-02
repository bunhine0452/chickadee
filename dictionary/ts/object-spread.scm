; `{ ...base, n: 1 }` — 앞의 객체를 펼쳐 복사하고 뒤에서 덮어쓴다.
; `f(...args)` 의 펼치기는 부모가 객체가 아니라 걸리지 않는다.
((object
   (spread_element
     "..." @pick.2
     (_) @pick.1)) @site
 (#set! form "object"))
