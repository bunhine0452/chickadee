---
schema_version: 1
type: chore
slug: "part0-values-and-expressions-three-langs"
status: done
difficulty: high
created_at: "2026-09-05T18:21:54+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/curriculum/py.md"
    op: update
  - path: "docs/curriculum/ts.md"
    op: update
  - path: "docs/curriculum/java.md"
    op: update
related: []
tags:
  - "curriculum"
  - "py"
  - "ts"
  - "java"
  - "part0"
  - "cs"
  - "mcp-tool"
---
[x] 0부 「이 언어의 값과 식」 — 파이썬·JS/TS·자바 셋에 동작 원리 축을 붙였다

병렬 세션 I3. 사용자 요청(「기초부터 심화까지 · 언어의 동작 원리부터 · 정수형·실수형·연산식」)에
맞춰 세 커리큘럼 문서에 **정식 코스 3부 앞에 오는 0부**를 설계했다. 새 파일은 안 만들고 기존 문서를
고쳐 썼다.

## 무엇을 더했나

세 문서 각각에 `§1.5`(ts 는 `1.5`) 절 하나 — **축 여덟**(정수형과 한계 · 실수형 · 문자열과 인코딩 ·
참·거짓 · 연산자와 우선순위 · 형 변환 · 대입과 이름 · 비교와 같음)에 판을 매기고, 판마다 다섯을 적었다:
`cs/` 간선 · 그림(I2 계약) · 초보가 틀리는 자리 · 문항 형식(I1 계약 `value`/`step`/`bits`/`table`/
`build`/`predict`) · 출처(어느 부에서 올라왔나).

판 수 — **py 19 · ts 21 · java 19**. 부 배치는 0부가 위에서 가져간 만큼 원래 부에서 지웠다:
py 1부 16→9 · 2부 16→14, java 1부 13→8(2부 16 그대로), ts 는 부 배치 자체가 없어서 처음 세웠다
(0부 21 · 1부 13 · 2부 18 · 3부 6~15). 일수는 하루 새 판 2장(D12) 기준 py 27~28일 · ts 30~35일 ·
java 29일이고, 0부 이전은 각각 21~22 · (없음) · 22일이었다.

## 실측이 뒤집은 것

사용자 리포 넷을 정규식으로(주석·문자열 제거) 셌다. **`MonggleMonggle`(java 99)에 나눗셈이 0곳**이다 —
`/` 는 전부 문자열 경로와 주석이었다. `%` 0 · `char` 0 · `(int)` 캐스트 0 · `MAX_VALUE` 2곳.
19판 중 여섯(32%)이 사용처 0 이거나 그에 가깝고, D177 규칙 ①(합성 + 「네 코드엔 없다」 + 사유)이
그대로 걸린다. 사유는 다섯이 `scale`, `char` 하나가 `idiom` 이다.

반대로 **`autoboxing` 이 256곳 / 65파일**이다. `java.md` §5 가 심화(난이도 4)에 뒀는데 표본의
3분의 2 파일에 있다 — 0부 형 변환 축으로 올린 근거가 이 수치다.

JS 쪽에서는 **`loose-equality` 가 리포에 따라 1곳(`ECC` 410파일)과 375곳(`ai-pm` 613파일)으로 갈렸다.**
`ts.md` §3 의 「AI 가 한 파일에서 `==`·`===` 를 섞는다」는 `ai-pm` 에서만 참이다.
`ai-pm` 은 `BigInt`·`MAX_SAFE_INTEGER` 가 0곳이라 `number-is-double` 도 합성이다.

## I6 조정 규약 반영

세 문서 모두에 `§1.5.6` 을 더했다. ① **공통 id 조각 22개 표**(`value-bits`·`integer-limit`·
`text-length`·`operator-precedence`·`implicit-conversion`·`explicit-conversion`·`reference-binding` …)
로 세 언어 id 를 정렬하고 신규 id 를 전부 조각 이름으로 바꿨다. ② **0부 상한 12장**은
「`essential` 에 새로 드는 개념 수」로 읽어 py 10 · ts 11 · java 12 로 지켰다 — java 는 14가 나와
`string-concat`(15곳)과 `autoboxing`(256곳)을 `essential` 밖으로 뺐다(사용처가 있어 카드는 그대로 선다).
③ **`cs/` 신청 셋** — `cs/operator-precedence` · `cs/type-conversion` · `cs/truthiness`. 앞의 둘은
평가 트리와 타입 변환 사다리 그림이 걸릴 자리라 없으면 언어마다 따로 그리게 된다.

④ **파서 확인** — 코디네이터가 경고한 「스키마는 통과하는데 파서가 없는 언어」는 내 셋에 없다.
`crates/parse/Cargo.toml` 을 직접 읽어 `lang-python`·`lang-typescript`·`lang-javascript`·`lang-java`
가 모두 있는 것을 확인했다. 경고 대상인 `c`·`cpp`·`c_sharp`·`swift`·`dart` 는 내 범위가 아니다.

## 안 정한 것

0부 신규 개념을 `essential` 에 올리면 0장(프롤로그) 후보가 상한 24 를 넘는다(py 24→34 · ts 21→32 ·
java 24→34). 세 갈래(`essential` 밖에 두기 / 상한 30 으로 올리기 / 입력을 두 목록으로 가르기)를
세 문서 `§1.5.5` 에 적었고 **재려면 `zeroChapterPlates` 를 돌려야 해서 안 정했다** —
`cs.md` §6 의 미해결과 같은 결정이다.

`implicit-conversion`(`1 + 2.0` · `'5' * 2`)은 **정규식으로도 tree-sitter 로도 못 센다** —
두 피연산자의 타입을 알아야 한다. 실행 없이는 못 재는 개념이라 합성이 정본이다.

## 검증

`docs/curriculum/{py,ts,java}.md` 셋의 마크다운 표 열 수를 스크립트로 검사했다 — 불일치 0
(걸린 여섯 줄은 전부 표 안에서 `\|` 로 이스케이프한 파이프이고 기존 줄 넷이 같은 모양이다).
실측 수치는 `/Users/kimhyunbin/Desktop/git/` 를 읽기 전용으로 두 번 돌려(원시·주석제거) 대조했고,
파서 유무는 `crates/parse/Cargo.toml` 원문으로 확인했다. 범위 밖 파일은 건드리지 않았다.