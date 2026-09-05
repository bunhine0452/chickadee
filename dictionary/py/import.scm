; 가져오는 순간 그 파일이 **위에서 아래로 한 번 실행된다.** `if __name__ == "__main__":` 이
; 왜 필요한지가 여기서 나온다 — 실행할 것을 파일 바닥에 그냥 적어 두면 남이 가져올 때도 돈다.
;
; 시스템 쿼리 `_imports.scm` 과 노드가 같지만 하는 일이 다르다. 그쪽은 T2 그래프가 파일 사이의
; 간선을 세우려고 **경로만** 캡처하고(`@import.source`), 여기는 학습자에게 짚어 줄 자리를
; 캡처한다. 같은 문법에 쿼리가 둘인 것이 맞다 — 캡처 이름의 규약이 다르다 (03 §3.2).

; `import os` · `import os.path` — 이름 하나가 통째로 들어온다. 쓸 때는 `os.path.join` 처럼 앞을 붙인다.
((import_statement
   "import" @pick.1 @hole
   name: (dotted_name) @pick.2) @site
 (#set! form "plain"))

; `import numpy as np` — 여기서 이름이 하나 더 생긴다. 원래 이름은 이 파일에서 안 보인다.
((import_statement
   "import" @pick.1 @hole
   name: (aliased_import
           (dotted_name) @pick.2
           alias: (identifier) @pick.3)) @site
 (#set! form "alias"))

; `from fastapi import FastAPI` — 파일에서 **이름만** 꺼내 온다. 앞을 안 붙이고 바로 쓴다.
((import_from_statement
   "from" @pick.2
   module_name: (_) @pick.3
   "import" @pick.1 @hole) @site
 (#set! form "from"))
