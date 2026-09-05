; **기본값은 정의할 때 딱 한 번 만들어진다.** 리스트를 기본값으로 두면 부를 때마다 같은
; 리스트가 오고 쌓인다 — 공식 FAQ 가 "Default values are created exactly once, when the
; function is defined" 로 적어 둔 자리다.
;
; 그 함정이 **표본에 0곳**이다 (`py-learning.md` §11.5 ① — `def f(x=[])`·`={}`·`=set()` 이
; adelie 139파일 · ECC 63파일에서 0곳). 사유는 `scale` 이 아니라 **`idiom`** 이다 —
; `= None` 관용구가 그 자리를 통째로 가져갔다. 그래서 「틀리는 자리」는 합성이 정본이고,
; 여기 쿼리가 잡는 것은 「기본값이 있다」는 사실 쪽이다.

; `def f(limit=10)` — 안 넘기면 쓸 값.
((default_parameter
   name: (identifier) @pick.2
   "=" @pick.1 @hole
   value: (_) @pick.3) @site
 (#set! form "default"))

; `def f(limit: int = 10)` — 종류를 적어도 같은 규칙이다. 노드만 다르다.
((typed_default_parameter
   name: (identifier) @pick.2
   "=" @pick.1 @hole
   value: (_) @pick.3) @site
 (#set! form "typed"))
