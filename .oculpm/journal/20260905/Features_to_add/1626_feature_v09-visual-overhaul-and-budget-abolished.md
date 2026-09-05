---
schema_version: 1
type: feature
slug: "v09-visual-overhaul-and-budget-abolished"
status: done
difficulty: superhigh
created_at: "2026-09-05T16:26:52+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "scripts/check-rust-budget.sh"
    op: update
  - path: "scripts/sync-design.mjs"
    op: update
  - path: "packages/ui/src/index.ts"
    op: update
  - path: "apps/desktop/src/styles/physics.css"
    op: delete
  - path: "apps/desktop/src/components/shell/TimeQueue.css"
    op: update
  - path: "docs/05-frontend.md"
    op: update
  - path: "CLAUDE.md"
    op: update
related: []
tags:
  - "D181"
  - "D182"
  - "D183"
  - "정본"
  - "디자인"
  - "반응형"
  - "v0.9"
  - "mcp-tool"
---
[x] 0.9 시각 시스템 전면 교체(D182)와 Rust 줄 예산 폐지(D181)

## 추가 기능

사용자 요청 둘. 「Rust 예산을 폐지할게 정본을 수정해」와 「장난스러운 폰트와 장난스러운 디자인(잉크)도 모두 공격적으로 쳐내고 디자인 수준을 높여 달라 · 학습에 최적화된, 심리적으로 학습에 집중할 수 있는, **완전히 새로운 모습**으로 · **전체화면·반쪽화면에서 깨지면 안 된다**」. 정본 수정 권한을 함께 받았다.

**내가 먼저 한 것 — 정본 개정.** §5 Rust 줄 예산 폐지(D181) · §6 시각 시스템 전면 교체(D182) · §7 로고를 앱 아이콘·파비콘으로 한정 · §9 폐기 목록. 등록부에 D181·D182 와, D182 가 참조하는데 행이 없던 **D183**(폰트 사고)을 함께 올렸다.

**병렬 넷 (전부 Opus 5)** — G1 시스템(토큰·활자·프리미티브) · G2 반응형과 게이트 · G3 홈·코스·서가·설정 · G4 학습 화면. 토큰 이름을 내가 계약으로 못박아 넷이 값을 기다리지 않고 동시에 일했다.

## 동작 흐름

**근거가 규칙을 정했다** (G1). 일관성 원칙 실험 23/23 지지 · 효과크기 중앙값 0.86 · 매력적 곁가지 메타분석 **g = −0.16**(부호가 음수) · 신호 주기 g+ = 0.53, **저사전지식 학습자에 더 강함**. 그것이 장식 삭제·마스코트 제거·색은 뜻에만·주 버튼 하나로 번역됐다.

**활자는 재 보고 안 바꿨다** — Plex Sans KR 이 현대 한글 11,172/11,172 를 덮고 짝 모노와 x높이가 같다. Pretendard 는 커버리지가 같은데 용량 두 배·짝 모노 없음. **디스플레이 서체 삭제**(한글 23%만 덮고 D183 사고를 냈다). 번들 9→8파일 1.99→1.80 MB.

**게이트가 못 잡던 것 둘이 드러났다.** ① 합성 굵게가 D183 의 급조 수정 21곳이 아니라 **화면당 71~131건**이었고 최상위 한 줄로 0이 됐다(G2 의 새 글자 게이트). ② 학습 오버레이에 배경 선언이 아예 없어 **뒤의 홈이 좌우로 비쳤다** — 정본 §3-4 가 요구한 전체화면이 실제로는 가운데 상자였다(G4).

**실측이 결정을 바꾼 자리 둘.** 코드 배경 위가 아니면 구문 강조 여섯이 7:1 을 못 넘는다(`--surface-3` 위 5.81) → 코드 위 색면 전량 제거, 강조는 선과 굵기로. `--syn-fn`↔`--accent` 대비 1.13:1 → 밑줄이 글자와 한 덩어리로 읽혀 색 의존을 없앴다.

**최소 창 1000×680 → 720×600.** 1440 폭의 반쪽이 720 이라 그보다 크면 반쪽 타일링에서 창이 안 줄어든다. 옛 근거(T1 편집기가 두 단)를 「좁으면 쌓는다」 규칙이 없앴다.

**내가 마무리로 지운 것** — 리소 프리미티브 넷(`Stamp`·`Reg`·`Misreg`·`Say`)과 마스코트 `dee/` 전량 · `physics.css`(질감·어긋남·기울기) · `mascot.svg` 와 `sync-design` 의 마스코트 산출 · 마스코트 실루엣 게이트 둘과 devtools 의 래스터 측정 · 진행바의 빗금·점무늬(면 하나로) · 옛 토큰을 쓰던 마지막 파일(`RunPanel.css`) · 비활성 단추 대비 5:1(`--text-faint` 는 어떤 표면에서도 7:1 을 못 넘어 글자에 쓸 수 없다). 문서 다섯의 예산 수치도 맞췄다.

**로고 판단** — 정본 §7 을 「마스트헤드 한 자리」에서 **「앱 아이콘·파비콘·README·릴리스, 학습 화면에는 안 올린다」**로 고쳤다. 그 그림이 어긋난 링과 진홍·머스터드로 된 리소그래프라 마스트헤드에 얹으면 §6 이 금지한 「색을 UI 팔레트로 퍼뜨리는 것」이 그 자리에서 다시 일어난다. 화면의 상표는 글자 상표 하나다.

## 검증

`pnpm typecheck`·`pnpm lint` 무출력 · `pnpm test:unit` **2,227 통과 / 실패 0** · `cargo test --workspace` 20 스위트 · `check-rust-budget.sh` 방벽 넷 통과(줄 조사 2,769 — 보고만) · `design:check` 일치 · `check:contrast` **142쌍**(옛 46쌍) · `check:motion` 0 · `test:gates` **144**(chromium+webkit, 새 반응형·글자 게이트 포함) · `test:e2e-ui` **26**. 폭 720·1440·2560 촬영으로 눈 확인, 가로 스크롤 0.

## 메모

사용자 결정으로 남은 것 셋 — 코드 창 16px 대 18px(높이 700 창에 판정란까지 들어가느냐) · 2000px+ 에서 단을 늘릴지 · 밝게·어둡게 스위치를 맨 윗줄에 둘지 설정으로 내릴지.