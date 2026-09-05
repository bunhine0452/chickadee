; 터진 것을 받아 잇기. C++ 에서만 성립하는 판이 여기 있다 — 던지면 사이의 지역 객체
; **소멸자가 전부 불린다**. 그 순서를 묻는 문항은 나머지 아홉에서 성립하지 않는다
; (`cpp.md` §3 #22 · `cpp-learning.md` §11.3 ②).
((try_statement
   body: (compound_statement) @pick.2
   (catch_clause
     "catch" @pick.1 @hole
     parameters: (parameter_list) @pick.3)) @site
 (#set! form "trycatch"))

((throw_statement (_) @pick.3) @site
 (#set! form "throw"))
