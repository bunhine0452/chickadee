; 없을 때 채우기. 이 언어에서는 연산자가 아니라 **함수**라 이름 목록으로 갈린다 —
; 방언마다 이름이 다르다(`COALESCE` · `IFNULL` · `NVL` · `ISNULL`).
((invocation
   (object_reference (identifier) @pick.1) @hole
   "(" . (term) @pick.2
   ")" @pick.3) @site
 (#match? @pick.1 "^(COALESCE|IFNULL|NVL|ISNULL|coalesce|ifnull|nvl|isnull|Coalesce|IfNull|Ifnull|IsNull)$")
 (#set! form "coalesce"))
