---
schema_version: 1
type: feature
slug: "t1-clonepad-and-session-wiring"
status: done
difficulty: high
created_at: "2026-09-03T16:50:31+09:00"
session_id: "20260903-008"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "m3"
  - "t1"
  - "monaco"
  - "perf"
  - "wkwebview"
  - "session"
  - "mcp-tool"
---
[x] M3 · T1 판 배선과 ClonePad — Monaco 실측 314 ms 로 1단계는 textarea (D93)

## 추가 기능

### 데이터 층
- **`packages/concepts`** 가 인제스트에서 `block` 행을 쓴다. `text_hash` 는 `fnv1a64(파일 content_hash · 줄 범위)` — 블록마다 원문을 읽지 않는다(파일 377개 리포에서 IPC 가 그만큼 늘어난다). 분절·순위·마스크는 여기서 안 한다(D86 · 의존 방향이 `cards → concepts` 라 부를 수도 없다).
- **`apps/desktop/src/data/blocks.ts`** — 후보 긷기(문법별로 나눠서 마스크 표를 맞춘다) · 원문 읽기(`file_read_lines`; `block` 에 바이트 열이 없다) · 카드 넣기 · `block.ast_json` 캐시 · 답안 파싱.
- **T1 슬롯이 실제로 돈다** — `trackSlot('t1')` 이 카드가 없으면 `maker.forBlock()` 으로 그 자리에서 만든다. `CardMaker` 에 `forBlock()` 을 더했다.
- **`finishPlate`** 가 `grade`(백분율·문턱·잠깐 보기·「한 단계 쉽게」·이름 맞바꿈)·`stageAfter`·`lastPct`·`whyAnswer`·`appeals` 를 받는다.

### 화면
- `screens/session/T1Plate.tsx`(필사 → 채점 결과 → 왜 게이트 세 화면) · `t1Copy.ts`(사유 코드 → 한국어) · `SessionScreen` 이 `plate.track` 으로 판을 고른다.
- 표현 컴포넌트 8종과 `ClonePad`(Monaco) + `PlainPad`(textarea 폴백)는 하위 세션이 만들었다. Monaco 는 `React.lazy` 로 T1 판을 걸 때만 내려온다 — 청크 **gzip 594 KB**(예산 1.2 MB), 앱 JS 는 그대로 **gzip 279 KB**(350).
- `packages/ui` 의 `FlatButton` 에 `onHold` 를 더했다(원본 잠깐 보기는 누르고 있는 동안만이고, 키 오토리피트로 다시 세지 않는다).

## 실측 (릴리스 빌드 · 격리된 `HOME` · 창을 앞에 세운 채 · `projectox-like`)

| mark | 실측 | 예산 | |
|---|---|---|---|
| `t1:monaco` | **314 ms** (n=2) | 250 | **초과** |
| `frame_p95` | 18~24 ms (116~172프레임) | 12 | 초과 (리포가 달라 D80 과 비교 대상 아님) |
| `home:paint` | 141~156 ms | 400 | 통과 |
| `session:mount` | 3~4 ms | 50 | 통과 |
| `t0:grade` | < 1 ms | 30 | 통과 |
| `theme:switch` | 7~10 ms | 100 | 통과 |
| `lifer:open` | 11~13 ms | 50 | 통과 |

`t1:monaco` 는 첫 마운트 299 ms, 두 번째도 비슷해 p95 314 다 — **2.3 MB 청크를 내려받는 값이 아니라 Monaco 의 에디터 구성 자체**다. 05 §8 이 이 경우에 밟으라고 적어 둔 단(1단계만 textarea)을 밟았다(D93). 예산은 낮추지 않았고, 남은 일은 `editor.api`(전체 에디터) 대신 기여 집합을 줄이는 것이다.

## 실제 앱에서 확인한 것 (M2 지뢰 대응)

`parse_snippet` 을 `VITE_PERF=1` 하네스의 첫 걸음으로 넣어 **Tauri 명령 디스패치를 실제로** 지나가게 했다 — `step:parse-snippet:program:err=false`. M2 에서 `ingest_start` 가 인자 모양으로만 깨진 적이 있어(테스트는 전부 초록) 새 명령에는 이 걸음을 붙인다.

같은 실행에서 하나 더 드러났다: **갓 등록한 리포에서는 T1 판이 안 나온다**(`log:info:필사 판을 만들지 못했다`). 04 §3.1 순위 ②가 「모르는 문법 ≤ 3개」이고 새 리포는 모든 개념이 0겹이라 어떤 블록도 후보가 아니다. 규칙의 뜻 그대로이지만(못 읽는 코드를 필사시키면 타자 연습이 된다) **T1 슬롯은 T0 를 며칠 돌린 뒤에 열린다**는 뜻이다. 하네스는 그 상태를 만들어(가장 흔한 개념 30개를 2겹으로 적고) 판을 걸어 `t1:monaco` 를 쟀다.

## 검증

- `npx vitest run` → **119파일 1,141테스트 통과**.
- `cargo test --workspace` 전부 통과 · `cargo clippy --all-targets` 0 · `cargo fmt --all --check` 무출력 · 예산 2,101/2,300.
- `npx eslint .` 0 · `stylelint` 0 · `pnpm check:motion` 위반 0 · `pnpm check:contrast` 46쌍 통과 · `pnpm design:check` 통과.
- `pnpm --filter @chickadee/desktop build` 성공 — 문법 6종·워커·Monaco 가 각각 따로 떨어진다.
- 새 테스트: `data/t1.test.ts`(진짜 SQLite 로 원장까지 4건) · `data/blocks.test.ts`(`projectox-like` 후보 7건) · `screens/session/T1Plate.test.tsx`(키보드 12건) · `crates/parse/tests/t1_ast.rs`(AST 픽스처 22건) · `pipeline.rs` 의 `projectox_block_dump_is_stable`(12~40줄 블록 331개).