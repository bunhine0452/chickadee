; 자바스크립트·Vue 용 — 인터페이스·타입 별칭·열거형 선언은 TS 문법에만 있어 그 대안 넷을 뺐다.
; 파일 사이로 이름을 옮긴다. 여기서 세는 것은 **이름**이지 경로가 아니다 —
; 경로 해석은 시스템 쿼리 `_imports.scm` 이 따로 맡는다 (D18).
; 지목 후보는 셋 이상이어야 판이 선다(생성기 규칙) — 낱말 `import`·`export` 를 pick.4 로 든다.
((import_statement
   "import" @pick.4
   (import_clause (identifier) @pick.1)
   source: (string) @pick.2) @site
 (#set! form "default"))

((import_statement
   "import" @pick.4
   (import_clause (named_imports . (import_specifier name: (_) @pick.1)))
   source: (string) @pick.2) @site
 (#set! form "named"))

; 내보내는 쪽(`export …`)은 **잡지 않는다** — 이 개념의 산문 전부가 pick.2(어디서 가져오나)를 쓰는데
; 내보내는 줄에는 출처가 없어 판이 안 선다(2026-09-06 tiny 실측 — export 자리 22곳이 전부 드롭).
; 내보내기는 산문이 다른 개념이라 `ts/export-declaration` 으로 따로 세울 자리다(D191 후속).
; 아래는 그때 되살릴 패턴이다.
; 내보내는 쪽 — 이름(pick.1)이 파일 밖으로 나간다. pick.2(출처)는 없다 — 이 파일이 출처다.
; ((export_statement
;    "export" @pick.4
;    declaration: [
;      (function_declaration name: (_) @pick.1)
;      (lexical_declaration (variable_declarator name: (_) @pick.1))
;      (class_declaration name: (_) @pick.1)
;    ] @pick.3) @site
;  (#set! form "export"))
