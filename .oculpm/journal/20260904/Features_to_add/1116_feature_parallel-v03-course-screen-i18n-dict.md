---
schema_version: 1
type: feature
slug: "parallel-v03-course-screen-i18n-dict"
status: done
difficulty: high
created_at: "2026-09-04T11:16:25+09:00"
session_id: "20260904-005"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "parallel"
  - "i18n"
  - "clone-course"
  - "dictionary"
  - "worktree"
  - "mcp-tool"
---
[x] 세 갈래 병렬 — 코스 화면·움직이는 화면 문구·사전 55편 영문화

## 추가 기능

사용자 요청 4건의 남은 절반을 세 갈래로 갈라 격리 워크트리에서 동시에 돌리고 A → B → C 로 병합했다. 플랜 넷이 전부 닫혔다.

- **A · 코스 화면** (`chickadee-clone-course` P3·P4, 12/12) — `screens/clone/` 신설. 데이터 층(`data/clone.ts`)이 이미 인터페이스를 다 내놓았으므로 호출만 하고, 판은 `components/t1/*` 를 조립해 썼다. Rust 0줄, 새 마이그레이션 0건.
- **B · 움직이는 화면 문구** (`chickadee-i18n` P2 나머지, 4/4 + en 스모크) — `screens/{home,ingest,settings}` 와 `components/home` 의 화면 문구 2,513자를 전부 `t()` 로. `ko/home.ts` 147키 신설, `ko/core.ts` +95키.
- **C · 사전 산문** (`chickadee-i18n` P3, 4/4) — 57 YAML 1,004 문자열을 확정 용어집에 고정해 영문화. ko 로 폴백하는 문자열 0건.

## 동작 흐름

코스 진입은 `store.openClone(scope)` 한 문이고 여는 자리가 셋이다 — 홈 대지 카드(`{kind:'unit'}`) · 마스트헤드(`{kind:'repo'}`) · 서가 카드. 세션 중이거나 활성 리포가 없으면 `false` 를 돌려주고 아무것도 바꾸지 않는다. 코스는 오버레이가 아니라 홈을 **대신하는** 화면이라 Esc 는 「저장 후 나가기」 한 겹이다(D125).

## 사용자 결정 (Wave 0)

용어집 `dictionary/_glossary.en.yaml` 을 `status: confirmed` 로 확정받았다. 규칙 셋을 파일 안에 `rules:` 로 박아 번역이 드리프트하지 못하게 했다 — ① 보편은 평이한 설명, 언어는 기술 용어(겹치던 3건 + 규칙에서 혼자 벗어난 1건 = `name.en` 5개 변경) ② 키워드로 시작하면 그 키워드의 대소문자, 보편 이름에는 키워드를 쓰지 않는다 ③ 보편/언어가 일부러 다른 24쌍은 의도다.

정본 §2 는 트랙 표에 **행이 아니라 표 아래 한 문단**을 얻었다. 코스는 자기 채점 방식을 갖지 않으므로 행으로 넣으면 「자기 채점을 가진 트랙」으로 읽힌다. `docs/00` §4.3 에 기록.

## 근본 원인 — 워크트리 베이스

워크트리 셋이 **전부** `f0fd6f7`(18 커밋 뒤)에서 갈렸다. `main` 이 아니라 낡은 ref 에서 자른다. 그 베이스에는 `data/clone.ts`·`0003_clone.sql`·영역별 i18n 카탈로그·`screens/repos/` 가 없어서, A 는 데이터 층을 다시 지을 뻔했고 B 는 문구를 넣을 데가 금지된 조립기밖에 없었다. A 가 step 0.1 에서 잡고 파일 하나 건드리지 않고 멈췄다. `f0fd6f7` 은 `482f341` 의 조상이라 `merge --ff-only` 로 셋 다 복구했고, A 는 자가 복구 권한을 주어 재기동했다.

0.2 는 넷 중 둘, 0.3 은 셋 중 셋이다. 다음 팬아웃은 sha 대조에 더해 **파일 존재 검사**를 브리프에 넣어야 한다 — 갈래가 「있는 줄 알았던 것이 없네, 내가 만들자」로 새지 않는다.

## 상위가 병합 뒤 직접 한 것

- 홈의 코스 진입 두 줄(A 가 계약만 남기고 `components/home` 은 B 것이었다)
- `components/shell/TimeQueue.tsx` — 시간 단위(`초`·`분`)와 진행 문장을 `queue.*` 키로. B 의 en 스모크가 영어 화면에서 `초초초초` 를 잡아 이름 붙인 상수로 빼 두고 보고한 자리다. 그 상수도 같이 지웠다.
- `tests/e2e-ui/shell.spec.ts` 의 낡은 단언 — `'fresh 을 읽는 중'` 은 조사를 띄어 쓰고 낱말과 무관하게 `을` 로 고정한 옛 문구다. B 의 `{{repo|josa:을,를}}` 가 둘 다 고쳤으므로 고칠 것은 테스트였다.
- `packages/store-sql/src/catalog.ts` 재생성 — `queue.sql` 의 D123 주석만큼 뒤처져 있었다(주석 한 줄, SQL 변경 없음).
- D125 등록 + `docs/05` §2.1 표·§2.2 유니온에 여섯 번째 화면.

## 검증

병합마다 `install → catalog:build → build → lint · typecheck · test:unit · test:gates · check:rust` 를 돌렸다. 최종 트리:

```
lint            clean            typecheck      12/12 Done
test:unit       168 files · 1754 tests passed
test:gates      108 passed        test:e2e-ui   24 passed
check:contrast  48쌍 통과         check:motion   위반 0건
design:check    3개 생성물 바이트 일치
check:rust      2300/2300 — Rust 0줄 추가
dict:lint       11 passed         dict:schema    드리프트 없음
```