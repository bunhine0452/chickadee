; 조건으로 값 고르기. 앵커(`.`)로 「묻는 낱말 → 조건 → 그러면 → 값」을 붙여 잡는다 —
; 앵커가 없으면 갈래가 여럿인 문장에서 조건과 값이 어긋나 짝지어진다.
((case
   (keyword_case) @pick.1 @hole
   (keyword_when) @pick.4 . (_) @pick.2 . (keyword_then) . (_) @pick.3) @site
 (#set! form "case"))
