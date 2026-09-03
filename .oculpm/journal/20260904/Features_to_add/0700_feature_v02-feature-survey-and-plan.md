---
schema_version: 1
type: feature
slug: "v02-feature-survey-and-plan"
status: planned
difficulty: medium
created_at: "2026-09-04T07:00:34+09:00"
session_id: "20260904-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: ".oculpm/planner/chickadee-v02-features.md"
    op: create
related: []
tags:
  - "planning"
  - "i18n"
  - "repo"
  - "settings"
  - "t1"
  - "mcp-tool"
---
[ ] 0.2 요청 4건 존부 조사 — 언어 선택·리포 서가·설정 보완·전체 클론 코스

## 조사 결과 (있음/없음)

| 요청 | 상태 | 근거 |
|---|---|---|
| 첫 실행 언어 선택(한/영) | **없음** | i18n 층 자체가 없다. 비주석 한글 약 4만 자 / 197 파일에 하드코딩. `Settings` 에 `locale` 없음(`store-sql/src/types.ts:162`). `screens/home/empty.tsx` 는 로고·한 문단·「리포 등록」뿐 |
| 여러 리포 관리 화면 | **반쯤** | `concepts/src/repos.ts` 에 register·list·relocate·remove + `status: ok\|missing\|detached` 파생이 다 있는데 relocate·remove 를 부르는 화면이 없다. `components/home/Masthead.tsx:60` 의 리포 칸은 `disabled` 스텁. `FirstRun` 은 `repos.length === 0` 에서만 떠서 **두 번째 리포를 추가할 문이 UI 에 없다** |
| 설정창 | **있음** | `screens/settings/SettingsScreen.tsx` 8절. 05 §2.1 대비 모션 감축·문법 사전 언어·내 커밋 identity·제외 글롭이 빈다 |
| 프로젝트 전체 클론코딩 | **없음** | T1 은 12~40줄 블록 하나(`cards/src/t1-block.ts:19`). 순서·진행 원장·화면이 없다 |

부수 발견 — `flow.ts:89` 가 `identities: []` 를 넘겨 `classifyCommits` 가 **모든 커밋을 「내 것 아님」** 으로 분류한다. 설정 타입·`isMine()`·저장 키까지 다 있는데 배선만 빠졌다.

## 사용자 결정

1. 영어 범위 = **사전까지 전부** (57 YAML · 한글 2.7만 자 · `concept.name_en` ALTER ADD)
2. 리포 관리 = **서가 화면 신설 + 마스트헤드 스위처**
3. 클론 코스 = **일일 큐(D12 10~25분) 밖 별도 모드**, 결과는 `review_log` 로 겹에 반영

## 계획

`.oculpm/planner/chickadee-v02-features.md` — 6 단계 32 항목, 약 24일. 착수 순서 P0 → P1 → P4 → P3 → P2 → P5 (i18n 뼈대를 먼저 깔아야 뒤 작업의 새 문구가 처음부터 `t()` 로 들어간다).

설계 제약 둘을 계획에 못 박았다.
- **Rust 예산 2300/2300, 여유 0**(`check-rust-budget.sh` 실측) → 네 건 모두 Rust 추가 0줄. 클론 코스는 기존 `file_read_lines` 로 원문을 읽고 기존 `segment()` 가 41줄 이상을 12~40줄 조각으로 자른다.
- 등록부 먼저(D114 로케일 축 · D115 서가 화면 · D116 큐 밖 코스 · D117 사전 이중 언어). D114 는 D61 을, D116 은 정본 §2 트랙 표를 여는 행이라 문서 수정 전에 사용자 확인이 필요하다.

## 검증

코드 조사만 했고 파일 변경은 없다(플랜 파일 1개 생성). 각 「없음」 판정은 grep 호출부 추적으로 확인했다 — `removeRepo`·`relocateRepo` 는 `packages/concepts/dist` 재수출 외에 호출부 0건, `locale`·`i18n`·`t(` 는 소스에 0건, 클론 코스 관련 테이블·화면 0건.