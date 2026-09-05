; 값은 켜짐·꺼짐의 묶음이다. 파이썬에서 그 묶음을 **직접** 만지는 자리는 셋뿐이다 —
; 자리를 미는 연산자, 뒤집는 `~`, 그리고 비트를 그대로 적은 리터럴.
;
; **`&` `|` `^` 를 일부러 뺐다.** 사용자 리포 둘(adelie 139파일 · ECC 63)에서 그 셋은
; 153곳인데 눈으로 본 표본이 거의 전부 **애너테이션 안의 타입 합집합**이었다
; (`list[str] | None` · `Path | str`). tree-sitter 는 타입을 모르므로 `int | flag` 와
; `str | None` 이 같은 `binary_operator` 다. 그 자리에서 카드가 나오면 학습자는
; 「비트를 자리마다 겹친다」를 읽으면서 타입 힌트를 본다 — `py/arithmetic` 이 `pathlib` 의
; `/` 에서 겪은 것과 같은 함정이다 (`arithmetic.scm` 주석).
;
; 미는 연산자는 그 함정이 없다: `<<`·`>>` 는 애너테이션에 안 나오고 실측 7곳이 전부 진짜다.

; 자리 밀기 — 왼쪽 값의 비트가 오른쪽 수만큼 옮겨 간다.
((binary_operator
   left: (_) @pick.2
   operator: ["<<" ">>"] @pick.1 @hole
   right: (_) @pick.3) @site
 (#set! form "shift"))

; `~n` — 모든 비트를 뒤집는다. 한 항짜리라 오른쪽이 없다.
((unary_operator
   operator: "~" @pick.1
   argument: (_) @pick.2) @site
 (#set! form "flip"))

; `0b1010` · `0x2A` · `0o755` — 비트를 그대로 적은 리터럴. 값의 종류는 십진과 같다.
((integer) @site @pick.1
 (#match? @pick.1 "^0[bBxXoO]")
 (#set! form "radix"))
