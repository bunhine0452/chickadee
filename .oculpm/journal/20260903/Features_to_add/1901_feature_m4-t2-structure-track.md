---
schema_version: 1
type: feature
slug: "m4-t2-structure-track"
status: done
difficulty: superhigh
created_at: "2026-09-03T19:01:31+09:00"
session_id: "20260903-008"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "m4"
  - "t2"
  - "graph"
  - "answer-key"
  - "grading"
  - "dependency-map"
  - "golden"
  - "perf"
  - "mcp-tool"
---
[x] M4 · T2 구조 — import 지도·정답지·3티어 채점, 결정 D94~D104

## 추가 기능

### 경계 (직접)
- **`git_diff_text`**(D64) — `crates/git` 의 `file_diff()` + 명령. 형태를 01 §3.1 의
  `CommitFileDiff`(헝크 전문)에서 **`FileDiff { relPath, added, truncated }`** 로 좁혔다(D98):
  읽는 곳이 04 §8.1 의 「추가 줄이 전부 import 문」 한 군데뿐이고, 헝크 전문은 사용자 코드를
  IPC 로 더 많이 흘린다. `changed()` 와 `file_diff()` 가 `diff_of()` 하나를 나눠 쓴다.
- **statement 9개** — `derive.edge_clear`/`edge_insert`(01 §3.4 의 `edge_replace` 를 둘로,
  D99) · `t2.unit_files`·`t2.edges`·`t2.commit_candidates`·`t2.commit_files`·
  `t2.recent_changes`·`t2.appeal_picks` · `block.openable`(D96). 146개가 됐다.
- **`CardPayload` t2 를 넓혔다**(D100) — `edges` 3-튜플(kind) · `files` 에 `folded`·`cycle` ·
  `commit` 선택 · `flow`/`pairs`. 04 §7.3 의 「type 점선·http 이중선」과 §8.3 의 나머지 3종이
  담길 자리가 없었다.
- 인제스트가 `import_edge` 를 쓴다 — 해석은 **리포 전체 파일 집합**에, 쓰기는 **이번에 판
  파일**에만(증분이 전체 인제스트가 되지 않게).
- `data/graph.ts`(IPC) · `t2.ts`+`t2-quiz.ts`(생성 조합과 §8.3 3종) · `T2Plate`+`t2Copy` ·
  `session-flow` 의 `gradeT2Plate`/`finishT2Plate` · 큐의 `forUnit()` 슬롯.

### 하위 세션 다섯 (전부 서로 다른 디렉터리, 충돌 0)
`resolve-imports.ts`(04 §7.1 표) · `t2-graph.ts`(SCC·밴드·barycenter·24 축약) ·
`t2-key.ts`(§8.1 정답지) · `grading/t2*`(§8.2·§8.3·§8.4) · `components/t2/` 7종.

## 밟은 것

- **go 엣지가 통째로 사라지고 있었다.** `resolveGo` 가 패키지 **디렉터리**를 돌려주는데
  `import_edge.to_file_id` 는 `file(id)` 외래키다 — 배선이 조용히 건너뛰었다. 대표 파일
  (사전순 첫 번째)로 바꾸고 「`to` 는 언제나 `paths` 의 원소」를 불변식으로 못박았다.
- **24 노드 상한이 상한이 아니었다.** ①(폴더 접기)도 ②(밴드 3 잎)도 안 무는 입력에서
  60 노드가 남았다. 세 번째 걸음을 뒀다(D102).
- **그 걸음이 지도의 허브를 먼저 지웠다.** 대지 소속을 차수보다 앞에 두는 바람에, 서비스
  30개가 하나를 가리키는 별 모양에서 **그 하나**가 먼저 빠져 엣지가 0이 됐다. 차수를 앞으로.
- **`trap` 집합이 자기 템플릿을 못 쓴다.** 04 §8.1 의 「core 의 1-hop 이웃」으로 좁히면
  ③④ 가 영원히 안 나온다(1-hop 이면 ①② 가 반드시 맞는다). 단서를 빼니 목업의 다섯 문장이
  **정확히** 나온다(D101).
- **덤프의 지정자에 따옴표가 붙어 있다.** `capture.excerpt` 는 `'./x'` 이고 따옴표를 벗기는
  것은 `deriveFile` 의 일이다(D18). 덤프를 지정자가 아니라 **캡처 행 그대로** 담고 테스트가
  `deriveFile` 을 지나게 고쳤다 — 처음엔 63파일에서 엣지가 0건이었다.
- **`projectox-like` 는 깊이 2 짜리 별이다.** `gen wave` 가 만든 파일 92개가 전부
  `core/time.ts` 하나만 가리켜, 04 §8.3 의 영향 반경(들어오는 화살표)과 흐름 추적(3~6 노드
  경로)이 **원리적으로** 안 나온다. 층이 있는 대지(`features/cart` 5파일 · 커밋 3개)를
  `.steps` 끝에 더했다(D104). 앞 커밋 해시는 안 바뀐다.
- **`two-commits` 는 그래프 3종도 안 나온다** — 파일이 하나라 지도가 없다. 00 §5 의
  「그래프 3종만 나온다」를 「빈 상태」로 고쳤다(D103). 그 픽스처의 `.steps` 머리말이 원래
  그렇게 적혀 있었다.

## 결정 (D94~D104)

D94 `t1:monaco` 예산 250→350(사용자) · D95 `--verdict-differ-face` 신설(사용자) ·
D96 T1 안내를 「판이 없는 문법」 옆에(사용자) · D97 T2 패키지 경계 · D98 `git_diff_text` 형태 ·
D99 statement 이름 · D100 `CardPayload` t2 · D101 trap 집합 · D102 24 노드 세 번째 걸음 ·
D103 `two-commits` 는 빈 상태 · D104 픽스처에 층 있는 대지.

## 검증

- `npx vitest run` → **137파일 1,407테스트 통과**.
- `cargo test --workspace` 전부 통과 · `clippy --all-targets` 0 · `fmt --check` 무출력 ·
  Rust 예산 **2,186/2,300**(`git_diff_text` 85줄).
- `npx eslint .` 0 · `stylelint` 0 · `check:motion` 위반 0 · `check:contrast` **48쌍** 통과 ·
  `design:check` 통과 · `catalog:build` statement 146개.
- 게이트 실측: **2,000 파일 5만 조회 해석 60 ms**(예산 1,500) · **24 노드 배치 1 ms**(5) ·
  2,000 파일 지도도 24 노드 · 배치 결정성 deep-equal · 04 §9 T2 골든 8건 ·
  **Q4 재생을 T1·T2 로 확장해 diff 0**.
- 번들 JS **298 KB gzip**(350) · CSS 25 KB(60) · Monaco 청크 594 KB(1,200).
- 「끝났다는 증거」: `projectox-like` 유닛 하나로 **4종 전부 생성**(Rust 덤프에서 재생),
  `two-commits` 는 넷 다 미생성.