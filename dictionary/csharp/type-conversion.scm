; 사람이 적어야 하는 좁히기. 괄호 안의 타입이 구멍이고, 잘리는 것은 반올림이 아니라 버림이다.
;
; **넓히기는 여기 안 든다** — `long ms = 3;` 처럼 저절로 일어나는 자리는 코드에 낱말이 안
; 적혀서 정적으로 볼 수 없다. 그쪽은 합성 예제가 정본이다(`csharp.md` §0.6).
; 참조 다운캐스트(`(Order)obj`)도 뺐다 — 값이 안 잘리고 못 맞으면 예외라 다른 기계다.
((cast_expression
   "(" @pick.2
   type: (predefined_type) @pick.1 @hole
   value: (_) @pick.3) @site
 (#set! form "narrow"))
