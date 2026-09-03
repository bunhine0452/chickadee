# 06 · 품질 · 보안 · 릴리스

## 이 문서의 위치

Chickadee 설계 문서 6편 중 마지막. 01(아키텍처) · 02(데이터 모델·스케줄링) · 03(인제스트·파싱·문법 사전) · 04(채점 엔진) · 05(프런트엔드)가 **무엇을 만드는지**를 정한다면, 이 문서는 **그것이 깨지지 않았음을 어떻게 증명하고, 어떻게 배포하고, 사용자의 코드를 어떻게 지키는지**를 정한다. 정본은 `.oculpm/discussion/vibe-code-study-app/discussion.md`의 「결론」(특히 §3 UX 불변 규칙, §5 스택·배포)이며, 이 문서는 그 결정을 검증 가능한 게이트로 바꾼다. 결론과 어긋나는 제안은 만들지 않았고, 바꿔야 할 것은 문서 끝 「열린 질문 / 결정 요청」에 모았다.

## 읽는 순서 / 전제

- 먼저 discussion.md 「결론」 §2·§3·§5, 다음 `design/README.md` 「검수 방법」, 마지막으로 이 문서. 목업 `design/ink-home.html`의 `window.__audit`, `design/src/ink/session.js`의 `?dev=1`, `design/src/ink/t0.js`의 4단 프롬프트 생성이 이 문서가 정식 게이트로 승격하는 원본이다.
- 전제: 저장소 레이아웃은 01-architecture.md. 이 문서는 `apps/desktop/src-tauri/`, `apps/desktop/src/`, `packages/*`, `crates/*`, `dictionary/`, `fixtures/`, `tests/`, `.github/workflows/`, `scripts/`만 참조하며 이름이 다르면 01을 따른다.
- 도구 확정: Rust 테스트 `cargo test` + `insta`(스냅샷) + `criterion`(벤치) · TS 테스트 `vitest` + `fast-check`(property) · 브라우저 게이트 `playwright` · 데스크톱 E2E `tauri-driver` + WebdriverIO(Linux) · 감사 `cargo audit`/`cargo deny`/`pnpm audit`/`gitleaks`.
- 「금지」 = CI 실패, 「권장」 = 리뷰 지적.

---

## 1. 테스트 전략 — 피라미드

원칙 한 줄: **채점·스케줄러·인제스트는 결정론적이어야 하고, 결정론적인 것은 골든 파일로 고정한다.** 핵심 루프에 LLM이 없다는 결정(§5)이 곧 테스트 가능성이다 — 같은 리포·사전·날짜면 같은 카드·큐·판정이 나와야 하고, 그 사실 자체를 테스트한다.

### 1.1 층별 구성

| 층 | 대상 | 도구 · 위치 | PR 차단 | 예산 |
|---|---|---|---|---|
| Rust 단위 | tree-sitter 파서·쿼리, git2 인제스트, 마이그레이션 | `cargo test`+`insta`, `fixtures/golden/` | 예 | 90초 |
| TS 단위 | T0/T1/T2 채점기, FSRS, 큐·카드 생성, 사전 로더 | `vitest`+`fast-check`, `packages/*/src/**/*.test.ts` | 예 | 60초 |
| 통합(헤드리스) | 픽스처 리포 → 인제스트 → sqlite → 카드 → 세션 한 바퀴 | `cargo test --test pipeline` + vitest IPC 재생 | 예 | 3분 |
| 디자인 게이트 | §2 전부 | Playwright(Chromium), `tests/gates/` | 예 | 3분 |
| E2E(데스크톱) | 실제 Tauri 바이너리 | `tauri-driver`+WebdriverIO+xvfb, `tests/e2e/` | Linux만 | 8분 |
| 성능 벤치 | 인제스트·렌더·판정 지연 | `criterion`, `vitest bench`, `bench/` | main 야간만 | 15분 |
| 시각 회귀 | 홈·세션 스크린샷 | Playwright `toHaveScreenshot`, `tests/visual/` | 예 | 2분 |

「왜」: E2E를 첫 층에 두면 첫 달에 플레이키로 무너진다 — 지난 데스크톱 앱에서 E2E 30건 중 12건이 OS별 타이밍 문제였고 결국 전부 껐다. **결정론적 층이 차단하고, E2E는 8건만 Linux에서 차단**한다.

### 1.2 Rust 단위 — 골든 파일과 픽스처 리포

**파서·쿼리 골든**: 03의 형식 그대로 `fixtures/golden/<lang>/<concept>/<case>.<ext>` + `<case>.expected.json`. 내용은 **캡처 목록** `{queryId, matchId, patternIndex, name, form, startLine, startCol, endLine, endCol, nodeKind, inError}` — Rust 는 Site 를 모른다. Site 골든은 03 §8(TS). 언어당 기본 문법 12케이스(선언·호출·조건·반복·함수·클래스·import·에러 처리·컬렉션·문자열·비동기·타입) + 함정 3케이스(주석 안 코드, 문자열 안 코드, 파싱 오류 파일). `insta`는 캡처 스냅샷(`crates/parse/tests/snapshots/`)과 IPC 덤프·마이그레이션 결과 구조체에 쓰고, `.expected.json`·`.snap` diff는 리뷰어가 읽는다.

**픽스처 리포 생성**: `scripts/make-fixture-repo.sh`가 `fixtures/repos/<name>/`을 **git 객체까지 결정론적으로** 만든다.

```bash
#!/usr/bin/env bash
# scripts/make-fixture-repo.sh <name>  — 커밋 해시가 매번 같아야 골든이 성립한다
set -euo pipefail
export GIT_AUTHOR_NAME=fixture GIT_AUTHOR_EMAIL=fixture@example.invalid
export GIT_COMMITTER_NAME=fixture GIT_COMMITTER_EMAIL=fixture@example.invalid
export GIT_AUTHOR_DATE="2026-01-01T00:00:00+0000" GIT_COMMITTER_DATE="2026-01-01T00:00:00+0000"
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null   # 사용자 훅·템플릿 차단
git init -q --initial-branch=main "$1" && cd "$1"
# 이후 fixtures/repos/<name>.steps 파일의 단계(파일 쓰기 → 커밋 메시지)를 순서대로 재생
```

픽스처 3종: `tiny`(커밋 5, TS 200줄), `projectox-like`(커밋 95, TS/TSX/SQL 12k줄), `two-commits`(커밋 2 — T2 생성 불가 빈 상태의 실제 반례) + `large-100k`(벤치 전용, 생성 스크립트) · `poly`(언어당 20파일). `.steps`만 커밋하고 생성물은 CI가 만든다 — 「왜」: `.git`을 리포에 넣으면 서브모듈 오인·훅 실행 위험이 생긴다.

### 1.3 TS 단위 — 골든 케이스·property·결정성

- **채점기 골든**: `packages/grading/src/__golden__/t1/*.json` `{original, answer, expect:{status, reasons, maps}}` — 목업 t1.js의 분류 그대로 `exact`·`equiv`(따옴표·세미콜론·변수명 1:1 치환)·`differ`(누락·추가·**이름 맞바꿈**). T0는 `{card, choice, expect:{ok, why_index}}`, T2는 `{placement, expect:{tier, score}}`. 각 케이스는 04-grading-engines.md 규칙 번호를 `rule:`로 참조한다.
- **스케줄러 property**(fast-check 1,000회, `--seed=20260902`): (a) 잉크 겹 0~4 (b) `labelFor(due)` 는 5개 라벨 중 하나 (c) 「모르겠어요」는 정확히 한 겹, 두 번 눌러도 더 안 내림 (d) 오답은 바닥까지 안 떨어지고 다시 찍기를 오늘 큐에 넣음 (e) 큐 총 시간 10~25분.
- **큐 생성 결정성**: `planSession(repoId, now)`(시드는 `seedOf`) 두 번 호출 `deepEqual`. 무작위는 주입된 seeded PRNG만, `Math.random`은 ESLint `no-restricted-globals`로 금지. 「왜」: 「어제 큐가 이상했다」를 재현하려면 결정성이 필요하다.

### 1.4 통합 — 픽스처 리포 → 세션 한 바퀴(헤드리스)

`apps/desktop/src-tauri/tests/pipeline.rs`: `tiny` 인제스트 → 임시 sqlite → 사용처·커밋 정답지 → **IPC 응답 JSON 덤프**(`fixtures/ipc/tiny/`, `capture` 페이지(`derive.captures_by_file`) 포함). TS 통합은 이 덤프를 `invoke` 모의로 재생해 홈 큐 → T0 오답 → 사다리 2단 점프 → 자동 복귀 → T1 → T2 → 요약까지 돌린다. CI는 덤프와 커밋본을 `git diff --exit-code`로 비교 — 다르면 Rust 계약이 바뀐 것이다.

### 1.5 E2E — Tauri 앱 시나리오 목록

`ubuntu-22.04` + `webkit2gtk-4.1` + `xvfb-run`에서 `tauri-driver`로 실제 바이너리를 구동한다. macOS WKWebView는 WebDriver가 없고 Windows 는 릴리스 스모크로 대체, 0.2 에서 재검토(D13). 시나리오는 8개로 **상한 고정**.

| # | 시나리오 | 통과 조건 |
|---|---|---|
| E1 | 첫 실행 | 온보딩 화면·「프라이버시 노트」 표시, 네트워크 소켓 0(`strace -e trace=network` 카운트) |
| E2 | 리포 등록 | 폴더 선택 → 경로가 sqlite `repo`에 저장, `.git` 없는 폴더는 친절한 거부 |
| E3 | 인제스트 진행 | `projectox-like` 진행률 이벤트 단조 증가, 완료 후 카드 수 > 0 |
| E4 | 홈 | 오늘의 인쇄 큐 표시, 총 분 10~25, 「인쇄 시작」 활성 |
| E5 | 세션 전 흐름 | T0 정답·오답·모르겠어요 사다리 4단·아래층 점프·복귀 → T1 필사 채점 → T2 배치 → 요약 |
| E6 | Esc 복구 | 3번째 판에서 Esc → 홈 → 재진입 시 3번째 판부터, 입력 중 Esc는 입력만 빠져나감 |
| E7 | 야간반 | 스위치 → `data-theme=dark` 저장·재실행 후 유지 |
| E8 | 설정 | API 키 저장(모의 키체인) → 4단 「대화」 활성, 삭제 → 「프롬프트 생성」으로 복귀, 「전부 지우기」 후 DB·로그 파일 부재 |

### 1.6 성능 벤치 — 임계와 실패 처리

| 항목 | 측정 | 목표 | 차단 임계 |
|---|---|---|---|
| 인제스트 10만 줄 | criterion `large-100k` | p50 ≤ 15s(M1) | CI p50 > 22.5s 경고, > 30s 실패; RSS > 450 MB 경고, > 600 MB 실패 |
| 파일 단위 파싱 | criterion | p95 ≤ 20ms | 40ms |
| 홈 49노드 렌더 | 목업 `audit.perf` 이식, 3초 스크롤+hover | p95 ≤ 12ms(3 WebView) | Chromium p95 > 12ms 실패, WebKit 보고 전용 |
| T1 판정 지연 | vitest bench | 비교 엔진 20줄 < 20ms · 40줄 < 35ms · 거터 0.2ms/줄 | 2배 |
| 큐 생성 | vitest bench, 개념 2,000개 | ≤ 50ms | 150ms |

실패 처리: PR은 **보고만**(기준선 대비 % 코멘트), main 야간에서 임계 초과 시 이슈 자동 생성, `bench/baseline.json` 갱신은 사람이 PR로. 「왜」: 공유 러너 잡음으로 PR을 막으면 벤치를 끄게 된다. WebKit은 미측정이라 첫 실측 전까지 보고 전용.

### 1.7 시각 회귀

- 기준선은 **Linux 1 OS × 엔진 2(chromium·webkit) × 주간/야간 × 10장 = 40장**(05 §11, `tests/visual/__screenshots__/linux/`). 날짜·스트릭은 `mask`.
- 허용 오차 `maxDiffPixelRatio: 0.002`, `threshold: 0.2`. 폰트가 번들이라(§3.2) CDN 지연 흔들림이 없다. 갱신은 라벨 `visual-ok` PR(`--update-snapshots` + diff 이미지 아티팩트).

### 1.8 커버리지 목표(모듈별)

| 모듈 | 라인 |
|---|---|
| `packages/grading`, `packages/scheduler` | 95%(판정 오류 = 학습 오류) |
| `packages/dictionary` | 90%(보안 경계 §4.2) |
| `packages/cards`, `packages/concepts` | 85% |
| `crates/*` + `apps/desktop/src-tauri` | 80% (`cargo llvm-cov`) |
| `packages/ui`, `apps/desktop/src` | 60%(E2E·게이트 보완) |
| 전체 | 80% — `vitest --coverage.thresholds` + `llvm-cov --fail-under-lines 80` |

### 1.9 플레이키 격리 규칙

1. 7일 안에 2회 「재실행 시 통과」 → 플레이키 판정(봇이 `test-results/*.xml` 집계) → `@quarantine` 태그로 **비차단 잡** 이동 + 이슈 자동 생성(담당 = 마지막 수정자).
2. 14일 안에 고치거나 삭제. 넘기면 봇이 삭제 PR을 연다.
3. 재시도는 E2E·시각 회귀만 `retries: 1`. 단위·통합·게이트는 0 — 「왜」: 재시도는 결정론적 층의 버그를 숨긴다.
4. 시간 의존 테스트는 `vi.useFakeTimers()` + 고정 날짜 `2026-09-02T09:00+09:00` 필수.

---

## 2. 디자인 품질 게이트 자동화 — 목업의 `__audit`를 테스트로

목업 `ink-home.html`의 `window.__audit`(`fonts`·`contrast`·`measure`·`dee`·`perf`)를 `apps/desktop/src/devtools/audit.ts`로 옮겨 **앱과 테스트가 같은 코드**를 쓴다(§8 디버그 패널도 이것). Playwright가 `vite preview` + `fixtures/ipc/tiny` 모의로 홈·T0/T1/T2·요약·야간반 6화면을 순회하며 `page.evaluate(() => window.__audit.*())`를 호출한다.

| 게이트 | 규칙(결론 §3·§6) | 측정 | 실패 조건 | 예외 처리 |
|---|---|---|---|---|
| 활자 하한 | 13px 미만 토큰 없음 | `audit.fonts()` — 텍스트 가진 가시 요소 전수 `fontSize` | `below13.length > 0` | 없음. `stylelint`로 `font-size` 리터럴도 금지 |
| 대비 | 종이 위 7:1, 잉크 배지 위 4.5:1 | `audit.contrast()` — 실효 배경 합성 후 WCAG 비율 | `paper.below7 > 0` 또는 `onInk.below45 > 0` | `contrast.allow.json` 선택자+사유+만료일(목업의 완료 스티커 4.9:1 포함) |
| 본문 행 길이 | 한글 **30~45자**, 좁은 패널(폭 ≤ 320px)은 하한 **22자** — 정본은 05 §9 (D112) | `audit.measure()` — `p, li, .ask, .fb p` 폭 ÷ 실측 advance | 45 초과 · 30 미만(좁은 패널은 22 미만) | 측면 패널 allowlist |
| 16px 실루엣 | 캡–뺨–턱받이 3단 열 ≥ 2, 뺨 띠 ≥ 2px | `audit.dee(16, 4, true, true)` 캔버스 래스터 열 스캔 | `pass === false` | 없음. `#deeHead`·파비콘·배지 24/32px 4건 고정 |
| 감축 모션 | 전환만 없애고 최종 포즈 유지 | `page.emulateMedia({reducedMotion:'reduce'})` → 정답 제출 후 `.fb.on` 가시·`getAnimations()` 지속 ≤ 1ms | 애니메이션 잔존 또는 최종 상태 누락 | 없음 |
| 키보드 완결 | 고르기 → Enter → Space | 마우스 0으로 E5 재생, 매 단계 `activeElement !== body`; `axe-core` serious 이상 0 | 포커스 유실·axe 위반 | axe 규칙 id allowlist(사유 필수) |
| 모션 상한 | 720ms, LIFER 1.36s | 세션 CSS의 `animation-duration`·`transition-duration` 정적 파싱 | 720ms 초과(LIFER 선택자 제외) | 없음 |

allowlist 항목은 **만료일 필수**(최대 90일). 「왜」: 만료 없는 예외 목록은 6개월 뒤 규칙 자체를 무력화한다.

---

## 3. 프라이버시 모델

원칙: **코드는 어디로도 전송하지 않는다. 데이터는 로컬 sqlite에만. 원격 측정 없음.** 이 셋은 마케팅 문구가 아니라 §3.3의 CI 테스트다.

### 3.1 데이터 목록과 저장 위치

`<app_data>` = Tauri `app_data_dir` (macOS `~/Library/Application Support/dev.chickadee.app/`, Windows `%APPDATA%\dev.chickadee.app\`, Linux `~/.local/share/dev.chickadee.app/`).

| 데이터 | 내용 | 위치 | 코드 내용 포함 | 삭제 |
|---|---|---|---|---|
| 학습 DB | 리포 경로, 개념 사용처(경로·행·열), 카드, 숙련도·FSRS, T1 필사 초안, 세션 로그, 커밋 정답지 | `<app_data>/chickadee.db` | **예**(캡처·사용처 excerpt ≤ 200자·카드 발췌·필사 초안) | 「전부 지우기」·리포별 |
| DB 백업 | 마이그레이션 직전 복사본 3개 | `<app_data>/backups/` | 예 | 동일 |
| 사전 캐시 | YAML 파싱 결과 | `<app_data>/dict-cache/{lang}@{version}.json` | 아니오 | 동일 |
| 설정 | 테마·스위치 | `settings` 테이블(DB 안, 별도 파일 없음) | 아니오 | 동일 |
| 로그·크래시 | 이벤트·오류(§3.4) · 패닉(§8) | `<app_data>/logs/chickadee.log`(5 MiB×5 회전), `logs/crash/*.json` | **아니오(금지)** | 동일 |
| API 키 | LLM 키(선택) | OS 키체인(§3.5) | — | 설정에서 삭제 |

리포는 **읽기만** 한다 — 파일 생성·`.git` 수정 없음(테스트: 인제스트 전후 트리 해시 동일).

### 3.2 네트워크 호출 목록

기본값 0. 예외는 아래 둘이고 둘 다 **기본 꺼짐, 사용자가 설정에서 켠다**. **0.1.0 에서는 둘 다 코드에 없다** — LLM 전송은 D106 으로 0.2 로 미뤘고(01 §7 이 이미 그렇게 적었다), 업데이트 확인은 §5.5 가 빌드에서 뺐다. 그래서 **0.1.0 의 네트워크 호출은 예외 없이 0** 이다.

| 호출 | 조건 | 대상 | 보내는 것 |
|---|---|---|---|
| LLM 4단 「대화」 — **0.2 예정, MVP 에는 없다**(D106) | 키체인에 키 존재 + 사용자가 「보내기」 클릭 | 사용자가 고른 공급자 엔드포인트 | §3.3 범위의 프롬프트만 |
| 업데이트 확인 | 설정 「업데이트 확인」 켬(초기 릴리스는 옵션 자체 없음, §5.5) | GitHub Releases | 앱 버전·OS·아키텍처 |

폰트는 **번들**한다(§7.1). 목업은 CDN 을 쓰지만 앱은 05 §1.4 대로 번들한다(합의됨) — 그대로 두면 첫 화면이 IP를 내보낸다. CSP(§4.3)가 `connect-src`를 잠그므로 호출이 실수로 늘 수 없다.

### 3.3 LLM 전송 범위 규칙

목업 t0.js의 4단(「이 줄과 앞뒤 4줄만 담은 프롬프트, 앱은 스스로 전송하지 않음」)을 규칙으로 고정한다.

1. 범위 = **대상 줄 + 앞 4줄 + 뒤 4줄**(최대 9줄). 함수 전체를 보내지 않는다.
2. **디렉터리 경로·리포명·커밋 메시지·작성자 제외. 파일 base name 은 허용.** 첫 줄은 `파일 {file.base} {focus}행 근처입니다.`(04 §2.4).
3. 생성은 항상 로컬. **0.1.0 은 「복사」만 있다**(D106) — 키체인에 키가 있어도 앱은 보내지 않고, 화면이 「0.2 에서 열립니다」라고 말한다. 0.2 에서 「보내기」가 생기면 **사용자가 눌러야** 나가고, 자동 전송·프리페치는 그때도 금지이며, 보내기 직전 전문을 접지 않고 보여 준다.
4. 테스트: `buildPrompt` 골든 — 9줄 초과 없음, `/`·`\` 포함 경로 문자열·리포명 없음. E1 이 첫 실행 소켓 0 을, E8 이 키 저장·삭제가 화면을 바꾸는 것과 **어느 상태에서도 「보내기」가 없음**을 확인한다.

### 3.4 로그 규칙

- 로그에 **코드 내용·파일 경로·리포명·식별자**를 쓰지 않는다. 허용: `repoId`(정수), 파일·줄 수, 개념 id, 소요 시간, 오류 코드.
- 구현: Rust는 `path`·`code`·`src` 필드를 거부하는 래퍼 `log_safe!`만 허용, `tracing::` 직접 호출은 `clippy.toml` `disallowed-macros`. TS는 `logger.ts` 하나 + ESLint `no-console`.
- 검사: 통합 테스트가 `tiny` 인제스트 후 로그를 읽어 픽스처 소스 줄·홈 경로·`fixtures/` 문자열 부재를 assert. 「왜」: 전 프로젝트에서 「임시 디버그 로그」가 사용자 소스를 지원 티켓에 실어 보냈다.

### 3.5 API 키 저장 — 권장안: OS 키체인

`keyring` 크레이트(macOS Keychain · Windows Credential Manager · Linux Secret Service)에 저장한다 — 평문 파일이 없고 클라우드 백업에 실리지 않는다. `secrets.json`(0600)은 백업 유출, 자체 암호화 파일은 「그 키를 어디에 두나」가 재귀라 버렸다(대안 표). Linux 에 Secret Service 가 없으면 저장 자체가 실패하므로 화면이 「이 컴퓨터에는 안전하게 저장할 수 없습니다」를 내고 **프롬프트 복사는 그대로 된다**고 안내한다. 명령은 셋뿐이고 **값을 되읽는 문은 없다** — `secret_set` · `secret_delete` · `secret_has`(있는지만 답한다, D109). 키는 `WebView` 로 내려오지 않는다. 키는 로그·크래시·내보내기에 절대 없다(테스트: 모의 키를 넣고 산출 파일 전부 grep).

### 3.6 「프라이버시 노트」 — 첫 실행·설정에 표시하는 사용자 문구

**0.1.0 문구** (D106 — 이 판에는 네트워크 호출이 하나도 없다):

> **당신의 코드는 이 컴퓨터를 떠나지 않습니다.** Chickadee는 리포를 읽기만 하고, 학습 기록은 이 컴퓨터의 데이터베이스 한 파일에만 저장합니다. **이 판은 인터넷을 아예 쓰지 않습니다** — 「자유 질문」의 프롬프트도 이 컴퓨터에서 만들어 복사할 뿐, 앱이 스스로 보내지 않습니다. 사용 통계·오류 보고를 보내지 않고, 업데이트도 확인하지 않습니다. 「설정 → 전부 지우기」로 모든 기록을 삭제할 수 있습니다.

**전송이 열린 뒤의 문구** (0.2 이후 — 그때 이 문단으로 바꾼다):

> **당신의 코드는 이 컴퓨터를 떠나지 않습니다.** Chickadee는 리포를 읽기만 하고, 학습 기록은 이 컴퓨터의 데이터베이스 한 파일에만 저장합니다. 인터넷 연결은 사용하지 않습니다. 예외는 두 가지뿐이고 둘 다 기본으로 꺼져 있습니다 — ① 설정에서 API 키를 넣고 「자유 질문」에서 **직접 보내기를 누를 때**, 막힌 줄과 앞뒤 4줄(폴더 경로 없이, 파일 이름만)만 보냅니다. ② 설정에서 「업데이트 확인」을 켜면 새 버전이 있는지 GitHub에 물어봅니다. 사용 통계·오류 보고를 자동으로 보내지 않습니다. 「설정 → 전부 지우기」로 모든 기록을 삭제할 수 있습니다.

**왜 두 벌인가**: 첫 문구가 없는 기능을 있다고 말하면 그 자체가 프라이버시 문서의 신뢰를 깎는다 — 「보낼 수 있다」고 적힌 앱이 실제로는 못 보내는 것과, 못 보낸다고 적힌 앱이 실제로 보내는 것은 방향만 다른 같은 종류의 거짓이다. 키체인 저장은 0.1.0 에도 있으므로 설정 화면의 LLM 절이 그것을 따로 말한다(「지금은 저장만 합니다」).

원격 측정 없음 선언은 README·설정·이 문서에 같은 문장으로. 「왜」: 「익명 통계」 옵트아웃은 오픈소스 데스크톱 앱에서 가장 많은 불신 이슈를 만든다.

---

## 4. 보안

### 4.1 위협 모델 — 악성 리포

클론한 남의 리포·AI 생성 파일도 열린다. 리포는 **신뢰하지 않는 입력**이다.

| 위협 | 대응 | 테스트 |
|---|---|---|
| 파서 폭탄 | 파일 512 KiB·행 20,000바이트 초과는 건너뜀(`IngestSpec.maxFileBytes/maxLineBytes`), 파서 타임아웃 2s(01·03), `AstLite` 깊이 512 초과는 `PARSE_TOO_DEEP` | `fixtures/evil/deep.ts`(중첩 5k)·`long.js`(행 5MB) — ≤ 3s, 패닉 0 |
| 초대형 리포 | `maxFiles 50000` 상한, 초과 시 경고 후 부분 인제스트 | 합성 리포로 UI 메시지 확인 |
| 심볼릭 링크 | `ignore::WalkBuilder` `follow_links(false)` | `evil/link -> /etc`가 결과에 없음 |
| 경로 탈출 | `canonicalize` 후 리포 루트 `starts_with` 실패 시 거부, IPC 경로 인자도 동일 | `../../etc/passwd` IPC 호출이 오류 |
| git 훅 실행 | `git2`(libgit2)는 훅을 실행하지 않는다. **`git` 바이너리 호출 금지** — `Command::new("git")`는 `scripts/check-rust-budget.sh` 의 grep 이 CI 실패 | `.git/hooks/post-checkout`가 파일을 만들면 실패 |

### 4.2 악성 문법 사전(YAML)

사전은 커뮤니티 기여 데이터이고 카드 문구는 HTML로 렌더된다(목업 `data.js`의 `<code>`·`<b>`).

- **스키마 강제**: `dictionary/schema/concept.schema.json`(JSON Schema, `additionalProperties:false`)을 CI와 앱 로드 양쪽에서 검증. 위반 개념은 건너뛰고 로그.
- **템플릿 인젝션**: 표현식 평가 엔진을 쓰지 않는다. 문법은 03 §4.3 의 mustache 부분집합(변수 허용 목록·1단 섹션·부정·`josa`/`code` 필터)뿐이며 변수 값은 치환 전 HTML 이스케이프한다.
- **HTML 허용 태그**: `code b i em br kbd` 6개, 속성 0. `RichText` 컴포넌트 하나(`packages/ui/src/RichText.tsx`)에서 DOMPurify(`ALLOWED_TAGS` 위 목록, `ALLOWED_ATTR:[]`). 사용자 코드 발췌는 항상 텍스트 노드(목업 `esc()`).
- 테스트: `fixtures/evil-dict/` — `<script>`, `<img onerror>`, `javascript:`, `{{constructor}}` — 렌더 결과에 `<script`·`on\w+=` 부재.

### 4.3 WebView·IPC·Tauri 권한

- **CSP**(`tauri.conf.json > app.security.csp`): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; worker-src 'self' blob:; connect-src 'self' ipc: http://ipc.localhost; frame-src 'none'; object-src 'none'`(`worker-src`는 Monaco 워커, 05 전제와 동일). LLM 호출은 **Rust 측 `reqwest`**로 해 `connect-src`에 외부 호스트를 넣지 않고 키도 WebView에 내려보내지 않는다.
- 원격 콘텐츠 0 — 외부 URL은 `shell.open`으로 기본 브라우저에 넘길 뿐. `dangerouslySetInnerHTML`은 `packages/ui/src/RichText.tsx` 와 `apps/desktop/src/components/dee/DeeSprite.tsx`(마스코트 스프라이트) 두 파일만(ESLint `react/no-danger` + `overrides`).
- IPC: Rust `#[serde(deny_unknown_fields)]`, TS `zod` 응답 검증, 경로 인자는 §4.1.
- Tauri v2 capabilities: `fs` 읽기는 다이얼로그로 고른 리포 경로 + `<app_data>`만, `shell`은 `open`만, `http` 플러그인 미사용, `updater`는 §5.5 활성 시에만. 「왜」: allowlist는 처음 넓으면 절대 좁혀지지 않는다.

### 4.4 의존성 공급망·시크릿

- `cargo audit` + `cargo deny check`(advisories·licenses·bans) + `pnpm audit --audit-level=high` PR 차단. 예외는 `deny.toml` `ignore`에 CVE id·사유·만료일.
- 락파일 커밋 + `--locked`·`--frozen-lockfile`. Actions는 **커밋 SHA 고정**. Dependabot 주간 그룹(`rust-minor`, `npm-minor`), 메이저는 개별.
- `gitleaks` PR 스캔. `.env`는 디자인 스크립트용이고 `.gitignore`가 막는다(`OPENROUTER_KEY` 이름만). **앱은 `.env`를 읽지 않는다** — `dotenv` 의존성 금지, 키는 키체인.

---

## 5. CI/CD

### 5.1 PR 워크플로 `.github/workflows/ci.yml` — 예산 12분

```yaml
name: ci
on: { pull_request: {}, push: { branches: [main] } }
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
jobs:
  lint-type-unit:                      # ≤ 4분
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@<sha>
      - uses: pnpm/action-setup@<sha>
      - uses: actions/setup-node@<sha>
        with: { node-version: 22, cache: pnpm }        # D48 — 개발기는 26.7, pnpm 10
      - uses: Swatinem/rust-cache@<sha>
        with: { workspaces: . }
      - run: pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test:unit --coverage
      - run: cargo fmt --check && cargo clippy --locked -- -D warnings && cargo llvm-cov --fail-under-lines 80
  integration:                         # ≤ 3분, 픽스처 리포 생성 → pipeline → IPC 덤프 diff
    runs-on: ubuntu-22.04
    steps: [checkout, rust-cache, "bash scripts/make-fixture-repo.sh tiny",
            "cargo test --locked --test pipeline", "git diff --exit-code fixtures/ipc"]
  design-gates:                        # ≤ 3분, §2
    runs-on: ubuntu-22.04
    steps: [checkout, pnpm, "pnpm build", "pnpm exec playwright install --with-deps chromium",
            "pnpm test:gates", "pnpm test:visual"]
  audit:                               # ≤ 1분
    runs-on: ubuntu-22.04
    steps: [checkout, "cargo audit", "cargo deny check", "pnpm audit --audit-level=high",
            "gitleaks detect --no-git", "bash scripts/check-rust-budget.sh"]
  build-3os:                           # ≤ 12분 — M0 의 종료 증거(빈 창 3-OS). D53
    strategy: { fail-fast: false, matrix: { os: [macos-14, windows-2022, ubuntu-22.04] } }
    runs-on: ${{ matrix.os }}
    steps: [checkout, rust-cache, pnpm, "pnpm tauri build --debug"]
  e2e-linux:                           # ≤ 8분, §1.5 E1~E8
    runs-on: ubuntu-22.04
    steps: [checkout, "apt install libwebkit2gtk-4.1-dev xvfb", "cargo install tauri-driver --locked",
            "pnpm tauri build --debug", "xvfb-run pnpm test:e2e"]
```

캐시: Rust `Swatinem/rust-cache`(크레이트 변경 없으면 3분→40초), pnpm store는 `setup-node`, Playwright 브라우저는 `~/.cache/ms-playwright` 키 = 버전. `bench.yml`은 `cron '0 18 * * *'`(KST 03:00)로 §1.6.

### 5.2 릴리스 워크플로 `.github/workflows/release.yml` — OS당 예산 35분

```yaml
on: { push: { tags: ['v*'] } }
jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - { os: macos-14,      args: '--target aarch64-apple-darwin' }
          - { os: macos-13,      args: '--target x86_64-apple-darwin' }
          - { os: windows-2022,  args: '' }
          - { os: ubuntu-22.04,  args: '' }
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@<sha>
      - { uses: dtolnay/rust-toolchain@<sha>, with: { toolchain: stable } }
      - uses: Swatinem/rust-cache@<sha>
      - run: pnpm install --frozen-lockfile        # pnpm·node 셋업은 ci.yml 과 동일
      - uses: tauri-apps/tauri-action@<sha>
        env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' }   # 서명 키는 §5.5 활성 전까지 없음
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Chickadee ${{ github.ref_name }}'
          releaseBody: 'CHANGELOG.md 의 해당 절 참고'
          releaseDraft: true
          args: ${{ matrix.args }}
```

태그는 **CI 통과한 main 커밋에만**(브랜치 보호). 드래프트를 사람이 확인하고 공개한다.

### 5.3 릴리스 절차

1. semver: `0.x`에서 minor = 기능/스키마 변경, patch = 수정. `1.0`은 서명·자동 업데이트·Windows E2E 뒤.
2. `CHANGELOG.md`는 `git-cliff`(conventional commits)로 생성 후 「사용자에게 보이는 변경」을 손질. 재인제스트가 필요하면 첫 줄에 **⚠ 재인제스트 필요**(§6.3).
3. 순서: `pnpm version minor` → `tauri.conf.json`·`Cargo.toml` 버전 동기 스크립트 → CHANGELOG → PR → merge → `git tag v0.2.0` → push → 드래프트에서 3-OS 설치 스모크 → 공개.
4. 아티팩트는 tauri-action 기본명 `Chickadee_0.2.0_aarch64.dmg` · `_x64.dmg` · `_x64-setup.exe` · `_amd64.AppImage` · `.deb` + `SHA256SUMS.txt`.

### 5.4 서명·공증 유보 — README 우회 안내 문구

「왜」: 서명 없는 배포는 지원 이슈의 절반이 「열리지 않아요」가 된다. 유보하되 안내는 **첫 릴리스부터** 정확히 쓴다. 비용은 열린 질문 3.

> **macOS** — 「확인되지 않은 개발자」 경고가 뜨면 앱을 응용 프로그램 폴더로 옮긴 뒤 터미널에서 `xattr -d com.apple.quarantine /Applications/Chickadee.app`을 실행하거나, Finder에서 **control-클릭 → 열기**. 처음 한 번만 필요합니다. 아직 Apple 공증을 받지 않아서이며, `SHA256SUMS.txt`로 무결성을 확인할 수 있습니다.
> **Windows** — SmartScreen 창에서 **추가 정보 → 실행**. 코드 서명 인증서를 아직 구매하지 않아 나타나는 경고입니다.
> **Linux** — AppImage는 `chmod +x` 후 실행. `libwebkit2gtk-4.1` 필요.

### 5.5 자동 업데이트 — 초기엔 끔

- `0.x` 초기 릴리스는 `tauri-plugin-updater`를 **빌드에 포함하지 않는다**(설정 항목도 없음).
- 켤 때 요구: ① `minisign` 키 쌍 — 공개키 `tauri.conf.json > plugins.updater.pubkey`, 개인키는 Secret `TAURI_SIGNING_PRIVATE_KEY`·`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`(이름만) ② 채널 `stable`·`beta`(`latest.json` 분리) ③ 확인은 **사용자가 켠 경우** 시작 시 1회 ④ 설치 전 확인 다이얼로그 ⑤ 업데이트 전 DB 백업.
- 「왜」: 전 프로젝트에서 자동 업데이트가 마이그레이션 실패 빌드를 전 사용자에게 밀어 하루 만에 롤백했다. 서명 없는 채널은 그 자체가 공급망 취약점이다.

### 5.6 롤백

릴리스는 불변. 결함 시 ① 릴리스 페이지 「알려진 문제」 배너 ② 이전 아티팩트 링크 유지 ③ patch 릴리스. 스키마가 올라간 뒤 내려갈 때는 `backups/`의 직전 백업을 되돌리는 절차를 README에 둔다. 앱은 자기보다 높은 `user_version`을 만나면 **열지 않고** 백업 위치를 안내한다.

---

## 6. 마이그레이션·호환

### 6.1 sqlite `user_version` 절차

- `packages/store-sql/migrations/NNNN_<name>.sql`, 전진 전용. 앱 시작 시 TS 가 `store_open{catalog.migrations}` 로 넘기고 Rust `store` 크레이트가 `PRAGMA user_version`보다 큰 순번을 **한 트랜잭션에 하나씩** 적용하고 성공 시 올린다.
- 적용 전 01 §7 의 `backups/chickadee-v{user_version}-{yyyymmddHHMM}.db` 복사(3개 유지). 실패 시 롤백 + 백업 경로를 담은 오류 화면, 반쯤 올라간 DB로 열지 않는다.
- 테스트: 과거 버전 시드 DB(`fixtures/db/v0001.db` …)를 최신까지 올려 `integrity_check` + 행 수 보존. 새 마이그레이션 PR은 시드 DB를 추가한다.

### 6.2 문법 사전 버전 호환 매트릭스

개념 파일 머리의 `schema: 1`(03 §5.3)과 앱 상수 `SUPPORTED_DICT_SCHEMA = [1, …]`로 판정한다. 선택 필드 추가는 같은 N, 의미 변경·필수 추가는 N+1(03 규칙). 언어 버전은 `_lang.yaml.version`(semver)과 태그 `dict-vX.Y.Z` 로 따로 센다.

| 앱 | 사전 schema 1 | schema 2 | schema 3 |
|---|---|---|---|
| 0.1.x | 읽음 | — | — |
| 0.2.x | 읽음(경고) | 읽음 | 거부·안내 |

사용자가 `<app_data>/dict-user/<lang>/`에 얹은 사전은 번들보다 우선하되 범위 밖이면 무시하고 설정 화면에 사유를 보인다.

### 6.3 재인제스트가 필요한 변경의 판별

02 의 `ingest_run.fingerprint = sha256(grammar_versions_json ‖ query_hash ‖ gen_version ‖ dict_schema)` 를 저장하고, 마지막 행과 현재 빌드 값을 시작 시 비교한다 — 하나라도 다르면 홈에 「재인제스트 필요」 배너(리포 동일성 해시와는 다른 것). **숙련도는 개념 단위라 보존**(결론 §2), 카드·사용처만 재생성. 이 세 값을 바꾼 PR에 CI가 `needs-reingest` 라벨을 붙여 CHANGELOG ⚠의 근거로 삼는다.

### 6.4 내보내기·삭제

- 내보내기: 「설정 → 내 기록 내보내기」 → `<app_data>/exports/chickadee-export-<date>.json`(스키마 버전·개념 숙련도·세션 요약·설정; 카드 발췌·필사 초안은 **선택 체크박스**, 기본 제외). 저장 위치를 고르는 대화상자는 **없다** — `app_write_json` 이 앱 데이터 아래에 쓰고 `app_reveal` 이 그 폴더를 연다(D109). 「사용자가 고른 아무 경로에 쓴다」를 IPC 에 열면 §4.3 의 최소 권한과 어긋난다.
- 전부 지우기: DB·백업·캐시·로그·크래시·내보내기(`app_wipe`) 다음 키체인 항목(`secret_delete`) 순서로 삭제하고 앱을 닫는다. E8 이 파일 부재를 확인한다.

---

## 7. 오픈소스 운영

### 7.1 라이선스·서드파티 고지

- `LICENSE` = MIT. `THIRD_PARTY_NOTICES.md`는 `cargo about generate` + `pnpm licenses list --json`으로 CI가 생성해 릴리스에 동봉.
- tree-sitter 문법은 대부분 MIT이나 **커뮤니티 문법(Swift·Dart)은 크레이트별 확인** — `cargo deny` `licenses.allow = ["MIT","Apache-2.0","BSD-3-Clause","ISC","OFL-1.1"]` 밖은 빌드 실패.
- 폰트: IBM Plex Sans KR·Mono = **OFL 1.1**, Black Han Sans(Zess Type) = **OFL 1.1**, 번들 허용. OFL 의무: 라이선스 전문 동봉(`public/fonts/OFL.txt` 두 벌), 폰트 단독 판매 금지, 수정 시 Reserved Font Name 변경. Black Han Sans는 릴리스 전 원저작자 리포에서 재확인(Q13).

### 7.2 CONTRIBUTING·PR 템플릿

- 사전 기여: `dictionary/<lang>/<concept>.yaml` + `.scm` 추가 → `pnpm dict:lint`(스키마·플레이스홀더·허용 태그·행 길이·중복 id) → PR. 데이터만 바꾼 PR도 `design-gates`가 해당 카드를 렌더해 §2를 돌린다.
- PR 템플릿 체크: 테스트 · 재인제스트 여부 · 로그에 경로/코드 없음 · 허용 태그만 · CHANGELOG.

### 7.3 이슈 템플릿(코드 미포함 기본)

| 템플릿 | 자동 채움 | 코드 포함 |
|---|---|---|
| 버그 | 앱 버전·OS·재현 단계 | 사용자가 명시적으로 붙일 때만 |
| 사전 오류 「이 설명이 도움이 안 됐어요」 | 앱의 카드 화면 버튼이 `concept_id`·`dict_version`·트랙·어느 층(3층 중)이 문제인지를 URL 파라미터로 채움 | **없음** — 사용자 코드 발췌는 넣지 않는다 |
| T1 이의 — 규칙 제안 | `lang` · `reason` 코드 · 형태 서명(식별자 `IDENT` 마스킹) · `engineVersion` · `dictVersion` · `patternKey` · 로컬 누적 수 | 기본 없음 — 체크박스 「원본·답안 두 줄을 포함합니다(기본 꺼짐)」 |

「왜」: 이슈에 사용자 코드가 실리면 리포지토리가 유출 경로가 된다. 마스킹 정보만으로 규칙을 고칠 수 있게 04의 판정 로그를 설계한다.

### 7.4 행동 강령·취약점 신고·지원 OS

- `CODE_OF_CONDUCT.md` = Contributor Covenant 2.1.
- `SECURITY.md`: GitHub Private Vulnerability Reporting 사용, 공개 이슈에 취약점 금지, 첫 응답 72시간, 수정 릴리스 후 공개.
- 지원 매트릭스: macOS 12+ (arm64·x64) · Windows 10 1809+ x64(WebView2 Evergreen 필요) · Ubuntu 22.04+ x64(webkit2gtk 4.1). 이 밖은 「빌드는 가능하나 미검증」.

---

## 8. 관측성(로컬)

- **크래시 리포트**: Rust `panic::set_hook`(`src-tauri/src/panic.rs`) + TS `onerror`/`unhandledrejection` → 둘 다 `app_write_json('logs/crash', …)` 한 문으로 `<app_data>/logs/crash/<ts>.json`(D109) `{app_version, os, arch, user_version, dict_version, where, stack(앱 파일명만), last_ipc(커맨드 이름 20개)}`. 사용자 코드·경로 없음(§3.4 검사). 「설정 → 진단 묶음 만들기」가 zip을 만들고 **사용자가 수동으로** 첨부한다.
- **성능 카운터**: 02 의 `perf_sample` 테이블에 인제스트 총·파일당 p95, 큐 생성, T1 채점, 세션 프레임 p95를 기록(최근 500행 순환). 설정 화면 「성능」 절에서 표로 본다.
- **디버그 모드**: 환경변수 `CHICKADEE_DEBUG=1` 또는 설정 토글 → 로그 레벨 `debug`, IPC 호출 추적(이름·소요 시간만), 목업의 `?dev=1` 패널을 이식한 `__audit` 오버레이 활성. 프로덕션 빌드에서도 켤 수 있되 기본 꺼짐.

---

## 대안과 버린 이유

| 항목 | 대안 | 버린 이유 |
|---|---|---|
| E2E | 3-OS 전부 차단 | macOS WKWebView WebDriver 부재, OS별 타이밍 플레이키 — Linux 8건만 차단, 나머지는 릴리스 스모크 |
| 시각 회귀 | OS별 기준선 3벌 | 폰트 힌팅 차이로 유지비 3배, 실제로 잡는 회귀는 같음 |
| 채점 테스트 | LLM 판정 대조 | 비결정적·비용·결론 §5 위배 |
| API 키 | 암호화 파일 | 키 보관 문제가 재귀 |
| 원격 측정 | 옵트아웃 익명 통계 | 불신 이슈 비용 > 데이터 가치 |
| 업데이트 | 첫 릴리스부터 자동 | 서명 없는 채널 = 공급망 취약점, 마이그레이션 사고 전파 |
| 폰트 | CDN 로드(목업 방식) | 첫 화면부터 네트워크 호출 — 프라이버시 선언 위배. 번들 +≈8 MB 는 수용(D7) |

## 위험과 완화

| 위험 | 완화 |
|---|---|
| 서명 없는 배포로 「열리지 않아요」 이슈 폭주 | §5.4 문구를 README 최상단·릴리스 노트·이슈 템플릿 첫 항목에 고정 |
| WebKit 렌더 성능 미측정 | 첫 macOS 빌드에서 §1.6 렌더 게이트 수동 실행, 초과 시 05 §10 강등 순서 적용 |
| 골든·스냅샷의 무비판 갱신 | `.snap`·`fixtures/ipc` 변경은 CODEOWNERS 리뷰 필수 |
| 커뮤니티 문법(Swift·Dart) 품질·라이선스 편차 | `cargo deny` 허용 목록 + 언어별 골든 15케이스 통과 전 「실험적」 표시 |
| 플레이키 누적 | §1.9 14일 규칙, 봇 삭제 PR |
| 로그 유출 | `log_safe!` 강제 + 통합 테스트 grep |
| 마이그레이션 실패로 DB 손상 | 트랜잭션·사전 백업·상위 버전 거부 |

## 열린 질문 / 결정 요청

1. **디자인 게이트의 소유** — 05 §11은 `scripts/check-contrast.mjs`(토큰 정적 계산)와 Playwright WebKit을 두고, 이 문서 §2는 목업 `__audit`의 런타임 실측(Chromium)을 둔다. 둘 다 유지(정적 = 빠른 PR 게이트, 실측 = 합성 배경·실제 DOM)할지, 하나로 합칠지. 폰트 번들은 01·05와 일치해 충돌 없음. → 결정 D7: 둘 다 유지, 폰트는 번들(+≈8 MB 수용).
2. **4단 프롬프트의 파일 경로 제외** — 04 §4는 목업 그대로 헤더 `파일 {file} {focus}행 근처`를 규약으로 적었고, 이 문서 §3.3은 경로·리포명 제외를 요구한다. **직접 충돌.** → 결정 D8: 디렉터리 경로·리포명은 제외하되 **파일 base name 은 허용** — 첫 줄 `파일 {file.base} {focus}행 근처입니다.`
3. **서명·공증 비용** — Apple Developer 연 $99, Windows OV 인증서 연 $200~400. → 결정 D13: 다운로드 500회 또는 「열리지 않아요」 이슈 10건 시점에 구매.
4. **Windows E2E** — → 결정 D13: 릴리스 스모크로 대체하고 0.2 에서 WebView2 + tauri-driver 재검토.
5. **크래시 리포트 옵트인 전송** — 이 문서는 수동 첨부만. → 결정 D13: 자동 전송 없음.
6. **DB 마이그레이션 되돌리기** — → 결정 D13: 전진 전용 + 백업 3개, down 스크립트 없음.
7. **02·03과의 경계** — → 결정 D2: `ingest_run.fingerprint`·`perf_sample` 은 02 소관(옛 `perf_samples`·`ingest_runs` 폐기), 사전 `schema`·`version` 은 03 소관. 백업 파일 확장자는 01 의 `.db`.

## 구현 체크리스트

- [ ] Q1 픽스처 리포 생성 스크립트 — `scripts/make-fixture-repo.sh` + `tiny`·`projectox-like`·`two-commits` `.steps`, 해시 결정성 확인 (선행: 01 저장소 레이아웃)
- [ ] Q2 Rust 파서·쿼리 골든 — insta **캡처** 스냅샷 `crates/parse/tests/`, grammar 별 15케이스, `cargo insta` 워크플로 (선행: Q1, 03 쿼리 파일)
- [ ] Q3 TS 채점기 골든·스케줄러 property — 골든 30건(T0·스케줄러는 M2, T1·T2 는 M3·M4 에서 추가), fast-check 속성 5개, seeded PRNG (선행: 02, 04)
- [ ] Q4 통합 파이프라인·IPC 덤프 — `pipeline.rs` → `fixtures/ipc/tiny` → vitest 재생, `git diff --exit-code` 게이트 (선행: Q1~Q3)
- [ ] Q5 `__audit` 이식 — `apps/desktop/src/devtools/audit.ts` + Playwright `tests/gates/` 7게이트 + allowlist 만료 검사 (선행: 05 화면 골격)
- [ ] Q6 시각 회귀·감축 모션·키보드 완결 — 40장 기준선, `emulateMedia`, axe-core, 마우스 0 주행 (선행: Q5)
- [ ] Q7 `ci.yml` + `audit` 잡 — lint/type/unit/integration/gates/audit, SHA 고정, 캐시, `scripts/check-rust-budget.sh` (선행: Q4, Q5)
- [ ] Q8 로그 안전 래퍼 — Rust `log_safe!` + clippy 금지, TS `logger.ts` + `no-console`, 통합 테스트 grep (선행: 01)
- [ ] Q9 LLM 전송 범위·키체인 — `buildPrompt` 골든(9줄·경로 없음), `keyring`, Rust측 reqwest, 「보내기」 확인 UI (선행: 05, 열린 질문 2) — **범위 조정(D106)**: `reqwest` 전송과 「보내기」는 0.2. M5 는 골든 + `keyring` 저장·삭제·존재 확인 + 그 세 상태의 화면까지
- [ ] Q10 악성 입력 방어 — 파일·행·깊이·타임아웃 상한, 심볼릭 링크·경로 탈출 거부, `fixtures/evil`·`evil-dict`, DOMPurify `RichText` 단일화 (선행: 03 인제스트, Q8)
- [ ] Q11 Tauri 보안 설정 — CSP, capabilities 최소화, `deny_unknown_fields`·zod, `react/no-danger` 규칙 (선행: 01)
- [ ] Q12 마이그레이션 프레임 — (러너는 02 「마이그레이션 러너」) 백업 3개, 시드 DB 테스트, `ingest_run.fingerprint` 배너, 내보내기·전부 지우기 (선행: 02 스키마)
- [ ] Q13 오픈소스 문서 세트 — LICENSE·THIRD_PARTY·OFL 전문·CONTRIBUTING·이슈 템플릿 3종·CoC·SECURITY·지원 매트릭스, Black Han Sans 재확인 (선행: 없음)
- [ ] Q14 `release.yml` + README 우회 안내 — tauri-action 4매트릭스 드래프트, `SHA256SUMS.txt`, git-cliff, 버전 동기 스크립트 (선행: Q7)
- [ ] Q15 E2E Linux 8건 + 벤치 야간 + 관측성 — tauri-driver·xvfb E1~E8, `bench.yml` 기준선 봇, 크래시 리포트·`perf_sample`·디버그 모드 (선행: Q4, Q12)
