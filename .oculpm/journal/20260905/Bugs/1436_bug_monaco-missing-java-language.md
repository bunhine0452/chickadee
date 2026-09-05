---
schema_version: 1
type: bug
slug: "monaco-missing-java-language"
status: done
difficulty: low
created_at: "2026-09-05T14:36:26+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/t1/monacoOptions.ts"
    op: update
  - path: "apps/desktop/src/components/t1/ClonePad.tsx"
    op: update
  - path: "apps/desktop/src/components/t1/ClonePad.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ReimplPlate.tsx"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related: []
tags:
  - "Monaco"
  - "자바"
  - "D171"
  - "D177"
  - "5단"
  - "mcp-tool"
---
[x] 5단 재구현 편집기가 자바를 강조하지 않았다 — Monaco 에 없는 id 를 넘기고 있었다

## 발생 원인

`ReimplPlate.tsx` 의 `grammarOf` 가 `grammar === 'java'` 면 `'java'` 를 돌려주는데, `ClonePad` 가 싣는 Monaco basic-languages 는 **여섯**(typescript·javascript·python·go·rust·sql)이라 그 안에 자바가 없었다. 등록 안 된 id 로 `setModelLanguage` 를 부르면 모델이 **조용히 plaintext 가 된다** — `docs/05-frontend.md` §8 이 그 함정을 이미 적어 두었는데 자바 코스를 붙이며 같은 자리를 다시 밟았다.

같은 함수의 주석은 「`ClonePad` 가 싣는 여섯 밖이면 typescript 로 그린다」였다 — **주석이 맞고 코드가 틀렸다.** 방금 세운 자바 3부 코스(D177)의 5단이 강조 없는 편집기로 뜨는 상태였다. 병렬 세션 F4 가 확장점을 세다 찾았다.

## 해결 방법

자바를 **싣는 쪽으로** 고쳤다 — 자바를 가르치는 앱의 편집기가 자바를 못 칠하는 것이 이상하다. `MONACO_LANGUAGES` 에 `'java'`, `ClonePad` 에 `java.contribution` 한 줄, 시험의 모의도 한 줄. 청크는 **593 KB gzip** 으로 §1.3 의 Monaco 예산 1.2 MB 안이다(basic-language 하나는 5~10 KB다).

그리고 `grammarOf` 를 조건 나열에서 **`MONACO_LANGUAGES` 조회**로 바꿨다. 목록과 매핑이 두 벌로 갈려 있던 것이 이 버그의 구조적 원인이라, 다음 언어를 더할 때 한 곳만 고치면 되게 했다. `docs/05` §8 의 「여섯」도 일곱으로.

## 검증

`pnpm typecheck`·`pnpm lint` 무출력 · `pnpm test:unit` **2,305 통과 / 실패 0** · `test:gates` **114**(chromium+webkit) · `test:e2e-ui` **26** · `ClonePad.test.tsx` 의 「`MONACO_LANGUAGES` 가 contribution import 와 같다」가 새 목록으로 통과. 빌드 후 청크 실측 593 KB gzip.

## 메모

이 결함은 **시험이 못 잡는 종류**였다 — `ClonePad.test.tsx` 는 목록과 import 가 서로 같은지만 보고, 코스 화면이 그 목록 **밖의 값을 넘기는지**는 아무도 안 봤다. 지금은 매핑이 목록을 조회하므로 어긋날 자리가 없다.