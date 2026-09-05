---
schema_version: 1
type: feature
slug: "ten-language-courses-merged-and-verified"
status: done
difficulty: high
created_at: "2026-09-06T05:05:49+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/curriculum/README.md"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "dictionary"
    op: update
related: []
tags:
  - "v11"
  - "코스"
  - "사전"
  - "합류"
  - "게이트"
  - "D191"
  - "mcp-tool"
---
[x] 열 언어 코스 합류 — 사전 229 → 535장, 언어 열 421장, 등록부 D191, 전체 게이트 초록 (D190)

병렬 열(java·ts·py·sql·go·cpp·csharp·swift 는 Opus, rs·c 는 Fable 포크)이 각자 워크트리에서 저작했고 순서대로 합류했다. 여섯이 세션 한도(3시 리셋)에 걸려 중간에 멈췄다가 `SendMessage` 로 같은 워크트리에서 재개해 끝냈다 — 트랜스크립트와 파일이 남아 있어 잃은 것은 없었다. 충돌은 0건(세션이 만지는 경로 넷을 서로 안 겹치게 잘랐다).

## 추가 기능

- **언어 사전 열이 전부 섰다** — 421장 89,153줄. 사전 전체 229 → **535장**, 33,528 → **97,726줄**. 언어별 부 배치는 `parts/*.ts` 열 장이 들고 시험이 열 언어 전부에 essential 과 대조한다. 3부가 있는 언어는 자바(`spring/`)뿐.
- **골든 1,047 / 510**(양/음), 개념마다 양성 2·음성 1 이상. `DEBT_RATCHET` 은 합류 때마다 잠가 최종 406/385/406/396.
- **「네 코드엔 없다」 사유 표 27행** — 세션 초안에서 열하나를 넣었다(sql 6 · java·csharp·cpp·rs·swift 각 1). 표본이 없는 언어는 공개 리포 기준이고 주석에 표본을 적었다.
- **파서 넷의 첫 실측** — c 17.8%(전처리기 갈래 파일 셋, 빼면 0.44%) · cpp 4.6%(템플릿 0, 네임스페이스 매크로) · c_sharp 0% · swift 1.6%. 넷 다 poor 20% 게이트 안. swift 는 `node-types.json` 필드가 쿼리에서 안 맞는 함정을 새로 찾았다.
- 등록부 **D191** — 열 세션이 정한 여덟: 3부는 프레임워크 전량 아니면 빈 목록 · 0부 id 는 언어 문서 §0.1 · 자바 0부 복귀 둘 · 표본 없는 언어의 ABSENCE 규약 · 래칫은 합류 때 · 교차 언어 alternatives 보류 · 파서 ERROR 값 · 남긴 것(common 후보 약 30 · cs 후보 여섯 · 그림 넷 · 공유 코드 다섯 · 800줄 초과 문서 넷). `docs/curriculum/README.md` §4 상태표와 §5 「열 언어가 실물을 냈다」 표.

## 동작 흐름

기반 커밋(파서 넷 · 부 등록부 · D190) → 열 세션 출발 → 앱(언어 선택 · 부 목차 · `no-files`) → 세션마다 병합·래칫·ABSENCE·일지·플랜 → 최종 검증 → D191·README → 푸시 → CI.

## 검증

typecheck 초록 · `pnpm lint` 초록 · 단위 2,643/2,644(1 skip) · cargo 9벌 초록 · `pnpm test:gates` 206 통과 / 10 건너뜀(기존 T1·T2 시드 부재) · 성질 게이트 내 코드 100%. 못 한 것: 실제 앱에서 열 언어의 부 판을 열어 세션까지 가는 것을 눈으로 안 봤다(하네스와 시험만) · 사용자 리포가 없는 다섯 언어(go·c·cpp·csharp·swift)는 「내 코드가 교재」 분모가 0 · 3부 아홉 언어 없음 · Monaco swift 배선 없음.