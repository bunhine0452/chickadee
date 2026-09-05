; 남이 만든 이름을 이 파일에 들이기. 짚는 자리가 셋이라 「어디가 폴더고 어디가 이름인가」가
; 그대로 문항이 된다.
;
; 한 패턴이 세 모양을 다 받는다 — `import a.b.C;` · `import a.b.*;` · `import static a.b.C.d;`.
; `static` 과 `*` 는 이 노드의 **덧붙이는 조각**이라 따로 패턴을 내면 같은 줄이 두 번 잡힌다.
((import_declaration
   "import" @pick.1 @hole
   (scoped_identifier
     scope: (_) @pick.2
     name: (identifier) @pick.3)) @site
 (#set! form "import"))
