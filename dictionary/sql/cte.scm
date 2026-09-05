; 조회에 이름 붙여 두기. 붙인 이름과 **아래에서 그 이름을 적은 자리**를 한 매치에 모은다 —
; 이름을 짓기만 하고 안 적으면 아무 일도 안 난다는 것이 이 개념의 오개념 하나다.
((statement
   (keyword_with) @pick.1 @hole
   (cte (identifier) @pick.2 (keyword_as) @pick.4)
   (from (relation (object_reference (identifier) @pick.3)))) @site
 (#set! form "cte"))
