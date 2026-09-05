; 시스템 쿼리 — T1 필사 단위. 매퍼에서 그것은 **SQL 문 하나**다.
; 이름은 `id` 속성이고, 그 값이 곧 자바 DAO 의 메서드 이름이다(`findByLoginId`).
((element
   (STag (Name) @ctx.tag
     (Attribute (Name) @ctx.att (AttValue) @block.name))) @block.function
 (#any-of? @ctx.tag "select" "insert" "update" "delete")
 (#eq? @ctx.att "id")
 (#set! form "statement"))
