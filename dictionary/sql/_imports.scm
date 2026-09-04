; SQL 에는 파일을 부르는 문법이 없다 (`docs/curriculum/sql.md` §5). 표 사이의 관계는 있지만
; 그것은 파일 간선이 아니라 스키마 간선이라 `import_edge` 의 모양이 아니다.
;
; 시스템 쿼리 자리를 비워 두면 린트가 잡는다. 그래서 **결코 맞지 않는 패턴** 하나를 둔다 —
; `keyword_from` 의 글자는 언제나 `FROM` 이라 이 술어는 참이 되지 않는다.
((keyword_from) @import.source
 (#eq? @import.source "SQL 에는 import 가 없다")
 (#set! form "static"))
