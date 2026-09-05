---
schema_version: 1
type: chore
slug: "define-done-and-close-delegated-decisions"
status: done
difficulty: high
created_at: "2026-09-05T20:12:00+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related: []
tags:
  - "D186"
  - "D187"
  - "정본"
  - "병렬"
  - "게이트"
  - "mcp-tool"
---
[x] 「완벽」을 게이트 넷으로, 미결 스물하나를 한 행으로 (D186 · D187)

사용자: 「모든 걸 적용하고 병렬 세션을 만들어 완벽한 학습 소프트웨어 계획을 세워. 완벽이란 ① 학습에 불편이 없나(UX·UI) ② 디자인이 이상하지 않나 ③ 학습질이 좋은가. 더 생각나는 게 있으면 해도 돼. 정본 수정 허용. **모든 결정을 위임**.」

## 「완벽」을 재는 것으로 바꿨다 (D186)

재지 못하는 완벽은 없다. 셋을 게이트로 — ① 학습자 여정 e2e(막힘 0 · 되돌아가지 않고는 못 가는 곳 0 · 첫 판까지의 클릭 수) ② 기존 디자인 게이트 + 화면 전수 스크린샷(세 폭 × 두 테마) 한 곳에 ③ 성질 게이트 셋(내 코드 비율 · 2단 값 추적 있음 · 오답마다 진단 계산). 그리고 사용자가 안 든 넷째 — **정직성**: 앱이 못 하는 것을 화면이 말한다. D181·D184 가 상수 대신 센서스를 택한 것과 같은 태도다.

## 미결 스물하나를 닫았다 (D187)

방향이 갈리는 것은 정본의 약속(내 코드가 교재 · 장식 0 · 센서스) 쪽으로. 굵은 것만 — `build` 유보 유지(러너가 먼저) · 재출제는 다른 식 같은 개념 · `number-literal` 쪼갬 · `truthiness` 는 `common/` · `cs/` 둘 신설 · 사전 저작 java·ts·py·sql 동시 · 알고리즘은 stdin 러너 + 우리 문제 층만 · 결함 둘 지금 · 코드 창 16px · 2단 상한 · 테마는 시스템 따름 · 74일 받되 단별 탈출 · Rust 「내려앉음」 실측대로 · §N.6 diff 적용 · 형식 둘 신설 · 그림 열하나 전부 · 권한 줄 교체.

## 정본 세 곳

§2 표의 2단이 「무엇이 언제 도는가, **그리고 값이 어떻게 바뀌나**」 — 연구의 추적이 값 추적인데 앱엔 경로뿐이었다(D185). §5 에 러너 셋(Gradle · sqlite 방언별 · stdin)과 「알고리즘 트랙은 만들지 않는다」. §5 「A 로 내려앉는다」를 실측대로 — 문법이 링크된 언어에서만이고 아니면 화면이 말한다. §10 신설 「무엇이 완성인가」.

## 첫 물결 여섯 (Opus, 동시)

S3 형식 둘 + 로그인 챕터 값 추적 · S4 자바 0부 사전 19 · S5 TS 0부 사전 21 + 선행 뒤집기 + 캡처 구멍 · S7 SQL 여덟 + 자기 조인 + sqlite 러너 + 픽스처 행 + `#{}` 결함 · S8 파서 미링크 통과 결함 + `py/arithmetic` + `number-literal` 쪼개기 + `common/truthiness` + `cs/` 둘 · S10 그림 일곱 + i18n. 둘째 물결(UX 감사 · 디자인 QA · 파이썬 사전 · stdin 러너 · 커리큘럼 diff 적용 · 카탈로그 확장)은 첫 물결의 UI 와 사전 구조가 선 뒤에 띄운다 — 감사는 새 화면을 봐야 하고, 파이썬은 S8 의 `common/` id 를 참조한다.

## 파일 소유를 갈랐다

S4·S5 가 S8 이 만드는 `cs/operator-precedence` 등 다섯 id 를 참조하되 파일은 안 만든다. S7 이 `crates/parse` 를 만지면 함수 하나로 좁힌다(S8 은 `quality.rs` 만). S10 은 컴포넌트를 만들고 S3 는 import 만.