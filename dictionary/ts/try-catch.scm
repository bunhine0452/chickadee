; try/catch — 매개변수 없는 catch 와 finally 없는 try 를 모두 담으려고 둘 다 선택으로 둔다.
((try_statement
   body: (statement_block) @pick.1
   handler: (catch_clause parameter: (_)? @pick.2 body: (statement_block) @pick.3)
   finalizer: (finally_clause)? @pick.4) @site
 (#set! form "try"))
