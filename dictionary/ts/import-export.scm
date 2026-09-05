; 파일 사이로 이름을 옮긴다. 여기서 세는 것은 **이름**이지 경로가 아니다 —
; 경로 해석은 시스템 쿼리 `_imports.scm` 이 따로 맡는다 (D18).
((import_statement
   (import_clause (identifier) @pick.1)
   source: (string) @pick.2) @site
 (#set! form "default"))

((import_statement
   (import_clause (named_imports . (import_specifier name: (_) @pick.1)))
   source: (string) @pick.2) @site
 (#set! form "named"))

((export_statement
   declaration: (_) @pick.3) @site
 (#set! form "export"))
