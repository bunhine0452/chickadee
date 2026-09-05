; 다른 표의 행을 가리키기. 열에 바로 붙는 판과 제약으로 따로 적는 판, 둘 다 잡는다.
((column_definition
   (identifier) @pick.2
   (keyword_references) @pick.1 @hole
   (object_reference (identifier) @pick.3)) @site
 (#set! form "fk-inline"))

((constraint
   (keyword_foreign) @pick.4
   (ordered_columns (column (identifier) @pick.2))
   (keyword_references) @pick.1 @hole
   (object_reference (identifier) @pick.3)) @site
 (#set! form "fk-table"))
