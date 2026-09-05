; 시스템 쿼리 — 이 파일이 내놓는 「지정자」. 해석은 TS 가 한다 (D18).
;
; C 의 import 는 글자 복사다(`c/header-include`). 잇는 것은 `#include "x.h"` 뿐이고
; `<stdio.h>` 는 리포 밖이라 파일이 없어 자연히 간선이 안 선다 — 이름으로 거르지 않는다.
; `resolve-imports.ts` 의 `LANG_OF` 에 `c`·`h` 가 아직 없어 이 지정자는 오늘 간선이 되지
; 않는다(D190 합류 때의 몫).
((preproc_include path: (string_literal) @import.source)
 (#set! form "static"))

((preproc_include path: (system_lib_string) @import.source)
 (#set! form "system"))

; ── 호출 그래프 (D168) ───────────────────────────────────────────────
; C 에는 수신자가 없다 — `f(x)` 는 같은 파일이거나 헤더가 알린 함수다. 구조체 안의 함수
; 포인터를 부르는 `ops->run(x)` 만 수신자를 갖는다.
((call_expression function: (identifier) @import.source)
 (#set! form "call-self"))

((call_expression
   function: (field_expression argument: (identifier) @ctx.recv field: (field_identifier) @import.source))
 (#set! form "call"))
