; SQL 에는 파일을 부르는 문법이 없다 (`docs/curriculum/sql.md` §5). 여기 있는 것은 파일 간선이
; 아니라 **스키마**다 (D169) — 표·열·외래키, 그리고 문이 읽는 표. 매퍼 안의 SQL(`mybatis_sql`)도
; 같은 문법이라 같은 캡처가 걸린다. 해석은 TS(`schema.ts`)가 한다.
;
; 표 하나. `CREATE TABLE users (…)`
((create_table (object_reference (identifier) @import.source))
 (#set! form "ddl-table"))

; 열 하나. 이름 바로 다음 이름 있는 노드가 타입이다(`bigint`·`varchar`·`keyword_datetime`).
; `NOT` 과 `DEFAULT <값>` 은 있을 때만 잡힌다.
((create_table
   (object_reference (identifier) @ctx.table)
   (column_definitions
     (column_definition
       (identifier) @import.source . (_) @ctx.type
       (keyword_not)? @ctx.notnull
       ((keyword_default) . (literal) @ctx.default)?)))
 (#set! form "ddl-column"))

; 외래키. `FOREIGN KEY (user_id) REFERENCES users (user_id)` — 지정자는 참조하는 열이다.
((create_table
   (object_reference (identifier) @ctx.table)
   (column_definitions
     (constraints
       (constraint
         (keyword_foreign)
         (ordered_columns (column (identifier) @ctx.column))
         (object_reference (identifier) @ctx.ref_table)
         (identifier) @import.source))))
 (#set! form "ddl-fk"))

; 문이 읽고 쓰는 표. `FROM users` · `INSERT INTO users` · `UPDATE users` · `DELETE FROM users`
; 매퍼의 열 대응(`column-of`)에 표 이름을 붙이는 재료다.
((from (relation (object_reference (identifier) @import.source)))
 (#set! form "reads-table"))
((insert (object_reference (identifier) @import.source))
 (#set! form "reads-table"))
((update (relation (object_reference (identifier) @import.source)))
 (#set! form "reads-table"))
; `DELETE FROM x` 는 `from` 아래 `relation` 없이 표가 바로 온다. `JOIN x` 는 `join` 아래다.
((from (object_reference (identifier) @import.source))
 (#set! form "reads-table"))
((join (relation (object_reference (identifier) @import.source)))
 (#set! form "reads-table"))
