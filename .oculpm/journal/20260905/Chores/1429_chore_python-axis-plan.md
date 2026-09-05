---
schema_version: 1
type: chore
slug: "python-axis-plan"
status: done
difficulty: high
created_at: "2026-09-05T14:29:53+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/plan/python-axis.md"
    op: create
  - path: "docs/curriculum/py.md"
    op: update
related: []
tags:
  - "python"
  - "curriculum"
  - "measurement"
  - "plan"
  - "runner"
  - "D152"
  - "D177"
  - "mcp-tool"
---
[x] 파이썬 축 실측과 구현 계획 — 사전 8장이 덮는 것을 재고 3부·프레임워크·러너를 설계

병렬 세션 F2. 사용자 요청 「자바 말고 다른 언어도 지원할 계획을 세워 달라」의 파이썬 축.
산출물은 코드가 아니라 계획이다 — `docs/plan/python-axis.md`(748줄) 신규, `docs/curriculum/py.md` 갱신.

## 실측

사용자 리포 셋(`adelie` 139파일 · `ECC` 63 · `MonggleMonggle` 16, 코드 38,550줄)을 파이썬 `ast` 로
전부 파싱했다(파싱 실패 0). 정규식 근사가 아니라 노드 수다. 리포는 읽기만 했고 측정 스크립트는
scratchpad 에만 두었다.

- **줄 덮음**: 지금 사전 8장이 adelie 코드 줄의 **37.6 %** · ECC 42.0 % · Monggle 24.5 % 를 덮는다.
  중심 16장을 더하면 75.9 / 84.0 / 70.7 %, 심화 10을 더 얹으면 +2.7 %p, 그 위 확장은 +0.2 %p.
  **수확이 앞쪽에 쏠려 있고 그것이 저작 순서다.**
- **바닥 여덟 중 하나가 죽어 있다**: `while` 21곳(16파일). 없는 `for-in` 은 605곳이다.
  D152 가 TS 의 여덟을 그대로 옮긴 자리.
- **안 덮이는 것**: `string-literal` 22,081곳 · `attribute-access` 14,495 · `call-expression` 14,074 ·
  `type-hint` 2,926 — 넷 다 지금 사전의 최댓값(`assignment` 5,933)과 같은 자릿수이거나 위다.
- **0곳**: 왈러스 · `match` · `f(*xs)` · `async for` · `async with` · `yield from` · `for…else`.
  D177 이 자바에서 쓴 근거가 파이썬에서도 그대로 선다.
- **결함 하나 — 계획이 아니라 지금 버그**: `py/arithmetic` 사용처 1,815곳 중 **933곳(51 %)이 셈이 아니다.**
  `/` 1,166곳 중 770곳이 `pathlib.Path` 경로 결합(`self._dir / f"{id}.json"`)이고,
  `|` 169곳 중 163곳이 애너테이션 안의 타입 합집합(`str | None`)이다. 그 자리 카드는
  「나누기가 딱 떨어져도 소수를 낸다」를 읽으며 `Path / "x"` 를 본다. `py.md` §2 ⓑ 의 확대판이다.

## 계획의 뼈대

- **3부** — 1부 바닥 16(값 넷·이름·셈·견줌·조건·반복·목록·함수·import) · 2부 자료구조와 객체 16
  (딕트·집합·컴프리헨션·클래스·예외·with·데코레이터·타입 힌트) · 3부 프레임워크.
  실측이 `py.md` 를 셋 고쳤다 — `type-hint` 은 심화가 아니라 2부(2,926곳),
  `set-and-membership` 신설(집합 48 + `in` 865), `cs/` 신규는 0장(제안 10 중 9가 기존 44장과 같은 것).
- **프레임워크 축** — Django · Flask · Streamlit · SQLAlchemy · pandas 는 세 리포에 **0곳**이다.
  FastAPI 는 한 리포 10파일(4.6 %). 자바에서 스프링이 3부였던 근거(표본 자바 99장이 전부 스프링 위)가
  파이썬에는 없다. 그래서 `pyapp/` 12장(패키지·진입점·가상환경·설정·dataclass·enum·ABC·pytest, 세 리포
  전부에서 선다)을 먼저, `pyweb/` 10장을 그 위에. 감지는 `spring/` 의 `{manifest, contains}` 를 그대로 쓴다 — 코드 0줄.
- **라우트 간선** — `adelie`·`ECC` 는 HTTP 라우트 0곳이라 `entryUnits` 가 `[]` 를 내고 기능 챕터가 0개다.
  `__main__` 가드를 그냥 씨앗으로 쓰면 adelie 에서 한 챕터가 67파일(48 %)을 삼키고 ECC 에서는 열한 씨앗 중
  열이 1파일이다. **씨앗은 하위 명령 처리기 모듈**이어야 한다 — adelie `commands/*.py` 일곱으로 재면
  폐포 중앙값 11 · 최소 6 · `MIN_FILES_FOR_UNIT` 에 걸리는 것 0개.
  비용은 `_imports.scm` 18줄 + TS 6줄(`GRAPH_FORM` 1 · `ingest.ts` 1 · `calls.ts` 4).
- **pytest 러너** — 탐지 `.venv/bin/python` → `venv/bin/python` → `python3`, `import pytest` 한 번.
  adelie 에 실물로 있다(pytest 9.0.3 · 테스트 757개). 출력은 **플러그인 없이 `-rA`** 로 읽는다 —
  실측으로 확인했다: 정상은 `PASSED`/`FAILED <nodeid> - <msg>`, 수집 오류는 `ERROR` + `Interrupted`(→`error`),
  테스트 0개는 `no tests ran`(→`no-runner`). 가상환경은 복사하지 않고 원본을 절대 경로로 부르며 cwd 만 작업본.
  설치는 하지 않는다 — 없으면 그 단이 게이트 밖이다.
- **순서** — 0 결함 수리(5줄) → 1부 8장 → CLI 씨앗(24줄) → 2부 16장 → 러너 → 골든 → `pyapp/` → `pyweb/`.
  가장 값싼 큰 승리는 **CLI 씨앗 24줄**(리포 둘의 코스가 0 → 7 챕터)이고 그다음이 결함 수리 5줄이다.

결정 등록부에는 행을 올리지 않았다 — 착수 결정은 사용자 것이고 초안 넷을 계획 §7 에 두었다.

## 못 잰 것

`pyweb/` 열 장 중 여섯의 사용처 · `LoadOptions.manifests` 의 호출부가 `pyproject.toml` 을 넣는지 ·
`detect` 스키마가 `contains: ""` 를 허용하는지 · adelie 757 테스트의 실행 시간 · `--tb=no` 대 `--tb=line` ·
f-string 의 `f` 한 글자 캡처 가능 여부 · `grammar_abi` 대조. 표본이 셋뿐이고 둘이 LLM 도구라는 것도 적었다.

## 검증

- `python3 -m ast` 로 218파일 전부 파싱, 실패 0 — 수치는 노드 수이지 grep 근사가 아니다.
- pytest `-rA` 출력 갈래 셋(정상·수집 오류·테스트 0개)을 scratchpad 의 합성 테스트로 실제로 돌려 확인했다.
- `git status --short` 로 이 세션이 건드린 것이 `docs/plan/`·`docs/curriculum/py.md` 둘뿐임을 확인했다.
  claim 밖 파일 변경 0건.