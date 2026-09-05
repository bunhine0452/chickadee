; 셈하기 — `//` 를 **일부러 뺐다.** 이 개념이 자리를 버는 근거가 「나누기는 딱 떨어져도
; 소수를 낸다」(D152)인데 `//` 는 정수를 낸다. 잡으면 그 사용처에서 `rule` 이 거짓이 된다.
; yaml 의 `why` 도 `//` 를 「버림은 기호가 따로 있다」는 **대조**로 쓰지 사례로 쓰지 않는다.
; `//` 를 가르치려면 개념을 따로 세운다.
;
; **2026-09-05 — 피연산자 종류를 열거해 좁혔다.** `binary_operator` 를 그대로 잡으면 타입을
; 모르는 채로 이어붙이기·되풀이·서식·경로 결합이 전부 셈하기 사용처가 된다. 사용자 리포 셋
; (adelie·ECC·MonggleMonggle · py 218파일)에서 재니 **1,621곳 중 1,350곳(83 %)이 셈이 아니었다** —
; `/` 1,166곳의 거의 전부가 `pathlib` 경로 결합이고(`self._dir / f"{id}.json"`), `+` 228곳 중
; 124곳 · `*` 148곳 중 85곳이 글자·목록이었다. 그 자리에서 카드가 나오면 학습자는
; 「나누기는 늘 소수를 낸다」를 읽으면서 `Path / "config.json"` 을 본다.
;
; 고치는 방법은 **부정이 아니라 열거**다 — tree-sitter 쿼리에 「이 노드 종류가 아닌 것」이
; 없어서, 셈이 될 수 있는 피연산자 종류를 적는다. 텍스트 술어(`#not-match?`)는 안 쓴다:
; `f"…"`·이름 뒤의 값에서 다시 새고, 새는 자리가 조용하다.
;
; 나누기만 따로 두는 이유: 경로 결합은 **오른쪽이 경로 조각**(글자·f-문자열·이름)이고
; 셈하기는 오른쪽이 **숫자이거나 계산 결과**다. `right` 를 `(integer)·(float)·(call)` 로
; 좁히면 `sum(xs) / len(xs)`(평균)는 남고 `WORKSPACE / cat` 는 빠진다. 실측 정밀도
; 16.7 % → 94.9 %, 진짜 셈은 271곳 중 259곳이 남는다(잃는 12곳은 `step / total` 처럼
; 오른쪽이 이름인 나눗셈이다 — 그 자리는 경로 결합과 노드가 완전히 같아서 못 가른다).
;
; 남는 한계 — 여전히 타입은 못 본다. `header + "\n".join(lines)` 처럼 **양쪽이 다 호출·이름**인
; 글자 이어붙이기는 남는다(실측 277곳 중 14곳). 이보다 더 좁히려면 파생 층(`derive.ts`)이
; 타입을 세워야 하지 여기서 반쯤 거르면 안 된다.

; 셈 넷 — 양쪽이 글자·목록·튜플·사전이 아닌 자리만.
((binary_operator
   left: [(identifier) (integer) (float) (call) (attribute) (subscript)
          (parenthesized_expression) (unary_operator) (binary_operator)] @pick.2
   operator: ["+" "-" "*" "%"] @pick.1 @hole
   right: [(identifier) (integer) (float) (call) (attribute) (subscript)
           (parenthesized_expression) (unary_operator) (binary_operator)] @pick.3) @site
 (#set! form "arith"))

; 나누기 — 오른쪽이 숫자이거나 계산 결과일 때만. 경로 결합(`뿌리 / "조각"` · `뿌리 / 이름`)이
; 여기서 빠진다.
((binary_operator
   left: [(identifier) (integer) (float) (call) (attribute) (subscript)
          (parenthesized_expression) (unary_operator) (binary_operator)] @pick.2
   operator: "/" @pick.1 @hole
   right: [(integer) (float) (call)] @pick.3) @site
 (#set! form "arith"))
