; 안의 이름 꺼내기. 점 하나가 필드·프로퍼티·메서드를 다 가리켜서, 읽기만으로는 그 자리에
; 코드가 도는지 안 도는지 모른다 — 그것이 이 판의 요점이다.
;
; 빈칸은 안 낸다 — 구멍이 점 한 글자라 생성에서 떨어진다(`MIN_HOLE`). yaml 의
; `no_hole_reason` 을 보라.
((member_access_expression
   expression: (_) @pick.2
   "." @pick.1
   name: (identifier) @pick.3) @site
 (#set! form "member"))
