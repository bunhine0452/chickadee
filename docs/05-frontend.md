# 05 · 프런트엔드

## 이 문서의 위치

Chickadee 설계 문서 6편 중 다섯 번째. **목업 두 장(`design/ink-home.html` · `design/ink-session.html`)과 그 소스(`design/src/ink/`)의 CSS·JS 를 Tauri 앱의 컴포넌트·상태·키보드·테스트로 옮기는 방법**을 정한다. 무엇을 배우게 하는가(트랙·사다리·채점)는 여기서 다시 정하지 않는다 — 정본은 `.oculpm/discussion/vibe-code-study-app/discussion.md` 의 「결론」 §3(UX 불변 규칙) · §6(시각 디자인 시스템) · §7(로고·마스코트) · §8(화면)이고, 이 문서는 그 결정을 **코드로 강제하는 장치**를 적는다.

경계: Rust 측 명령·이벤트의 목록은 `01-architecture.md`, 테이블·FSRS·큐 생성은 `02-data-model-and-scheduling.md`, tree-sitter 추출·문법 사전은 `03-ingest-parsing-dictionary.md`, T0/T1/T2 채점 규칙은 `04-grading-engines.md`, CSP·서명·릴리스는 `06-quality-security-release.md`. 이 문서는 그 이름으로만 참조하고 내용을 재정의하지 않는다.

## 읽는 순서 / 전제

1. `discussion.md` 「결론」 §3·§6·§7·§8 → 2. `design/README.md` → 3. `design/ink-home.html` 의 `<style>` 처음 200줄(토큰·리셋·조판 강제·Dee 판 변수) → 4. `design/src/ink/session.js`(엔진) · `t0.js` · `t1.js` · `t2.js` → 5. 이 문서.

전제: Tauri 2 · Node 22 LTS · pnpm 워크스페이스 · TypeScript `strict`. WebView 는 크로미움이 아니다 — macOS WKWebView(Safari 엔진) · Windows WebView2(크로미움) · Linux WebKitGTK. **셋 중 가장 느리고 까다로운 WKWebView 를 기준 엔진으로 잡는다.** 오프라인·프라이버시가 제품 결정이므로 런타임에 네트워크로 가져오는 자원은 0 이다(폰트 포함).

---

## 1. 프레임워크·빌드 선택

### 1.1 권장안 — React 19 + TypeScript + Vite 6, 스타일은 순수 CSS, 상태는 Zustand

| 층 | 선택 | 왜 (경험의 실패 모드) |
|---|---|---|
| 뷰 | **React 19** (함수 컴포넌트, 서버 기능 없음) | 기여자 풀이 가장 넓고, 목업의 `innerHTML` 템플릿을 JSX 로 1:1 옮기기 쉽다. 병목은 뷰가 아니라 SVG·블렌드다(§10) |
| 빌드 | **Vite 6** + `@vitejs/plugin-react` | Tauri 공식 템플릿. Monaco 워커를 `?worker` 로 번들해 오프라인 |
| 스타일 | **순수 CSS** (`styles/tokens.css` + 컴포넌트별 `*.css`, 전역 클래스명은 목업 그대로) | Tailwind 는 `text-xs`=12px 스케일을 들고 와 13px 규칙과 싸운다. CSS Modules 는 해시로 `[data-theme="dark"] .press-btn` 같은 목업 선택자와 `__audit`·Playwright 셀렉터를 깨뜨린다 |
| 상태 | **Zustand** (슬라이스 4개, §3) | Context 만으로는 세션 타이머가 1초마다 트리를 다시 그린다. XState 는 개념이 하나 더 — 세션 엔진은 손으로 쓴 reducer 로 충분하다(`session.js` 가 증거) |
| 에디터 | **`monaco-editor` 직접** (react 래퍼 없음) | 래퍼는 테마·데코레이션 API 를 가린다(§8) |
| 린트 | ESLint(typescript-eslint, jsx-a11y) + **Stylelint 커스텀 룰 4개**(§4·§9) | 가독성 규칙은 "지키자"가 아니라 "어길 수 없다"로 |
| 테스트 | Vitest + Testing Library · Playwright(Chromium + **WebKit**) | §11 |

### 1.2 Tauri 통합

- `apps/desktop/src-tauri/tauri.conf.json` 핵심값: `app.windows[0]` = `{ width: 1360, height: 860, minWidth: 1000, minHeight: 680, visible: false, backgroundColor: "#D9CDB4", title: "Chickadee", titleBarStyle: "Overlay", hiddenTitle: true }`. `visible:false` 로 만들고 폰트가 준비된 뒤 `getCurrentWindow().show()` 를 부른다(§10 FOUT). `backgroundColor` 는 `--desk` 와 같아야 야간반에서 흰 플래시가 없다(테마를 SQLite 에서 읽기 전 첫 프레임은 밝은 종이색 — 허용).
- **창 크로뮴** (D126). `titleBarStyle: "Overlay"` + `hiddenTitle` 은 **macOS 전용**이고, 웹뷰가 제목 표시줄 자리까지 그린다 — 종이·책상 색이 창 끝까지 간다. 그 자리를 비우는 것은 CSS 한 벌이다: `main.tsx` 가 macOS 에서 `<html data-chrome="overlay">` 를 세우고, `styles/app.css` 가 `--chrome-top: 28px`(그 외 OS 는 `0px`) 로 `body` 에 위 여백을 준다. `position: fixed` 라 그 여백을 못 받는 세션 오버레이(`.proof`)만 `inset` 을 직접 받는다. 창을 잡아 끄는 자리는 `index.html` 의 `.chrome-drag`(`data-tauri-drag-region`) 한 줄이고, `#root` 밖에 있어 화면이 바뀌어도 그대로다. Windows·Linux 는 시스템 표시줄을 그대로 쓴다.
- IPC 는 01 의 `@chickadee/ipc-client` 로만 부른다. `@tauri-apps/api/core` import 는 `packages/ipc-client` 밖에서 린트 금지(`no-restricted-imports: @tauri-apps/api/core`). 명령 이름(`repo_list`·`ingest_start`·`store_query`·`store_batch` 등)과 페이로드는 `01-architecture.md` 가 소유한다. 이 문서에서 `session.save()` · `session.resume()` · `home.load()` 처럼 점으로 적은 것은 **`apps/desktop/src/data/*.ts` 의 리포지토리 함수**로, `ipc.store.query/batch` 와 01 §3.4 statement 이름을 통해 `02` 의 `session`·`session_item` 테이블을 읽고 쓴다 — 전용 명령이 아니다.
- 플러그인: `plugin-dialog`(리포 폴더 선택) · `plugin-clipboard-manager`(사다리 4단 「복사」 — WKWebView 의 `navigator.clipboard` 는 사용자 제스처 밖에서 거부된다) · `plugin-opener`(외부 입문 자료 링크) · `plugin-log`(성능 측정값을 파일로). `plugin-store` 는 쓰지 않는다 — 설정도 SQLite 한 곳.
- CSP 는 `06` 소관이지만 프런트 전제는 이것: `default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; worker-src 'self' blob:`(06 §4.3 에 `worker-src` 가 반영됐다). `'unsafe-inline'` 은 Monaco 가 인라인 스타일을 주입하기 때문이고, 우리 코드는 인라인 `style=` 를 **CSS 변수 주입(`--w`, `--p`, `--tilt`) 에만** 쓴다.

### 1.3 번들 예산 (gzip 기준, CI 에서 `size-limit` 로 강제)

| 항목 | 예산 | 비고 |
|---|---|---|
| 앱 JS (Monaco 제외) | ≤ 350 KB | React 19 + Zustand + 앱 코드. 초과 시 빌드 실패 |
| Monaco 청크 | ≤ 1.2 MB, **T1 문제를 걸 때 `import()`** | 홈·T0·T2 는 Monaco 를 내려받지 않는다 |
| CSS | ≤ 60 KB | 목업 CSS 전량 ≈ 48 KB(비압축) |
| 폰트 | ≤ 9 MB(비압축) | §1.4. 설치본 크기이지 로드 시간이 아니다. **실측 2.0 MB**(9파일, D55) |
| 첫 화면(홈) 인터랙티브 | ≤ 400 ms (창 표시 후) | §10 |

### 1.4 폰트 자체 호스팅

목업은 Google Fonts CDN 을 쓴다. 앱에서는 **금지** — 오프라인 결정과 충돌하고, 첫 실행마다 Google 에 요청이 나가며, CDN 서브셋은 열 때마다 글리프가 바뀌어 행 길이 실측이 흔들린다.

| 서체 | 용도 (토큰) | 굵기 | 출처 | 라이선스 |
|---|---|---|---|---|
| IBM Plex Sans KR | `--f-ui` 본문·UI | 400 · 500 · 600 · 700 | `github.com/IBM/plex` 릴리스 zip 의 `woff2/` | SIL OFL 1.1, RFN "Plex" |
| IBM Plex Mono | `--f-mono` 코드·라벨·큐 | 400 · 500 · 600 · 700 | 위와 동일 | SIL OFL 1.1 |
| Black Han Sans | `--f-poster` 워드마크·단원 번호·큰 숫자 | 400 | `github.com/google/fonts/ofl/blackhansans` | SIL OFL 1.1, RFN "Black Han Sans" |

규칙:
- **서브셋 없이 원본을 그대로 동봉한다.** Plex 두 벌은 IBM/plex 릴리스의 `fonts/complete/woff2/` 원본 woff2 다. Black Han Sans 는 상류에 woff2 가 없어 TTF 를 컨테이너만 woff2 로 바꿔 넣는다 — 글리프·`name` 테이블 불변이라 서브셋이 아니다(D55). OFL 은 수정본(서브셋 포함)에 예약 서체명(RFN)을 금지한다 — 이름을 바꾸면 `font-family` 토큰이 갈라지고, 사용자 코드 주석의 희귀 한글이 폴백 서체로 섞인다. 9 파일 실측 2.0 MB 는 설치본이 감당한다.
- 위치 `apps/desktop/src/assets/fonts/` + `OFL-Plex.txt` · `OFL-BlackHanSans.txt`, 「설정 › 정보」에 고지 한 줄. MIT 앱 안의 OFL 동봉은 허용된다.
- `styles/fonts.css` 에 `@font-face` 9 개, `font-display: block`. `index.html` 에 본문 400·700, Mono 400, Poster 400 네 파일 `<link rel="preload" as="font" crossorigin>`. 폴백 스택은 목업 그대로 두되 폴백으로 그려지는 순간은 없어야 한다(§10 게이트).

### 1.5 대안과 버린 이유

| 대안 | 장점 | 버린 이유 |
|---|---|---|
| Solid | 세밀 반응성, WebView 에서 가장 빠름 | 기여자 풀·Testing Library·a11y 린트가 얇다. 병목은 뷰가 아니다(§10) |
| Svelte 5 | 짧은 문법, 스코프 CSS 내장 | 스코프 CSS 가 목업의 전역 `[data-theme]`·`[data-trim]` 선택자와 싸운다 |
| Vue 3 | 한국어 자료 많음 | React 와 동급인데 Monaco·Tauri 예제가 적다 |
| 목업 바닐라 그대로 | 옮길 것이 없다 | `innerHTML` 템플릿은 XSS 표면(사용자 코드가 곧 데이터), 모듈 전역 상태(`S`, `T`)는 테스트 불가 |
| Tailwind | 빠른 조립 | 12px 스케일, `@apply` 드리프트, 토큰 이중화 |
| `@monaco-editor/react` | 마운트 코드 절약 | 테마·데코레이션·키 훅을 가린다. 직접 마운트는 80줄 |
| Preact | 40 KB 절약 | 예산 안에서 의미 없는 절약, devtools 차이 |

---

## 2. 앱 셸과 화면 구조

### 2.1 화면 목록

| id | 이름 | 목업 근거 | 내용 |
|---|---|---|---|
| `home` | 홈 — 내 리포의 기능 지도 | `ink-home.html` | 마스트헤드(로고·오늘 요약·리포 전환·스위치 2) · 오늘 할 것(시간 비례 큐 + 목록 + 「학습 시작」) · 숙련도 척도 · 다시 풀 개념 · 아직 안 배운 문법 · 단원 목록 · 아직 못 만든 문제 예고 · 14일 컬러 바 |
| `session` (오버레이) | 오늘 학습 — 하루 세션 | `ink-session.html` | 진행 띠(큐·남은 시간·나가기) + 작업대(문제 한 장). T0/T1/T2 문제, 사다리, 채점 결과(판정 · 첫 기록), 학습 완료 요약 |
| `ingest` | 리포 읽는 중 | 없음 (신규) | 단계 4 = Rust `walk·parse·git·write` 를 「git 읽기」「파싱」 2칸으로, TS 파생 `derive`·`cards` 를 「개념 추출」「문제 만들기」 2칸으로. blame 은 배경(표시 없음). **시간 비례 큐 컴포넌트로 재사용**해 표시. 스피너 금지. 취소 가능. 끝나면 `home` |
| `repos` | 서가 — 등록한 리포 전부 | 없음 (신규) | 리포마다 카드 한 장: 이름 · 경로 · 상태 배지(`ok`·`missing`·`detached`) · 마지막 읽기 · 개념 수 · 평균 숙련도 · 오늘 만기. 목록은 `repo.overview` **한 번**으로 긷는다 — `listRepos()` 는 상태를 알려고 리포마다 `repo_probe` 를 부르므로 목록이 리포 수에 비례해 느려진다. 폴더가 아직 있는지는 **그린 뒤에** 확인해 `missing` 으로 고친다. 「리포 추가」는 첫 실행과 같은 폴더 대화상자고, `missing` 이면 「위치 알려주기」가 `relocateRepo` 를 부른다(첫 커밋이 다르면 거절). 「목록에서 빼기 / 전부 지우기」는 모달 없이 카드 안에서 **2단**으로 묻고, `purge` 여도 **카드는 은퇴만** 한다 — `review_log.card_id` 가 NOT NULL 이라 지우면 학습 기록이 끊긴다(D31). 확인 문구가 그 사실을 말한다. 여는 문은 마스트헤드 스위처의 「전부 보기」와 설정 「리포」 절 둘이다 (D119) |
| `first-run` | 첫 실행 · 빈 상태 | 없음 (신규) | 리포가 0개: 로고 배지 + 한 문단 + **0단계 언어 고르기(한국어/English, D117)** + 「리포 등록」 버튼 하나. 고른 값은 `settings.locale` 로 그 자리에서 내려간다 — DB 는 `boot.ts` 가 리포 0개에서도 열어 둔다. 리포는 있는데 문제가 0개(커밋 2개짜리 리포 등): 홈의 단원 자리에 `Forecast` 변형 「책임 배치 문제는 아직 만들 수 없습니다 — 커밋 N개」 |
| `newcomer` | 「프로그래밍이 처음」 안내 | `discussion` §1·§4 | 02/03 이 「바닥 아래 바닥」으로 판정하면 홈 상단에 정직한 안내 시트: 이 앱이 못 하는 것 · 외부 입문 자료 링크(`plugin-opener`) · 「그래도 계속」. 게이트가 아니라 안내 |
| `settings` | 설정 | 없음 (신규) | **표시 언어(한국어/English, D117)** · 밝게/어둡게/시스템 · 장식 숨김(기본 숨김, D179) · 모션 감축(시스템 따름/항상) · 하루 분량 10~25분 · LLM 키(선택, 저장은 `06`) · 문법 사전 언어(**끈 언어는 새 문제에서만 빠진다**, D122) · **제외 글롭**(기본 목록에 더해진다, 03 §1.2 · D122) · 내 커밋 identity(`email·name` 목록, **커밋 author 상위 5명**을 첫 열기 때 자동 제안 — `git config` 는 읽지 않는다, D121 · 03 §1.2. 목록을 고치면 재인제스트 없이 `git_commit.kind`·`author_matched` 만 다시 쓴다) · 데이터 위치 · 서체 고지 |
| `clone` | 클론 코스 — 리포 하나를 순서대로 통째로 필사 | 없음 (신규) | 왼쪽 목차(단원 → 파일 → 조각, 조각별 상태·진행률) + 오른쪽 문제. 문제는 세션의 T1 컴포넌트를 **조립해서** 쓰되 세션의 `T1Plate` 를 통째로 쓰지는 않는다 — `gradeCourseStep` 이 「왜」 답과 이의를 받지 않으므로 그 둘은 없다(D125). **오버레이가 아니라 홈을 대신하는 화면**이고 Esc 는 「저장 후 나가기」 한 겹이다. 진입 셋: 홈 단원 카드 「이 단원 통째로 필사」 · 마스트헤드 「코스」 · 서가 카드. 빈 상태는 코스가 서지 않는 이유를 셋으로 갈라 말한다. 페이딩은 2단계(뼈대만)가 기본이고 대표 개념이 숙련도 3단계 이상이면 3단계(백지) — 1단계는 코스에 없다 (D120) |

### 2.2 라우팅 = 상태, 라우터 없음

```ts
type Screen = 'home' | 'ingest' | 'first-run' | 'repos' | 'settings' | 'clone';
interface UiSlice { screen: Screen; session: SessionState | null; lifer: LiferCard | null; }
```

- **세션 오버레이는 라우트가 아니라 상태다.** `session !== null` 이면 `SessionOverlay` 가 `position:fixed; inset:0` 으로 홈 위에 얹히고 홈 DOM 은 `inert` 가 된다. 왜: 라우터를 쓰면 브라우저 히스토리(뒤로가기)가 생기는데 데스크톱 앱엔 뒤로가기가 없고, Esc 의 주인이 둘이 된다(모달 지옥의 시작).
- URL 쿼리는 **부팅 시 한 번만** 읽는다: `?dev=1`(검수 패널·`window.__audit`) · `?screen=settings` · `?session=fixture:run08&at=3`(E2E 전용, `import.meta.env.DEV` 에서만).
- 화면 전환 시 포커스: `home` → `main[tabindex=-1]`, `session` 열림 → 문제 `article.ps[tabindex=-1]`, 닫힘 → 열었던 버튼(「학습 시작」 또는 개념 상세의 「이 문제 풀기」)으로 복원. 복원 대상은 `ui.returnFocusId` 에 저장.

### 2.3 전체화면 세션의 이탈 규칙 (§3.4 를 코드로)

`SessionOverlay` 가 `keydown` 캡처 단계에서 Esc 를 **유일하게** 처리한다.

0. `.monaco-editor .suggest-widget.visible` 이 있으면 → **아무것도 하지 않고 지나간다**. 뒤이어 버블 단계에서 Monaco 가 자기 제안 위젯을 닫는다 (D143). 이 단이 없으면 캡처 리스너가 위젯보다 먼저 돌아 위젯이 열린 채 Esc 를 누른 학습자가 에디터 밖으로 튕긴다.
1. `document.activeElement` 가 `textarea`/`input`/Monaco 이면 → 오버레이 자신으로 포커스를 옮기고 끝(입력을 빠져나온다. `blur()` 하지 않는다 — D111).
2. 사다리(`ReprintLadder`)가 열려 있고 **포커스가 사다리 안**이면 → 사다리를 접고 포커스를 「모르겠어요」 버튼으로.
3. 그 외 → `session.persist()` 후 즉시 `ui.session = null`. **확인 모달 없음.** 토스트 「세션에서 나왔습니다. 진행은 저장됐습니다. 돌아오면 N번째 문제부터」.

0~2 는 "한 번에 한 겹만 벗긴다"이고, 목업의 `if (typing) blur` 를 두 겹 더 늘린 것이다. 「나가기」 버튼은 3 만 부른다. **LIFER 는 여기 없다** — 베일이 아니라 채점 결과 안의 기록이라 벗길 겹이 아니다 (D131).

### 2.4 창 크기 · 다중 리포

- (개정 — D182) 최소 **720×600**. D11 의 1000×680 은 「T1 `.split` 이 두 단을 고집한다」는 전제 위에 있었고, 좁은 폭에서 단을 쌓는 규칙이 그 전제를 없앴다. 1440 폭 화면의 반쪽이 720 이라 그보다 크면 반쪽 타일링에서 창이 안 줄어든다. 옛 근거: T1 `.split` 은 `minmax(300px,1fr) 2px minmax(300px,1fr)` + 레일 46 + 패딩으로 860px 문제 폭이 필요하고, 진행 띠는 1080px 아래에서 2행으로 접힌다(목업 미디어 쿼리). 680 아래에서는 채점 결과 예약(118px)까지 보이지 않는다.
- **리포를 다루는 길은 둘이다** (D119). 빠른 쪽이 마스트헤드의 스위처, 관리하는 쪽이 `repos` 화면(서가)이다. 홈은 그대로 활성 리포 하나만 본다.
- 리포 전환: 마스트헤드 「리포」 칸이 `RepoSwitcher`(`button[aria-haspopup=listbox]` + `ul[role=listbox]`). 방향키 · Home · End 로 짚고 Enter 로 고르며 Esc 는 목록만 닫고 포커스를 칸으로 돌린다. 포커스는 `ul` 하나에 있고 어느 줄인지는 `aria-activedescendant` 가 말한다. 목록 끝의 「전부 보기」가 서가를 연다. **세션 중에는 전환 불가**(작업 띠에 리포명만).
- 전환은 `repo.activeId` 만 바꾸고 `home` 을 비운다 — 홈이 `home.load(repoId)` 를 다시 부른다. 화면 상태는 파생 캐시라 부분 갱신보다 통째로 버리는 편이 싸고 틀릴 자리가 없다(§3). 진행 중 세션은 리포별로 저장되므로 다른 리포로 갔다 와도 이어 찍힌다.
- 진입: 리포가 0개면 `first-run`, 1개 이상이면 **마지막으로 본 리포**의 홈으로 곧장 간다(`settings.lastRepoId`. 그 리포가 목록에 없으면 첫 줄). 저장은 `activeId` 가 바뀌는 자리 한 곳에서만 한다 — 스위처·서가·첫 등록이 모두 그리로 지나간다. 서가는 **스스로 열리지 않는다** — 스위처의 「전부 보기」나 설정 「리포」 절에서만 연다. 마지막 리포를 지우면 `setRepos` 가 다시 `first-run` 으로 떨어뜨린다.
- 리포를 **추가하는 문은 서가 하나**다. 첫 리포를 넣고 나면 `first-run` 이 다시 뜨지 않으므로, 서가가 없으면 둘째 리포를 넣을 자리도 옮긴 리포를 다시 붙일 자리도 없다.
- 그 문에는 **길이 둘** 있다 (D129): 폴더 고르기와 **git 주소**. 주소 쪽은 `CloneField` 한 컴포넌트이고 첫 실행 화면과 서가가 같은 것을 쓴다 — 리포가 이 컴퓨터에 아직 없을 수 있고, 그때 「먼저 터미널에서 클론해 오세요」는 이 앱이 없애려던 걸음이다. 받을 **부모 폴더**를 고르게 하고 그 아래 주소 끝 이름으로 받는다(받은 코드가 사용자가 아는 자리에 남아야 지우는 것도 사용자가 할 수 있다). 받은 뒤는 폴더를 고른 길과 한 줄도 다르지 않다 — `addRepo` 가 등록하고 인제스트 화면이 열린다. 진행률은 없다: 끝났나·실패했나 둘뿐이고, 그 다음은 시간 비례 큐가 말한다.

---

## 3. 상태 모델

**SQLite(IPC 너머)가 진실이고, 클라이언트 store 는 "지금 화면에 필요한 사본 + 세션 진행"만 가진다.** 항상 오프라인이므로 "동기화 실패" 상태는 없다 — IPC 실패는 곧 버그라 토스트 + 로그, 재시도 UI 없음.

```ts
// src/state/store.ts — Zustand, 슬라이스 4개
interface Store { ui: UiSlice; repo: RepoSlice; home: HomeSlice; session: SessionSlice; }

interface UiSlice {
  screen: Screen; theme: 'light'|'dark'|'system'; trim: 'on'|'off';
  reducedMotion: boolean;             // matchMedia OR 설정
  toast: { msg: string; sub?: string; until: number } | null;
  live: string;                        // aria-live 문구 (§7)
  returnFocusId: string | null;
}
interface RepoSlice { list: RepoSummary[]; activeId: number | null; ingest: IngestProgress | null; }
interface HomeSlice { sheets: SheetVM[]; today: QueueItem[]; concepts: ConceptRow[]; gaps: GapRow[]; days14: number[]; loadedAt: number; }

type Track = 't0'|'t1'|'t2';
type InkLayer = 0|1|2|3|4;
interface QueueItem { id: number; kind: Track; cardId: number; mins: number; label: string; sub: string;
  review?: boolean; retry?: boolean; prereq?: boolean; parentId?: number; parentLy?: [InkLayer, InkLayer]; ly?: InkLayer; }
interface SessionSlice {
  sessionId: number; repoId: number; queue: QueueItem[]; pos: number;
  results: Record<number, CardResult>;        // 인덱스 = 큐 위치 (목업 S.results)
  elapsed: Record<number, number>;            // 초 (목업 S.elapsed)
  carry: Carry | null;                        // 아래층에서 돌아올 때 (목업 S.carry)
  liferCount: number; done: boolean;
  t1Draft: { cardId: number; text: string; stage: 1|2|3 } | null;
}
```

- **세션 저장/복구**(목업 `persist/restore` 승격): `session.save()` 를 (a) 문제를 걸 때 (b) 채점 직후 (c) 큐가 바뀔 때 (d) 5초 tick 마다 (e) Esc 로 나갈 때 부른다. 저장 형태는 `02` 의 `session` 행 + `session_item` 행(`state_json` 에 그 판의 선택·사다리 단·T1 초안·`elapsed_s`) — `SessionSlice` 는 그 두 테이블의 메모리 사본이고 `slice ↔ rows` 변환은 `src/data/session.ts` 한 곳. 홈 진입 시 `session.resume(repoId)` 가 오늘의 미완 세션을 돌려주면 「학습 시작」이 「이어 풀기 · N번째 문제부터」가 된다. 요약의 「오늘 문제 다시 보기」는 `review_log` 를 읽기 전용으로 다시 그린다. `?reset=1` 은 DEV 전용.
- **낙관적 갱신은 세션 안에서만**(write-behind). 홈은 하지 않는다 — 세션이 닫힐 때 `home.load` 를 다시 부르는 편이 단원 40개의 부분 갱신 버그보다 싸다.
- 판정은 `@chickadee/grading`(`gradeT0`), 겹·큐 삽입(`pos+3`)·FSRS 는 `@chickadee/scheduler`(`applyOutcome`·`insertRetry`). 프런트는 `grading.gradeT0(card, choice)` → `scheduler.applyOutcome(mastery, outcome)` 순으로 부르고 결과를 store 에 넣은 뒤 IPC 로 저장한다. 규칙은 `02`·`04` 소관. **목업과 다름**: `t0.js:146` 은 다시 푸는 문제의 정답에도 `+1단계` 를 표시하지만 앱은 02 §3.3(회복만)을 따른다. `gain` 문구(「숙련도 N단계 · 다음 복습 …」)는 `applyOutcome` 결과로만 그린다.
- 타이머 `useSessionClock`: `document.visibilityState !== 'visible'` 이면 세지 않는다. 1초 tick 은 `session.elapsed[pos]` 만 바꾸고 구독자는 `TimeQueue`·남은 시간 텍스트 둘뿐이라 문제 화면은 리렌더되지 않는다(선택자로 보장, 테스트 고정).
- 테마/장식/모션 설정은 SQLite `settings` 가 진실, 부팅 첫 프레임용으로 `localStorage['ink.theme'|'ink.trim']` 에 **읽기 전용 거울**만 둔다(목업 `bindSwitch` 키 이름 유지).

---

## 4. 디자인 토큰 코드화

### 4.1 토큰 표 (`styles/tokens.css` — 목업 `:root` / `[data-theme="dark"]` 전량)

| 토큰 | 밝게 | 어둡게 | 용도 | 텍스트 |
|---|---|---|---|---|
| `--desk` / `--desk-2` | #D9CDB4 / #CFC1A6 | #0B0908 / #050403 | body 배경 (책상) | ✗ |
| `--paper` | #F7F1E3 | #1F1915 | 마스트헤드·대지·작업 띠·판정란 | 바탕 |
| `--paper-2` | #FDFAF0 | #29211B | 패널·시트·교정지 | 바탕 |
| `--paper-3` | #EFE7D4 | #17120E | 인셋·거터·줄번호·비활성 면 | 바탕 |
| `--stock` | #FFFDF7 | #120E0B | 코드 판·에디터·선택된 면 | 바탕 |
| `--ink` | #221D18 | #F3EADB | 본문 1차 (종이 위 13.6~16.4:1) | ✓ |
| `--ink-soft` | #4A433A | #CFC4B2 | 본문 2차·라벨 (7.9~11.2:1) | ✓ |
| `--ink-mute` | #7A7063 | #8E8274 | 괘선·점선·하프톤 (3.9~5.1:1) | **✗ 린트** |
| `--ink-faint` | #A69B8B | #5E5346 | 하프톤 막대·절취선 (2.1~2.7:1) | **✗ 린트** |
| `--rule` | #221D18 | #5A4B3C | 테두리 | ✗ |
| `--blue` / `--blue-deep` | #1250C8 / #0B3A96 | #3B82FF / #1A56C4 | 잉크 면 (청) | ✗ (면) |
| `--pink` / `--pink-deep` | #FF2E7E / #C7135C | #FF3A86 / #C4155C | 잉크 면 (진홍) | ✗ (면) |
| `--yellow` / `--yellow-deep` | #FFC400 / #C08F00 | #FFD030 / #C09600 | 잉크 면 (황) | ✗ (면) |
| `--blue-text` | #0F3F9E | #9CC2FF | 청 글자 (7.7~10.6:1) | ✓ |
| `--pink-text` | #960B42 | #FFA3CE | 진홍 글자 (7.0~10.4:1) | ✓ |
| `--yellow-text` | **#664300** | #FFD866 | 황 글자 (paper-3 위 7.20:1, 확정) | ✓* |
| `--t0`·`--t0-deep`·`--t0-text`·`--on-t0` | =blue 계열, on #FFFDF7 | =blue 계열, on #0A1020 | **T0 별칭** (on-t0/t0 = 6.9 / 5.3:1, AA) | on 만 ✓ |
| `--t1`·`--t1-deep`·`--t1-text`·`--on-t1` | =pink 계열, on #221D18 | =pink 계열, on #1A0A12 | **T1 별칭** (4.7 / 5.7:1, AA) | on 만 ✓ |
| `--t2`·`--t2-deep`·`--t2-text`·`--on-t2` | =yellow 계열, on #221D18 | =yellow 계열, on #1C1400 | **T2 별칭** (10.5 / 12.5:1) | on 만 ✓ |
| `--verdict-exact` / `--verdict-equiv` / `--verdict-differ` | #FF2E7E / #1250C8 / #C08F00 | #FF3A86 / #3B82FF / #C09600 | 판정 색(도장·거터 틱·`.rtag`) — 트랙 색과 독립 | ✗(면) |
| `--verdict-exact-text` / `--verdict-equiv-text` / `--verdict-differ-text` | #960B42 / #0F3F9E / #664300 | #FFA3CE / #9CC2FF / #FFD866 | 판정 **글자**(`.stamp` 라벨) — 값은 pink/blue/yellow-text 와 같다 (D56) | ✓ |
| `--verdict-differ-face` / `--on-verdict-differ` | #FFC400 / #221D18 | #FFD030 / #221D18 | 어긋남을 **면으로** 칠하는 자리(`.rtag.d`) — `--verdict-differ` 는 yellow-deep 이라 면이 어두워진다 (D95) | on 만 ✓ |
| `--knock` | #FFFDF7 | #12100C | 녹아웃(잉크 위 종이색) | ✗ |
| `--glow-t0/-t1/-t2` | **transparent** (신규 정의) | rgba 청/진홍/황 .36~.45 | 야간 글로우 `box-shadow` | ✗ |
| `--dee-paper` · `--dee-gray` · `--dee-blank` | #FDFAF0 · #A69B8B · #E4DAC4 | 동일 | Dee 종이·스크린·빈 판 | ✗ |
| `--dee-k/-blue/-blue-deep/-pink` | (정의됨) | (정의됨) | **삭제 확정** | — |
| `--blend` · `--grain-blend` | multiply · multiply | screen · soft-light | 오버프린트·결 블렌드 | — |
| `--grain-op` · `--grain-tint` | .16 · rgba(255,255,255,0) | .42 · rgba(255,196,120,.5) | 종이 결 | — |
| `--edge` · `--drop` · `--lamp` · `--misreg` | rgba(34,29,24,.30) · rgba(58,44,26,.24) · none · 1.6px | #080604 · rgba(0,0,0,.8) · inset 램프 · 1.6px | 종이 두께·그림자·작업 램프·어긋남 폭 | — |
| `--fs-13 … --fs-24` | 13·14·15·16·18·20·24px | 동일 | 활자 스케일 (**13 아래 없음**) | — |
| `--fs-poster-s/--fs-poster/--fs-poster-l` | 30·44·56px | 동일 | 포스터 활자 (대비 제한 제외) | — |
| `--lh-body` · `--lh-tight` | 1.7 · 1.3 | 동일 | 행간 | — |
| `--measure` | 36em | 동일 | 본문 행 길이 (한글 35~45자) | — |
| `--f-ui` · `--f-mono` · `--f-poster` | §1.4 스택 | 동일 | 서체 | — |
| `--e-hop` · `--e-settle` · `--e-soft` | cubic-bezier 3종 | 동일 | 이징 | — |

대비 수치는 이 문서를 쓰며 토큰값으로 직접 계산한 것이다(WCAG 2 상대 휘도). `--glow-*` 는 목업에서 어두운 테마에만 정의돼 밝은 테마에서 `var()` 가 무효값이 된다 — 밝은 테마에 `transparent` 로 정의해 둔다.

### 4.2 별칭 · 활자 · 행 길이 강제

- **컴포넌트 CSS 는 `--t0/--t1/--t2(-deep/-text)` 와 `--on-t*` 만 쓴다.** `--blue/--pink/--yellow` 직접 참조는 `styles/` 밖에서 Stylelint 룰 `chickadee/track-alias-only` 로 금지. 예외: 도장(`Stamp`)·판정 틱·`.rtag` 처럼 "정합 = 진홍, 동등 = 청, 어긋남 = 황"이라는 **트랙과 무관한 판정 색**은 `--verdict-exact/-equiv/-differ` 별칭을 새로 만들어 쓴다(값은 pink/blue/yellow-deep). 왜: 목업엔 `.gl.exact{background:var(--pink)}` 처럼 판정 색이 원색으로 박혀 있어 나중에 T1 색을 바꾸면 판정 색까지 딸려 바뀐다. **면과 선은 다른 이름이다** — `--verdict-differ`(yellow-deep)는 도장 테두리·거터 틱·범례처럼 선으로 쓰고, 태그처럼 면을 통째로 칠하는 자리는 `--verdict-differ-face`/`--on-verdict-differ` 를 쓴다 (D95). `-exact`·`-equiv` 는 이미 원색이라 `-face` 를 따로 두지 않는다.
- **13px 하한**: 토큰이 없으니 `--fs-12` 는 쓸 수 없다. 남은 구멍은 리터럴 — Stylelint `chickadee/no-font-size-below-13`(`font-size` 선언값이 px/rem 리터럴이고 13px 미만이면 오류, `var()` 만 허용). 목업의 `.map .nd .dir{font-size:12.5px}` · `.newtag{12px}` · `.band-s{13px}` 가 **이 룰에 걸린다** — SVG `<text>` 는 `__audit` 이 `offsetParent` 로 걸러 못 잡았다(§9). 앱에서는 `--fs-13` 이상으로 올리고 상자 폭을 늘린다.
- **`--measure` 강제 선택자**는 목업 그대로: `p, li, dd, blockquote, .prose { max-width: var(--measure) }`, 해제는 `.u-nomeasure` 로만. 추가로 `.ask`·`.note`·`.fb p`·`.rung-body p` 는 이미 `p` 라 자동 적용. 코드 판(`.code`)·표·지도는 `p` 가 아니므로 자유.
- `html{word-break:keep-all; line-break:strict; overflow-wrap:break-word}` 와 `code,kbd,pre{word-break:normal}` 은 `styles/reset.css` 에 그대로.

### 4.3 밝게/어둡게 · 장식 숨김 · 인쇄 물리 범위

- 테마는 `<html data-theme="light|dark">` 하나로만 바뀐다(`system` 이면 `matchMedia` 구독). 어두운 화면은 반전이 아니라 다른 팔레트이므로 **`[data-theme="dark"]` 선택자는 `tokens.css` 와 글로우가 필요한 6개 컴포넌트에만** 허용(Stylelint `chickadee/dark-selector-allowlist`: PressButton · Switch · TimeQueue · Node · Stamp · Crumb).
- 장식 숨김 `<html data-trim="on">` 은 등록표시 · 기울기(`--tilt/--rot/--dy`) · 결 · 판번호 어긋남 · 절취선 · 도장 회전만 끈다. **텍스트·레이아웃은 1px 도 바뀌지 않는다** — Playwright 가 on/off 의 텍스트 박스 좌표를 비교해 고정한다. **기본값은 모든 플랫폼에서 `on`(꺼짐)이다** (D179 — `data/settings.ts` 의 `defaultTrim()`). D12 가 플랫폼으로 갈랐던 근거는 성능이었으나, 이제 근거는 화면의 주인이 누구냐다 — 코드와 다이어그램이 가장 큰 요소여야 하고 장식은 본문 단 밖에만 둔다. 켜고 싶은 사람이 스위치를 켠다. 스위치와 `applyTrim` 은 그대로다.
- 인쇄 물리(`.mr` · `.grain` · `mix-blend-mode`)는 **본문 단 밖에만**: 워드마크 · 단원 번호 `.sig` · `Stamp` · 마스트헤드/단원/진행 띠 바탕 결. `.ps-in` 하위(`.ask` `.fb` `.code` `.rung-body` `.drow`)에서 선언하면 Stylelint 오류. 왜: §6 ①이 리뷰어 눈이 아니라 린트에 있어야 3주 뒤에도 산다.

---

## 5. 컴포넌트 목록

디렉터리: `apps/desktop/src/components/{primitives,dee,plate,shell,home,session,t1,t2}`. **클래스명·컴포넌트 파일명은 목업 그대로 둔다** — D178 이 바꾼 것은 화면 문구뿐이고 `.ps`·`InkScale`·`ReprintLadder` 같은 이름은 이력이다. 충돌 2건만 바꾼다 — 홈 `.ladder`(숙련도 척도) → `.inkscale`, 세션 `.ladder`(다시 풀기 사다리) → `.reprint`.

| 목업 클래스 | 컴포넌트 | props (핵심) | 상태 | 역할·접근성 | 키보드 |
|---|---|---|---|---|---|
| `.pill` | `Pill` | `track?`, `ghost?` | — | 텍스트 | — |
| `.passes` `.n-pass` | `Passes` | `n: InkLayer`, `track` | — | `role=img` `aria-label="숙련도 N단계"` | — |
| `kbd.k` | `Kbd` | `keys: string` | — | `<kbd>` | — |
| `.press-btn` | `PressButton` | `tone:'pink'\|'blue'`, `kbd?`, `disabled` | hover/active/`down`(제출 거부 때 120ms) | `<button>` | Enter/Space |
| `.flat-btn` `.dunno` | `FlatButton` | `ghost?`, `variant:'dunno'`, `on?` | on | `<button>`; dunno 는 `aria-pressed` | Enter/Space |
| `.sw` | `Switch` | `options:[{v,label}]`, `value`, `label` | — | 2개면 `role=switch aria-checked`, 3개(`.dfilter`)면 `role=radiogroup` | Space/Enter, ←→ |
| `.reg` | `Reg` | `hit?` | — | `aria-hidden` | — |
| `.stamp` `.stamp-done` | `Stamp` | `text`, `sub?`, `tone`, `big?`, `rotate`, `hit?` | hit 애니 .38s | `aria-hidden` (의미는 h4·live 가 전달) | — |
| `.say` | `Say` | children | — | `aria-hidden` (길잡이는 장식, 같은 문구는 live 로) | — |
| `.toast` | `Toast` | store `ui.toast` | on/off 3.6s | `role=status aria-live=polite`, 포커스 안 뺏음 | — |
| `.vh#live` | `LiveRegion` | store `ui.live` | — | `role=status`, §7 문구 규약 | — |
| `.mr` | `Misreg` | `as`, `text` | — | `data-w` 복제, `aria-hidden` 가상요소 | — |
| `.grain` | CSS 유틸 | — | — | — | — |
| `<svg><defs>` | `DeeSprite` | — | — | 앱 루트 1회, `aria-hidden focusable=false` | — |
| `.dee` `.dee-sticker` | `Dee` | `ly`, `symbol:'badge'\|'bird'\|'head'`, `size`, `motion?`, `sticker?` | hop/tilt/hang/peek/lifer | `aria-hidden` (§6) | — |
| `.masthead` `.ticket` | `Masthead` | `repo`, `todayMins`, `streak`, `avgLy` | — | `<header>` | — |
| `.jobband` | `JobBand` | `runNo`, `repo`, `queue`, `pos`, `elapsed` | — | `<header aria-label="작업 띠">` | — |
| `.jq` `.queue` | `TimeQueue` | `items`, `pos`, `progress`, `labels?`, `compact?` | now/done/skip/review | `role=img aria-label`(순서·비율 문장) | 높이 18px, 아직 안 지난 칸은 빗금 (D127 — 목업의 14px·`opacity:.3` 을 벗어난다) |
| `.board` `.legend` | `Board`, `Legend` | — | — | `<main>`, 범례 `aria-label` | — |
| `.panel` | `Panel` | `title`, `plain`, `tag?`, `collapsible?`, `defaultOpen?` | — | `<section aria-labelledby>`, 접이식이면 머리가 `<button aria-expanded aria-controls>` 이고 속은 `hidden` 으로만 덮인다 (D133) | — |
| `.today-n` `.qlist` `.stampcard` | `TodayPanel`, `StampCard` | `today`, `streak`, `days` | — | 연속 학습은 숫자만(연출 없음) | Enter=학습 시작 |
| `.inkscale`(구 `.ladder`) | `InkScale` | `counts:number[5]` | — | `role=img` | — |
| `.conc` `.cn` | `ConceptList` | `rows` | soon | `<ul aria-label>` | — |
| `.gaps` `.gap` | `GapsPanel` | `gaps`, `onMake` | hot | 「문제 만들기」 `<button>` | — |
| `.panel.locked` | `LockedPanel` | `title`, `body` | — | `<section aria-labelledby>`; 「아직 안 배운 문법」 옆. T1 후보가 0이면 뜨고, 열리면 사라진다 (D96) | — |
| `.sheet-index` `.sx` | `SheetIndex` | `sheets`, `selected`, `onSelect` | — | `role=tablist` · 칩은 `role=tab` (roving tabindex), 잘리는 이름 대신 `aria-label` 이 단원 번호·이름·진행을 든다 (D133) | `← →` 이동·자동 활성 · `Home`/`End` |
| `.sx-zero` | `SheetIndex` | `sheet.zero` | — | 0장 칩 — 번호 자리가 「0장」이고 **번호를 먹지 않는다**(`sheetNo()` 가 0장을 건너뛰어 첫 진짜 단원이 언제나 1단원이다). 색은 주지 않는다: 트랙 색은 의미가 정해져 있고 0장은 트랙이 아니다 (D136) | 다른 칩과 같다 |
| `.prereq-preview` | `PrereqRung` | `row.state==='preview'` · `row.previewSiteId` | — | 합성 문제의 예고 한 줄 (D137 · 방안 E-4). `.note` 를 물려받아 `--measure` 36em 이다. **`previewSiteId` 가 없으면 그리지 않는다** — 예고할 자리가 없는 합성은 만들지 않는다. 이미 보고 온 개념도 되풀이하지 않는다. 개념 이름의 `<code>` 서식은 평문 문장에 넣기 전에 벗긴다 | 단추는 「가장 단순한 모양으로 먼저 보기」, 나머지는 `gap` 과 같다 |
| `.sheet-lead` | `Sheet` | `sheet.zero` | — | 0장 도입 한 문단. `.note` 를 물려받아 `--measure` 36em·행간 1.7 이다. 몇 장이고 언제 끝나는지를 먼저 말하고, 끝나면 「언제든 다시 열 수 있습니다」로 바뀐다. 단원 머리의 `.sheet-meta` 도 0장에서는 경로·파일 수 대신 장수를 낸다 (D136) | — |
| `.sheet` `.sheet-head` | `Sheet` | `no`, `title`, `meta`, `state:'done'\|'current'\|'locked'`, `avgLy`, `tilt` | — | `<article aria-labelledby>`, 색인이 고른 **한 장만** 그려지고 `role=tabpanel` 에 담긴다 (D133) | — |
| `.rail` `.ps-rail` | `InkRail` | `ly`, `label`, `plus?` | plus on | `aria-hidden` (숙련도는 `Passes`·텍스트가 전달) | — |
| `.node` | `Node` | `state`, `track`, `glyph`, `title`, `pass`, `seed`(dy/rot) | open | `<button aria-expanded>`; locked 는 `aria-disabled` (포커스 가능, 이유 설명). 잠긴 노드는 흔들지 않고 상세에 이유만 연다 | Enter/Space=상세 |
| `.detail` | `NodeDetail` | `node`, `onGo`, `onClose` | open | `region`, 열리면 포커스 이동, Esc=닫기 | Esc |
| `.guide` | `Guide` | `msg`, `motion` | — | `aria-hidden` | — |
| `.forecast` | `Forecast` | `pending`, `variant:'later'\|'cannot'` | — | 텍스트 | — |
| `.colorbar` `.cb` | `ColorBar` | `days14` | — | `role=img` + 셀 `title` | — |
| `.proof` | `SessionOverlay` | store `session` | — | `role=dialog aria-modal=true aria-label="오늘 학습"`, 홈 `inert`, Esc 주인 | §7 |
| `.bench` | `Bench` | children | — | `<main>` 스크롤 컨테이너 | — |
| `.ps` | `ProofSheet` | `no`, `track`, `concept`, `code`, `kind`, `source`, `ly:[from,to]`, `width:'normal'\|'wide'\|'xwide'`, `tilt` | sheetin .34s | `<article tabindex=-1>` 마운트 시 포커스 | — |
| `.crumb` | `Crumb` | `depth: 'prereq'\|'reprint'`(문구는 `session.rolePrereq`·`session.roleRetry`), `parent?`, `onBack?` | — | 텍스트 + 「위로」 버튼 | B |
| `.ask` | `Ask` | `q`, `hint` | hint 갱신 | `<p>` (measure 적용) | — |
| `.code` `.ln` | `CodePlate` | `lines: PlateLine[]`, `pickable?`, `selected?`, `verdict?` | pickable→graded | 보통 `<div>`; pickable 이면 `role=radiogroup aria-label="짚을 곳"` | ←→ 1~4 |
| `.tk` | `PickToken` | `k`, `label` | sel/right/wrong | `<button role=radio aria-checked>` | — |
| `.hole` | `Hole` | `value?`, `state` | filled/right/wrong | `aria-label="빈칸"` | — |
| `.choices` `.ch` | `Choices`, `Choice` | `options`, `selected`, `answer?`, `mono?` | sel/right/wrong/disabled | `role=radiogroup` / `role=radio` | 1~4, ↑↓ |
| `.slot` `.slot-idle` `.fb` | `FeedbackSlot` | `state:'idle'\|'right'\|'wrong'`, `stamp`, `title`, `body`, `edge?`, `rule`, `result?`, `gain` | on | `aria-live=polite`; `min-height:118px` 예약 | — |
| `.link-para` | `LinkPara` | `payoff` | — | `region aria-label="이어보기"`, 복귀 시 포커스 | — |
| `.acts` | `Acts` | `left`, `hint`, `right` | — | 동작 줄 | — |
| `.reprint`(구 `.ladder`) | `ReprintLadder` | `rung`, `lyFrom`, `lyTo`, `card`, `prereqDone` | rung 1~4 | `<section aria-label>`; `.rungs role=tablist`, `.rung role=tab`, `.rung-body role=tabpanel` | §7 |
| `.dict` `.prereq` `.uses` `.askbox` | `DictRung` `PrereqRung` `UsesRung` `AskRung` | `card`, `onJump`, `promptOut` | — | 점프 버튼·`textarea aria-label`·복사 | — |
| `.coach` | `CoachBand` | `step: 1\|2\|3` | — | `<aside aria-label="첫 문제 안내">`. 걸음은 사용자의 동작으로만 넘어간다 — 넘기기 버튼이 없다 (D134) | — |
| `.lifer-note` | `LiferNote` | `concept`, `code`, `where`, `serial` | typeout .56s (지연 .7s) | `FeedbackSlot` 안의 블록 — 대화상자가 아니고 포커스를 뺏지 않는다 (D131) | — |
| `.done-head` `.tally` `.shifts` `.lifer-box` `.streak-line` `.hintbox` | `Summary` | `results`, `mins`, `streak`, `lifer?`, `tomorrow` | — | `<article>` | Enter=홈 |
| `.stepper` `.step` | `Stepper` | `stage` | done/cur | `role=list` | — |
| `.split` `.ref` `.ph` | `SplitPane`, `RefPlate` | `original`, `stage`, `show`, `peek` | peek | 가려진 줄 `aria-hidden`; peek 는 시각 전용 | — |
| `.editor` `.gut` `.gl` | `ClonePad` (Monaco) | `value`, `stage`, `ticks`, `onLeaveLine`, `onChange`, `onPeek`, `onGrade`, `onDown` | focus, tick 3색 | Monaco `ariaLabel="필사 입력"` | §8 |
| `.ed-status` | `EdStatus` | `lines`, `savedAt`, `peeks` | — | 범례는 **텍스트 병기** | — |
| `.score` `.drows` `.drow` `.rtag` `.dfilter` | `ScoreCard`, `DiffRows`, `DiffFilter` | `result`, `filter`, `appealed`, `onAppeal` | exact/equiv/differ/missing/extra/appealed | 행은 `<div role=row>` 가 아니라 목록; 이의 `<button aria-pressed>` | — |
| `.whybox` | `WhyGate` | `q`, `help`, `orig`, `text`, `pick?`, `choices` | cnt ok | `textarea aria-label`, 완료 버튼 `disabled` 제어, 저장 = 02 `why_answer` | Enter |
| `.map` | `DependencyMap` (SVG) | `bands`, `files`, `edges`, `selected`, `graded?`, `hints` | sel/ok/missed/wrong/sec/dim | `svg role=group aria-label`; 노드 `<g role=button tabindex=0 aria-pressed>` | Tab, Enter/Space |
| `.map-status` `.picked` `.hintbox` | `MapStatus`, `PickedChips`, `HintBox` | — | — | `aria-live=polite`(호버 문장은 **live 로 보내지 않음**) | — |
| `.verdict` `.meter` `.rgroups` `.rg` `.commit` | `Verdict`, `ResultGroups`, `CommitSource` | `result`, `core`, `sec`, `trap`, `commit` | — | `.meter role=img` | — |

`CodePlate` 의 구문 강조 규칙: 클래스 `k`(키워드) `s`(문자열) `n`(숫자) `c`(주석) `p`(구두점) `f`(호출·타입) 6종만, 색은 `--blue-text/--pink-text/--yellow-text/--ink-soft/--ink` — 판 안에 색 **면**은 없다(강조 토큰 `.tok.ans` 의 황색 면만 예외, 빈칸 정답 표시). 1차 구현은 목업 `util.js` 의 `hl()` 정규식을 `plate/hl.ts` 로 옮기고, `03` 의 tree-sitter 캡처 이름(`keyword`·`string`·`number`·`comment`·`punctuation`·`function`/`type`)이 오면 같은 6클래스로 매핑하는 `plate/fromCaptures.ts` 로 교체한다. `PlateLine` 타입은 목업 `lines` 그대로: `{ n: number; text?: string; seg?: ({t:string}|{hole:true}|{t:string;pick:number})[]; target?: boolean }`.

---

## 6. 마스코트 통합

- **스프라이트 1회 인라인.** `design/src/ink/mascot.svg.html` 의 `<svg width=0>` 블록을 `apps/desktop/src/assets/mascot.svg` 로 복사(§12)하고, `DeeSprite` 가 `?raw` 로 읽어 `AppShell` 최상단에 `dangerouslySetInnerHTML` 로 한 번 박는다(이 파일 하나만 린트 allowlist). 외부 파일 `<use href="mascot.svg#dee">` 는 WKWebView 에서 CSS 변수가 심볼 안으로 상속되지 않아 **판 변수가 죽는다** — 인라인이 유일한 방법이다.
- 심볼 3종 + 로고: `#dee`(배지: 스티커·레일·범례·요약·판정 gain) · `#deeBird`(길잡이·횃대) · `#deeHead`(16~20px 전용, 파비콘 창) · `#logo`(고정색, 마스트헤드 66px·작업 띠 46px·요약 84px). `Dee` 는 `size < 24` 이면 자동으로 `head` 심볼로 바꾼다(16px 전신 판독 불합격이 로고 검증 기록).
- **판 변수**: `.dee{--lpaper --lk --lg --lb --lt --lp --ly}` 와 `.dee[data-ly="0..4"]` 오버라이드를 `dee/dee.css` 에 그대로. `Dee` 는 `data-ly` 속성만 바꾼다 — React 는 SVG 를 다시 그리지 않고 브라우저가 변수 재평가만 한다(테스트: `ly` 변경 시 `<use>` 노드 동일성 유지).
- **마스코트는 움직이지 않는다** (정본 §7 · D179). 동작 클래스 다섯(`hop`·`tilt`·`hang`·`peek`·`lifer`)과 `useDeeMotion` 훅, 그리고 그 감축 모드 블록을 `dee/dee.css` 와 `Dee.tsx` 에서 통째로 지웠다. `Dee` 가 받는 것은 `ly`·`symbol`·`size`·`sticker` 넷뿐이고 `motion`·`nonce` prop 은 없다.
  - 그래서 720ms 예산에도, §3.7 「상시 애니메이션 금지」에도 마스코트가 걸릴 자리가 없다. `peek` 의 `infinite` 를 2회로 유한화하던 D11 의 예외와 `lifer` 1.35s 의 §3.9 명시 예외는 **가리킬 클래스가 사라져 죽은 항목**이다(`tests/gates/design.spec.ts` 의 `MOTION_EXEMPT` 에서 뺐다. `scripts/check-motion.mjs` 의 `EXCEPTIONS` 두 줄도 같은 이유로 지울 것 — 게이트는 초록이지만 남겨 두면 다음 사람이 그 애니메이션이 있는 줄 안다).
  - **서는 자리는 셋뿐이다** — 빈 상태 · 완료 화면 · 표지. 진도 표시로는 쓰지 않는다(정본 §7 개정) — 진도는 `Passes` 막대와 숫자가 말한다.
  - 타이핑 중 모션 0 은 그대로 산다(§3.9). 마스코트가 빠졌으므로 남은 대상은 전환·강조뿐이다.

---

## 7. 키보드 맵과 포커스

원칙: **모든 단축키는 `e.code`(물리 키)로 판정한다.** 한국어 IME 가 켜져 있으면 `B` 는 `e.key === 'ㅠ'`, `` ` `` 는 macOS 한국어 자판에서 `₩` 가 되어 `e.key` 판정이 전부 깨진다(실제 실패 모드). `e.isComposing` 이면 무시. `Enter`·`Escape`·`Space`·`Digit1~4`·`ArrowLeft/Right` 만 예외 없이 안전하다.

| 문맥 | 키 | 동작 | 충돌 해결 |
|---|---|---|---|
| 홈 | `Enter` | 학습 시작 (포커스가 `main` 일 때만) | 버튼에 포커스면 그 버튼의 Enter |
| 홈 | `Esc` | 열린 노드 상세 닫기 → 토스트 닫기 | 세션 없음 |
| 홈 · 노드 | `Enter`/`Space` | 상세 토글 | — |
| 세션 공통 | `Esc` | §2.3 3단계 | 유일한 주인 = `SessionOverlay` |
| 세션 공통 | `⌘/Ctrl+,` | 설정 (세션 밖에서만) | 세션 중 무시 |
| T0 미답 | `1~4` | 보기/토큰 고르기 | 사다리가 열려 **포커스가 사다리 안**이면 단(rung) 선택. 그 외 항상 보기 (확정) |
| T0 지목형 | `←` `→` | 토큰 옮기기 | 보기형에서는 `↑↓` 가 라디오 이동 |
| T0 | `Enter` | 제출 / (답한 뒤) 다음 | — |
| T0 | `Space` | 답한 뒤 다음 (미답이면 토스트 「먼저 고르세요」) | 버튼 포커스 시 native 우선 |
| T0 | `?` (`Shift+Slash`) | 모르겠어요 = 사다리 토글 | — |
| T0 사다리 | `←` `→` · `Home`/`End` | 단(tab) 이동, `Enter`/`Space` 로 열기 | tablist 관례 |
| T0 아래층 | `B` (`KeyB`) | 답하지 않고 위로 | 아래층 아닐 때 무시 |
| T1 편집 | `Enter` (에디터 밖) | 에디터로 포커스 | — |
| T1 편집 | `Tab` | 2칸 들여쓰기 (**3단계에선 자동 들여쓰기만 제거, Tab 은 유지**)(확정). 제안 위젯이 열려 있으면 대신 제안을 수락한다 (D143) | `addCommand(KeyCode.Tab, …, '!suggestWidgetVisible')` — 문맥을 안 넘기면 이 명령이 언제나 이겨 제안을 영영 못 받는다. 포커스 이동은 `Esc` 후 `Tab` |
| T1 편집 | `Enter` (제안 위젯이 열린 채) | **줄바꿈.** 제안을 수락하지 않는다 | `acceptSuggestionOnEnter:'off'` + `acceptSuggestionOnCommitCharacter:false` (D143). Monaco 기본값 `'on'` 을 그대로 두면 필사 중 줄바꿈이 조용히 식별자로 바뀐다 |
| T1 편집 | `Esc` (제안 위젯이 열린 채) | 위젯만 닫는다 | §2.3 ⓪ |
| T1 편집 | `` ` `` (`Backquote`) 홀드 | 원본 잠깐 보기 (keyup·window blur 에 해제) | 3단계(백지)에도 허용 — 횟수만 기록 |
| T1 편집 | `⌘/Ctrl+Enter` | 채점 | — |
| T1 편집 | `⌘/Ctrl+.` | 한 단계 쉽게 | — |
| T1 결과 | `Enter` | 「왜」 게이트로 | 이의 버튼 포커스 시 native |
| T1 왜 | `Enter` (10자 이상일 때) | 저장하고 마치기 | `Shift+Enter` 는 줄바꿈 |
| T2 미채점 | `Enter` | 채점 (고른 것 있을 때) | 지도 노드 포커스 시 토글이 우선 |
| T2 | `H` (`KeyH`) | 힌트 1→3 | — |
| T2 지도 | `Tab`/`Shift+Tab` · `Enter`/`Space` | 노드 이동·토글 | — |
| T2 채점 후 · 요약 | `Enter`/`Space` | 다음 / 홈으로 | — |

포커스 규칙:
- 문제 마운트 → `article.ps` 로 포커스(스크롤 0). 채점 → 포커스는 그대로, **오버레이의 `.vh#live` 가 한 줄로 읽는다**(D114 — `FeedbackSlot` 은 `aria-live` 를 들지 않는다. 채점 결과 전문은 문구 규약의 60자를 넘고, 홈의 `.vh#live` 는 `aria-modal` 에 가려 세션 중에는 못 쓴다). 사다리 열림 → 현재 단 `tab` 으로. 아래층 점프 → 새 문제. 복귀 → `LinkPara`. 요약 → 「홈으로」 버튼. 세션 닫힘 → `returnFocusId`.
- `SessionOverlay` 는 포커스 트랩(첫/마지막 탭 가능 요소에서 순환). `LiferVeil` 은 그 안의 2중 트랩.
- 토스트·길잡이·도장은 절대 포커스를 받지 않는다.

**aria-live 문구 규약**(`a11y/announce.ts`): 한 곳(`ui.live`), `polite` 만. 형식 = `[상태]. [수치]. [다음 행동]`, 60자 이내, **평문만**(「맞았습니다. 숙련도 3단계 · 다음 복습 9월 14일. Space 로 다음.」). 병기가 필요 없어진 것이 D178 이다 — 「정합 — 맞았습니다. 잉크 3겹」의 앞 절이 통째로 빠지면서 60자 예산도 늘었다. 수치 절은 `session-flow.ts` 의 `gainText` 가 만든다(카탈로그 밖의 유일한 낭독 문구다). HTML 태그 제거(목업 `plain()`), 같은 문장을 연속 낭독하려면 30ms 비웠다 다시 채운다(목업 `live()`). 호버 설명·타이머 갱신·토스트의 부제는 live 로 보내지 않는다.

---

## 8. Monaco 통합 (T1)

- **로드**: `monaco-editor/esm/vs/editor/editor.api` + `basic-languages/{typescript,javascript,python,go,rust,sql,java}/*.contribution` 만 — **일곱이고, 이 목록이 곧 화면이 낼 수 있는 언어 id 의 전부다**(`monacoOptions.MONACO_LANGUAGES`). Swift·Dart 는 아직 없다(`m1-03-swift-dart-sql` 로 보류). 등록 안 된 id 로 `setModelLanguage` 를 부르면 모델이 조용히 plaintext 가 되므로, 확장자 표는 반드시 이 일곱 안에서만 값을 내야 한다 — `.tsx`·`.jsx` 는 `'tsx'` 가 아니라 **`'typescript'`** 다(Monaco 0.52 에 `'tsx'` 라는 id 는 없다). tree-sitter 문법 키(`session-flow.grammarOf`, D19)와는 **다른 표**이고, 두 표를 「같다」고 적어 둔 것이 그 버그의 출처였다. **언어 서비스 워커(`ts.worker`)는 싣지 않는다** (D143) — 워커 하나가 1,286,340 B gzip 으로 §1.3 의 Monaco 청크 예산을 넘고, 떼어낸 12~40줄 블록에서는 「Cannot find name」 융단밖에 못 내며, TS/JS 전용이라 「전 언어 지원」 위에 못 고칠 불균형을 얹는다. 워커는 `editor.worker?worker` 하나, `self.MonacoEnvironment = { getWorker: () => new EditorWorker() }`. 전부 번들이라 오프라인. `ClonePad` 는 `React.lazy` 로 T1 판을 걸 때만 내려온다(§1.3).
- **옵션 고정**(`t1/monacoOptions.ts`) — **층에 따라 갈리지 않는 값만** 여기 있다: `parameterHints:{enabled:false}, formatOnType:false, acceptSuggestionOnEnter:'off', acceptSuggestionOnCommitCharacter:false, minimap:{enabled:false}, folding:false, glyphMargin:false, lineDecorationsWidth:14, lineNumbersMinChars:3, renderLineHighlight:'gutter', scrollBeyondLastLine:false, wordWrap:'off', links:false, contextmenu:false, occurrencesHighlight:'off', selectionHighlight:false, renderWhitespace:'none', fontFamily:'IBM Plex Mono', fontSize:16, lineHeight:30, fontLigatures:false, tabSize:2, insertSpaces:true, unicodeHighlight:{ambiguousCharacters:false, nonBasicASCII:false}, accessibilitySupport:'auto', ariaLabel:'필사 입력'`. `unicodeHighlight` 를 끄지 않으면 **한국어 주석 전체에 노란 테두리**가 생긴다. `acceptSuggestionOnEnter` 는 Monaco 기본값이 `'on'` 이라 **못 박지 않으면 필사 중 줄바꿈이 조용히 제안으로 바뀐다** — 수락은 `Tab` 하나로만 한다.
- **단계별 차이 = 편집 보조 세 층**(D143). 규칙 한 줄: **학습자가 고르지 않은 텍스트를 만드는 보조는 단계와 함께 페이딩하고, 이미 고른 텍스트의 타건 수만 줄이는 보조는 페이딩하지 않는다.**

  | 층 | 옵션 | 1단계 | 2단계 | 3단계(백지) |
  |---|---|---|---|---|
  | L0a 자동 들여쓰기 | `autoIndent` | `'brackets'` | `'brackets'` | `'none'` |
  | L0b 자동 닫기·surround | `autoClosingBrackets`·`autoClosingQuotes`·`autoSurround` | `'languageDefined'` | `'languageDefined'` | `'never'` |
  | L1 단어 기반 제안 | `wordBasedSuggestions:'currentDocument'` · `quickSuggestions:{other:true,comments:false,strings:false}` · `suggestOnTriggerCharacters` | 켬 | 켬 | 켬 |

  코스 판(`CoursePlateView`)은 1단계가 없고 나머지는 같은 표를 쓴다. 세션 1단계는 `PlainPad`(textarea)라 **제안 위젯을 못 단다** — 그 비대칭은 D93 을 지키느라 남긴 것이고, 1단계는 원본이 `RefPlate` 에 펼쳐져 있어 제안이 할 일이 가장 적은 단계이기도 하다. L0a·L0b 를 3단계에서 끄는 근거는 실측이다: 이 리포를 표본으로 세면 「닫힘만 있는 줄」이 TS 비공백 줄의 12.5 %·Rust 15.9 %·Python 4.0 % 이고, 04 §4.6 의 분모가 비공백 줄이라 그 몫이 곧 에디터가 채우는 점수인데, 실제로 공짜인 단계는 3단계뿐이다(1단계는 원본이 옆에 있고, 2단계는 04 §3.2 유지 집합이 닫힘 줄을 이미 잉크로 준다). 그리고 겹 4 는 3단계 통과에서만 나온다. L1 을 페이딩하지 않는 근거도 실측이다: 25줄 창 안에서 식별자 타건의 43.7 %를 줄이면서 **최종 텍스트를 한 자도 바꾸지 않아** `pct` 가 구조적으로 불변이고, 정보량 상한이 「이미 이 버퍼에 있는 낱말」이라 백지에서도 새는 것이 없다(`'currentDocument'` 로 못 박는 이유 — `'matchingDocuments'` 이상은 나중에 원본 판이 Monaco 모델이 되는 날 원본을 그대로 제안한다).

  `Tab` 은 `editor.addCommand(KeyCode.Tab, () => insert('  '), '!suggestWidgetVisible')` — **세 번째 인자가 없으면** 이 명령이 문맥 무관하게 언제나 이겨 제안을 수락할 길이 사라진다.
- **설정 「편집 보조」**: `stage`(기본) / `off` 둘. `off` 는 0.1.0 까지의 동작 그대로다. 값은 `settings` 테이블의 `editor_assist` 키에 있고(`data/settings.ts`), 설정 화면의 문구가 무엇을 잃는지 적는다 — 끄면 타건 수만 늘 뿐 점수 계산은 불변이지만 **같은 85 %가 서로 다른 조건에서 나온 값**이 되므로 이의(04 §5)는 보조 상태별로 따로 모아야 한다.
- **글자가 어디서 왔나** (D143): `AssistCount{keyed, assisted, pasted, accepted}` 를 `peeks` 와 **같은 자리·같은 규칙**으로 센다 — 감점 없음, 기록만, 스케줄러 신호. 분류는 `components/t1/assist.ts` 에 있고 **감사가 아니라 추정**이다(0.52 공개 d.ts 에 `onDidType` 이 없어 변경의 모양으로 가른다). `EdStatus` 가 「손으로 앉힌 글자 N %」 한 항목으로 낸다. 붙여넣기도 여기서 처음 세어진다 — 그전에는 3단계 백지에 원본을 ⌘V 로 통째로 넣어도 어디에도 남지 않았다.
- **테마**: `monaco.editor.defineTheme('ink-light'|'ink-dark')` 를 `tokens.ts`(§12 생성물)에서 만든다. Monaco 는 hex 만 받으므로 CSS 변수를 못 쓴다 — 테마 전환 시 `setTheme` 재호출. 매핑: `keyword`→`--blue-text`(bold) · `string`→`--pink-text` · `number`→`--yellow-text` · `comment`→`--ink-soft`(italic) · `delimiter`→`--ink-soft` · `type`/`identifier` 호출→`--ink`(bold 불가, 기본) · 배경 `editor.background`=`--stock` · 거터 `editorLineNumber.foreground`=`--ink-soft` · `editorGutter.background`=`--paper-3` · 커서 `--ink` · 선택 `--paper-3`. `.code` 판과 같은 색이어야 좌우가 같은 종이로 보인다.
- **줄 단위 판정 데코레이션**: `editor.createDecorationsCollection()` 하나. 각 줄에 `{ range: 줄, options: { linesDecorationsClassName: 'gl-tick gl-exact' | 'gl-equiv' | 'gl-differ', isWholeLine:false } }`. CSS `.gl-tick{width:3px; margin-left:4px; background:...}` 로 목업의 거터 틱(정합 진홍 · 동등 청 · 어긋남 황갈)을 그린다. 범례 `EdStatus` 에 텍스트 병기.
- **줄을 벗어날 때만 판정**: `onDidChangeCursorPosition(e)` 에서 `e.position.lineNumber !== prevLine` 일 때만 `onLeaveLine(prevLine - 1, model.getLineContent(prevLine))` → `04` 의 `evalLine` → 틱 갱신. `e.reason === CursorChangeReason.ContentFlush`(전체 교체)는 무시. IME 조합 중(`editor.onDidCompositionStart/End` 사이)엔 판정 보류.
- **`` ` `` 홀드 = 원본 잠깐 보기**: `editor.onKeyDown(e)`: `e.browserEvent.code === 'Backquote'` → `preventDefault(); if(!e.browserEvent.repeat) onPeek(true)`; `onKeyUp` 같은 키 → `onPeek(false)`; `window.addEventListener('blur')` 도 `onPeek(false)`(WKWebView 는 ⌘ 조합 중 keyup 을 잃는다). `onPeek` 은 **`RefPlate` 에만** `.peek` 를 준다 — 에디터 안 원본 오버레이는 만들지 않는다(지지대 칼럼 안에서만). 첫 홀드에 `peeks++`, 현재 줄과 같은 번호의 원본 줄을 `scrollIntoView`.
- **자동 저장**: `onDidChangeModelContent` → 400ms 디바운스 → `session.t1Draft` → 5초 tick 의 `session.save` 에 실린다. 블러·Esc·언마운트에서 즉시 flush. 「한 단계 쉽게」는 draft 를 유지한 채 stage 만 내린다.
- **폰트 재측정**: 마운트 직후와 `document.fonts.ready` 후 `monaco.editor.remeasureFonts()` — 안 부르면 WKWebView 에서 폴백 폭으로 측정된 커서가 글자 사이에 뜬다.
- **대안(목업의 textarea + 거터)과 버린 이유**: 거터 `div` 를 `textarea.rows` 로 맞추는 방식은 wrap 이 없어야만 정렬되고, 구문 색·줄 API·접근성 모드가 없으며 T3(버그 수리)에서 다시 짜야 한다. 비용은 지연 로드 1.2MB. 단 **WKWebView 마운트가 250ms 를 넘기면**(§10) 1단계만 textarea 로 되돌리는 스위치를 `ClonePad` 인터페이스 뒤에 남긴다.
- **그 스위치는 켜졌다 (D93).** WKWebView 실측 `t1:monaco` **314 ms**(n=2, 릴리스 빌드)로 예산 250 을 넘겼다. 첫 마운트 299 ms 와 두 번째가 비슷해 청크 내려받기 비용이 아니라 **에디터 구성 자체**의 값이다. 그래서 `ClonePad` 는 `fallback` prop 을 갖고 `T1Plate` 이 `stage === 1` 에 켠다(`PlainPad` = textarea + 거터, 같은 props). 2·3단계는 Monaco 그대로다. 예산은 낮추지 않았다 — 남은 일은 `editor.api`(전체 에디터) 대신 기여 집합을 줄이는 것이다.

---

## 9. 접근성·가독성 강제

| 규칙 | 강제 장치 | 실패 시 |
|---|---|---|
| 대비 7:1 (종이 위 텍스트), 4.5:1 (색 배지 위) | ① `scripts/check-contrast.mjs` — `tokens.css` 를 파싱해 텍스트 토큰 5 × 바탕 4 × 테마 2 = 40 쌍을 정적으로 계산, `on-t*`×`t*` 6 쌍은 4.5 기준 ② Playwright 후 `__audit.contrast()` 런타임 전수 | CI 실패. 현재 `--yellow-text`/`--paper-3` 6.82 가 걸린다 (열린 질문 1) |
| 13px 하한 | ① Stylelint 리터럴 룰(§4.2) ② `__audit.fonts()` 를 **SVG `<text>` 포함**으로 확장(`getBoundingClientRect` 로 가시성 판정, `offsetParent` 사용 금지) | CI 실패 |
| 본문 행 길이 — **로케일마다 다르다**(D117) | `__audit.measure()` 승격 → `tests/gates/measure.spec.ts`: `.ask`·`.note`·`.fb p`·`.rung-body p`·`.board-note` 각각 **`ko` 는 30 ≤ chars ≤ 45**(좁은 패널 노트는 22 이상 허용 목록), **`en` 은 45 ≤ chars ≤ 68**(좁은 패널 33) — 실제 서체 advance 로 실측(목업의 표본 문장 방식). 하네스가 `<html data-locale>` 을 읽어 어느 쪽을 걸지 고른다. en 숫자의 근거: 같은 `--measure` 에서 한글 1자 ≈ 라틴 1.5자 폭이라 30~45 를 환산하면 45~68 이고, 통상 권장 범위(45~75) 안에 든다 | CI 실패 |
| 감축 모션 | `[data-motion="reduce"]` 를 설정과 `matchMedia` 로 결정, Playwright `reducedMotion:'reduce'` 로 최종 포즈 스냅샷 | 스냅샷 diff |
| 스크린리더 | jsx-a11y 린트 + §7 문구 규약 단위 테스트(`announce()` 출력이 60자·태그 없음·마침표 형식·**은유 낱말 0**) + Playwright 에서 `role=status` 텍스트 순서 검증 | 테스트 실패 |
| 색맹 | 트랙 색은 항상 `T0/T1/T2` 라벨과 같이(`Pill`·`.tag`·범례) — `TimeQueue` 막대는 `role=img` 문장 + 아래 목록/라벨이 정보를 나르고, 판정 틱 3색은 `EdStatus` 텍스트 범례(같음 · 같은 뜻 · 다름)와 `.rtag` 글자 태그가 따로 있다. 린트: `Passes`·`TimeQueue` 를 라벨 없이 쓰면 타입 오류(`label` 필수 prop) | 타입 오류 |
| 피드백 슬롯 0px | Playwright: 제출 전후 `.ask` 의 `boundingBox().y` 동일 | 테스트 실패 |
| 포커스 유실 | Playwright 각 전환 뒤 `document.activeElement` 가 `body` 가 아님을 단언 | 테스트 실패 |

---

## 10. 성능

**기준 엔진 WKWebView.** 목업 수치(Chromium 49노드 p95 8.5ms)는 참고값일 뿐이다.

| 항목 | 규칙 | 왜 |
|---|---|---|
| `filter` | **0개** (Stylelint 금지, `drop-shadow` 포함) | WebKit 은 filter 를 레이어마다 오프스크린 래스터. 목업이 이미 `box-shadow` 로 바꿨다 |
| `backdrop-filter` | 0개 | 반투명 겹을 쓰는 자리가 없다 (D131 로 LIFER 베일이 빠졌다) |
| `mix-blend-mode` | 화면당 ≤ 12 요소: 워드마크 2 · 단원 번호 N · 도장 ≤ 2 · 결 ≤ 3. 단원 12개 이상이면 번호 어긋남을 `[data-trim]` 과 무관하게 끈다 | 블렌드는 격리 그룹을 만들어 그 조상까지 합성 비용 |
| 흐림 `box-shadow` | 노드당 1개(`.die` 10px), 시트당 1개, 그 외 하드 섀도만 | 흐림 그림자는 transform 변화마다 재래스터 |
| SVG `<use>` Dee | 스티커는 **그림 한 장**으로 굽는다(D115 — `deeImageUrl`). D179 로 움직이는 Dee 자체가 없어졌고, `<use>` 로 남는 것은 스프라이트가 아직 문서에 없는 첫 프레임뿐이다 | `<use>` 는 인스턴스마다 6 경로(수천 점) 재래스터, 캐시 없음 — 홈은 개념 줄마다 하나라 391개였다. 구운 그림은 판마다 한 번 디코드하고 나머지는 blit |
| 상시 애니메이션 | **0개, 그리고 이제 유한화한 것도 0개다** — `blink`(오늘 스탬프)는 정적 점선 + 「오늘」 라벨, `spin`(현재 노드 링)은 정지 점선 링, 마스코트 `peek` 은 클래스째 삭제(D179). `scripts/check-motion.mjs` 가 `infinite` 를 CSS 전수로 막는다 | 컴포지터가 영원히 60Hz 로 깨어 노트북 배터리를 먹는다 |
| 노드 40+ 홈 | `Node` 는 `React.memo`, 시드(`--dy/--rot/--d`) 는 id 해시로 결정론 계산(리렌더 때 흔들리지 않게) | 가상 DOM 비용보다 스타일 재계산이 비싸다 |
| 세션 타이머 | 1초 tick 이 문제 화면을 리렌더하지 않음(§3) | 60분 세션 3600회 리렌더 방지 |
| 폰트 FOUT | `index.html` preload 4 + `font-display:block` + `document.fonts.ready`(300ms 타임아웃) 뒤 `root.render` → `getCurrentWindow().show()` | 창을 폰트 뒤에 보여주면 FOUT 자체가 없다 |
| 측정 | `?dev=1` 에서 `__audit.perf(ms)`(목업 그대로: 스크롤+hover 교대, avg/p95/max/over16) 와 `performance.mark` 6종(`home:paint`, `session:mount`, `t0:grade`, `t1:monaco`, `theme:switch`, `lifer:open`) → `plugin-log` 파일. macOS 는 Safari › 개발 › 앱 이름으로 Web Inspector 타임라인 부착 | Tauri 릴리스엔 DevTools 가 없다 |

예산(p95, 어두운 테마 포함): 홈 48노드 스크롤+hover ≤ 12ms · 문제 마운트 ≤ 50ms · T0 채점→채점 결과 ≤ 30ms · Monaco 마운트 ≤ 350ms(D94 — 250 에서 올렸다) · 테마 전환 ≤ 100ms · 창 표시 후 홈 인터랙티브 ≤ 400ms. **첫 실측을 체크리스트 3번 항목으로 잡고, 예산을 넘는 항목은 규칙을 강화하지 목표를 낮추지 않는다.**

**WKWebView 실측** (릴리스 빌드 · 격리된 데이터 디렉터리 · 창을 앞에 세운 채). 재는 절차는 `apps/desktop/src/devtools/audit.ts` 의 `HOW` 와 `devtools/perfRun.ts` 에 있다.

| mark | 실측 | 예산 | |
|---|---|---|---|
| `frame_p95` | 19 ms (이 리포 · 단원 18 · 개념 스티커 391 · **윈도잉 켜짐**) · 18 ms (`projectox-like`) | 12 | **D115 뒤 다시 재야 한다.** 윈도잉은 안 들었고(D105) 병목은 스티커의 `<use>` 였다 — 하네스 실측(Playwright WebKit · 스티커 1,600개 · 매 프레임 무효화)에서 프레임 p95 28 → 17 ms 로 스티커 0개와 같아졌다. 이 표의 19 ms 는 릴리스 빌드·이 리포에서 다시 재기 전까지 옛 값이다 |
| `t1:monaco` | **292~303 ms** (n=2) | 350 | 통과 — 예산을 D94 로 올렸다. 1단계는 `PlainPad` 그대로(D93) |
| `home:paint` | 106~156 ms (M4 실측 141) | 400 | 통과 |
| `session:mount` | 3~6 ms | 50 | 통과 |
| `t0:grade` | < 1 ms | 30 | 통과 |
| `theme:switch` | 7~48 ms (M4 실측 12~39) | 100 | 통과 |
| `lifer:open` | 11~13 ms | 50 | 통과 |

**리포가 다르면 `frame_p95` 를 비교하지 마라** — 노드 수가 곧 그 값이다(D81).

**편집 보조를 켠 뒤** (D143 · Playwright WebKit = WKWebView **대리**, 릴리스 빌드 실측 아님. 하네스는 `min/vs` 로 Monaco 를 세우고 앱과 같은 옵션을 준다):

| 무엇 | 값 | 판정 |
|---|---|---|
| 자동 닫기 × 한글 조합 | `"` 뒤에 닫는 따옴표가 앉은 채 조합해도 모델은 `s = "한"`, 캐럿은 닫는 따옴표 앞, `compositionend` 1회. 화면 캐럿 이동 px 가 **대조군(자동 닫기 off)과 완전히 같다** | 통과 |
| 타이핑 중 `frame_p95` | 40줄 블록에 33자 · **18.0 ms** — 대조군도 18.0 ms | 차이 없음(둘 다 vsync 바닥 16.6 ms 에 붙어 있어 그 아래는 이 하네스로 못 가른다) |
| 타건 → 첫 제안 목록 | 중앙 116 ms · p95 126 ms. 그중 **100 ms 는 Monaco 자신의 표시 지연**(`suggestWidget._show()` 의 `cancelAndSet(…, 100)` — 깜빡임 방지)이라 실제 작업은 약 16 ms | 새 mark 를 만들지 않았다(MARKS 6종은 §10 표의 것이다) |
| 번들 | L0b·L1 **0 바이트** — 전부 `editor.api` 안에 이미 있다 | 통과 |

`t1:monaco` 는 **아직 다시 재지 않았다.** 옵션 몇 개를 더 넘길 뿐 기여 집합이 늘지 않아 292~303 ms 가 그대로일 것으로 보지만, 그것은 예상이지 실측이 아니다 — 다음 릴리스 빌드에서 재고 이 표를 고친다.

---

## 11. 테스트

- **단위(Vitest + Testing Library)**: `core`(josa · hl · 큐 삽입 · 사다리 전이) · 프리미티브 전부 · `announce()` · `FeedbackSlot` 3상태 · `Choices` 키보드 · `DependencyMap` 레이아웃 결정론 · `Dee` `data-ly` 갱신 시 노드 동일성. 커버리지 80% (`core` 95%).
- **E2E(Playwright)**: Vite dev 서버 + `@tauri-apps/api/mocks` 의 `mockIPC` 를 픽스처 JSON(`fixtures/ui/run08.json` = 목업 `data.js` 이식)에 연결. 프로젝트 2개: `chromium`(WebView2 대리) · **`webkit`(WKWebView 대리)**. 실 바이너리 E2E 는 06 §1.5 의 E1~E8(Linux, PR 차단, `retries:1`)이 맡는다. 이 문서의 15 시나리오는 `mockIPC` 로 chromium·webkit 에서 돌며 PR 차단, `retries:0`.
- 시나리오(목업 자동 주행을 정식 E2E 로):

| # | 시나리오 | 단언 |
|---|---|---|
| 1 | 홈 → 학습 시작 → 1번 문제 정답 | 「같음」 도장 · `+1단계` · live 문구 · `.ask` y 불변 |
| 2 | 2번 문제 오답 | 오답 진단 + 날카로운 자리 코드 · 큐 5→6칸(다시 풀기 `pos+3`) |
| 3 | 3번 문제 `?` 사다리 1~4단 | 숙련도 −1단계 · 오늘로 당김 표시 · 4단 프롬프트 생성·복사(mock clipboard) |
| 4 | 2단 아래층 점프 → 답 → 자동 복귀 | 큐에 「아래층」 삽입 · 복귀 후 `LinkPara` 포커스 · 2단이 「방금 채움」 |
| 5 | 아래층에서 `B` | 큐에서 빠짐 · 위 문제 상태 유지 |
| 6 | 새 문제 첫 정답 → LIFER | 채점 결과 안에 기록(머리말·일련번호·채집지) · 판정문이 같이 읽힘 · 포커스는 다음 문제 단추 · 세션 4번째부터 안 뜸 |
| 7 | T1 예시 답안 채점 | 비공백 줄 기준 — 단언 숫자는 04 §9 골든 픽스처 값을 그대로 쓴다 |
| 8 | T1 이의 → 왜 게이트 | 10자 미만 `disabled` · 코드 복사 거부 · 보기 → 자기 말 |
| 9 | `` ` `` 홀드 / 해제 / window blur | `.ref.peek` 토글 · peeks 카운트 · 에디터 값 불변 |
| 10 | T2 힌트 3 → 채점 → 이것도 맞다 | 새 파일 표시 · 놓침 깜빡임 3회 후 정지 · 커밋 출처 |
| 11 | 요약 | 숙련도 이동 목록 · LIFER 박스 · 내일 예고 · Enter 홈 |
| 12 | 어둡게 + 장식 숨김 | 텍스트 박스 좌표 동일 · 대비 전수 |
| 13 | Esc 3단계 | 입력에서 빠져나오기 → 사다리 접기 → 나가기 → 홈 「이어 풀기」 → 재진입 N번째 문제 (D131 로 LIFER 겹이 빠졌다) |
| 14 | 리포 등록 → 인제스트 진행 → 홈 | 단계 큐 · 취소 · 빈 상태 변형 |
| 15 | 키보드만으로 1~13 | 마우스 0회 프로젝트 (`page.mouse` 금지 픽스처) |

- **시각 회귀**: `toHaveScreenshot` 골든 10장 × 밝게/어둡게 × 엔진 2 = 40장. `animations:'disabled'`, `reducedMotion:'reduce'`, 폰트 로드 대기, 시드 고정(노드 지터·도장 각도). 임계 0.2%. 골든은 PR 에서 라벨 `visual-ok` 로만 갱신.
- 매 시나리오 뒤 `__audit.fonts/contrast/measure` 자동 실행(§9).

---

## 12. 목업 → 앱 이전 순서 · 빌드 스크립트

**그대로 옮기는 것**: `tokens`·리셋·조판 강제·인쇄 물리 CSS(선택자 2개 개명) · `mascot.svg` 블록 · `josa` · `hl`(임시) · `compareLine/sim`(→ `@chickadee/grading` 의 정규식층) · T2 `layout/port` 수학 · `__audit` 4종 · 모든 텍스트 문구(길잡이·진단·토스트).
**다시 쓰는 것**: 문자열 템플릿 → JSX · `bind()` → 이벤트 prop · 모듈 전역 `S/T` → store 슬라이스 · `localStorage` → IPC · `location.href` → `ui.screen/session` · `setInterval` → `useSessionClock` · `data.js` → IPC 픽스처.

순서(각 단계가 끝나면 이전 단계의 스냅샷이 유지돼야 한다):
1. `tokens.css`·`reset.css`·`physics.css`·`fonts.css` + `DeeSprite` + Stylelint 룰 4개 + `check-contrast` — 빈 화면에 토큰만.
2. 프리미티브 12개 + Storybook 없이 `dev/Gallery.tsx`(`?screen=gallery`, DEV 전용)로 목업과 나란히 비교.
3. 홈(정적 픽스처) → WKWebView 성능 첫 실측.
4. 세션 셸(`SessionOverlay`·`JobBand`·`TimeQueue`·Esc·저장/복구) → T0 3종 + 사다리 + LIFER → 요약.
5. T1(`ClonePad` Monaco) → T2(`DependencyMap`).
6. 인제스트·첫 실행·설정·안내.

**토큰 단일 출처 잇기**: 지금은 `design/src/ink/build.py` 가 `ink-home.html` 에서 토큰 블록을 잘라 세션에 인라인한다. 앱에서는 방향을 뒤집는다 — `design/src/ink/tokens.css` 를 **새 단일 출처**로 만들고(README 의 미결 「홈을 빌드로 이전」과 같은 작업), `build.py` 는 그 파일을 두 목업에 인라인, 앱은 `scripts/sync-design.mjs` 가 `design/src/ink/{tokens.css,mascot.svg.html}` → `apps/desktop/src/{styles/tokens.css,assets/mascot.svg}` 로 복사하고 `tokens.css` → `src/styles/tokens.ts`(`{ light: {...}, dark: {...} }` hex 맵, Monaco 테마·정적 대비 테스트용)를 생성한다. M0 에서는 방향을 뒤집기 전이라 `sync-design.mjs` 가 `design/ink-home.html` 의 `:root`·`[data-theme="dark"]` 블록을 직접 뽑고, 그 위에 **선언된 `OVERRIDES` 표**를 얹는다 — D11 이 정했으나 아직 목업에 없는 네 가지(`--yellow-text #664300` · `--verdict-*` 신설 · 주간 `--glow-t*` `transparent` · `--dee-k/-blue/-blue-deep/-pink` 삭제)다(D52). 「목업 정리」가 끝나면 표는 비고 `design/src/ink/tokens.css` 가 단일 출처가 된다. CI 는 `sync-design --check` 로 디자인과 앱의 토큰이 바이트 단위로 같은지 검사해 **드리프트를 빌드 실패로** 만든다. 컴포넌트 CSS 는 앱이 원본이고 목업으로 되돌리지 않는다(목업은 이 시점부터 참조용 고정).

---

## 위험과 완화

| 위험 | 신호 | 완화 |
|---|---|---|
| WKWebView 에서 SVG `<use>`·블렌드로 홈이 12ms 를 넘긴다 | §10 첫 실측 | 스티커를 그림 한 장으로 굽기(D115) → 판번호 어긋남 끄기 → 결 `--grain-op:0` 순으로 강등, 예산은 유지. 윈도잉은 D133 이 걷었다 — 대지가 한 장만 DOM 에 있다 |
| Monaco 가 WKWebView 에서 IME(한국어 주석) 조합을 깨거나 마운트가 느리다 | 시나리오 7·9 webkit 실패 | `ClonePad` 인터페이스 뒤 textarea 구현으로 1단계만 폴백; 조합 중 판정 보류 |
| Esc 가 두 주인을 갖게 된다(모달 지옥) | 새 오버레이 추가 PR | `SessionOverlay` 밖 `keydown` Escape 핸들러 린트 금지(`no-restricted-syntax`) |
| 토큰 드리프트(디자인 ≠ 앱) | `sync-design --check` | CI 실패로 고정 |
| IME 상태에서 단축키 무반응 | 사용자 보고 | `e.code` 판정 + 시나리오 15 를 한국어 입력 소스로도 실행 |
| 폰트 8MB 가 설치본을 키운다 | 릴리스 크기 | 감당. 서브셋은 RFN 문제로 금지 — 대신 Poster 는 굵기 1개뿐 |
| 40+ 노드 홈에서 `stampdown` 지연 애니 48개가 첫 페인트를 늦춘다 | `home:paint` 마크 | 지연은 첫 12개까지만, 나머지는 즉시 |
| 저장 write-behind 중 크래시로 세션 진행 유실 | 재진입 시 pos 후퇴 | 5초 tick 저장 + 채점 직후 즉시 저장, 유실 최대 5초 |
| `dangerouslySetInnerHTML` 이 스프라이트 예외를 핑계로 퍼진다 | 린트 | 파일 1개 allowlist |

## 열린 질문 / 결정 요청

1. **`--yellow-text` 값** — `#6B4600` 은 `--paper-3` 위 6.82:1 로 AAA 미달(다른 종이 위는 7.45~8.25). `#664300`(paper-3 7.20 · paper 7.87 · 황 면 위 5.55) 으로 바꾸면 40쌍 정적 테스트가 전부 통과한다. 야간반 값은 그대로. → 디자인 결정 필요(정본 §6 토큰 표기 변경). → 결정: D11 — `#664300`.
2. **상시 애니메이션 3건** — 홈 오늘 스탬프 `blink` infinite · 현재 노드 절취선 `spin 9s` infinite · Dee `peek` infinite 는 §3.7 「상시 애니메이션 금지」와 충돌. 제안: `blink` 는 정적 점선 + 「오늘」 라벨, `spin` 은 정지 점선 링, `peek` 은 2회. 배터리 근거 §10. → 결정: D11 — 유한화 3건 그대로 채택.
3. **잠긴 노드 `shake`** — §3.7 「화면 흔들기」 금지의 범위에 요소 흔들기가 포함되는가. 제안: 흔들지 않고 상세에 이유만 연다. → 결정: D11 — 흔들지 않음.
4. **T1 3단계 Tab** — 요구 사항의 「Tab/자동 들여쓰기(3단계에서 제거)」를 「자동 들여쓰기만 제거, Tab = 2칸 유지」로 해석했다. Tab 까지 빼면 포커스가 에디터 밖으로 나가 필사가 끊긴다. → 결정: D11 — Tab 유지.
5. **아래층 키 `1~4` 소유** — 사다리 열림 + 포커스가 사다리 안일 때만 단 선택으로 해석했다. 「사다리가 열려 있으면 항상 단」 쪽이 단순하지만 미답 상태에서 보기를 고를 수 없게 된다. → 결정: D11 — 포커스가 사다리 안일 때만.
6. **최소 창** — D182 가 **720×600** 으로 내렸다(반쪽화면 요구). 세로는 스크롤이 답이고 세로 스크롤은 금지 목록에 없다. 옛 판단: Windows 노트북 1366×768 에서 작업표시줄 포함 시 680 이 빠듯하다. 640 으로 낮추면 판정란 예약이 화면 밖으로 밀리는 것을 허용해야 한다. → 결정: D11 — 1000×680.
7. **홈 `Enter` = 학습 시작** — 스크린리더 사용자는 `Enter` 를 요소 활성화로 기대한다. 포커스가 `main` 일 때만으로 제한했지만, 아예 빼고 「학습 시작」 버튼 초기 포커스로 대체하는 안도 있다. → 결정: D11 — `main` 포커스일 때만.
8. **정합/동등/어긋남 판정 색 별칭 `--verdict-*`** — 정본 §6 토큰 표에 없다. 컴포넌트가 `--pink/--blue` 를 직접 쓰는 것을 금지하려면 필요하다. → 결정: D11 — 신설.

## 구현 체크리스트

- [ ] 워크스페이스·Tauri 2 골격 — pnpm `apps/desktop` + `packages/*`, Vite, ESLint/Stylelint 기본, `tauri.conf.json` 창 설정·CSP 전제, `@chickadee/ipc-client` 껍데기 (선행: `01` 명령 목록) · 1~2일
- [ ] 토큰·리셋·인쇄 물리·폰트 동봉 — `sync-design.mjs`(복사·`tokens.ts` 생성·`--check`), `check-contrast.mjs`, Stylelint 커스텀 룰 4개(13px·별칭·블렌드 범위·dark allowlist), `fonts.css` + OFL 고지, `document.fonts.ready` 게이트 (선행: 위) · 2일
- [ ] 마스코트 `DeeSprite`·`Dee`·`useDeeMotion` — 심볼 3종+로고, `data-ly` 노드 동일성 테스트, 감축·타이핑 중 규칙, `?dev=1` 실루엣 검사 이식 (선행: 토큰) · 1일
- [ ] 프리미티브 12종 + `dev/Gallery` — Pill·Passes·Kbd·PressButton·FlatButton·Switch·Reg·Stamp·Say·Toast·LiveRegion·Misreg, 단위 테스트 (선행: 토큰) · 2일
- [ ] 홈 화면 — Masthead·RepoSwitcher·TodayPanel·TimeQueue·InkScale·ConceptList·GapsPanel·Sheet·Node·NodeDetail·Guide·Forecast·ColorBar, 픽스처 IPC, `home.load` (선행: 프리미티브, `02` 홈 쿼리 모양) · 3일
- [ ] WKWebView 성능 첫 실측 — `?stress=48` 이식, `__audit.perf`, `performance.mark` 6종, macOS Web Inspector 절차 문서화, 예산 대비 결과 기록 (선행: 홈) · 1일
- [ ] 세션 셸 — `SessionOverlay`(포커스 트랩·`inert`·Esc 3단계)·`JobBand`·`useSessionClock`·`session.save/resume`·키맵 디스패처(`e.code`) (선행: 프리미티브, `02` 세션 테이블) · 2~3일
- [ ] T0 판 — `ProofSheet`·`CodePlate`(hl·PickToken·Hole)·`Choices`·`FeedbackSlot`·`Acts`·`Crumb`, 채점은 `core.gradeT0` (선행: 세션 셸, `04` T0 규칙) · 2일
- [ ] 다시 찍기 사다리·아래층·LIFER — `ReprintLadder` 4단·점프/복귀/`LinkPara`·`B`·`LiferNote`·클립보드 플러그인 (선행: T0) · 2~3일
- [ ] 인쇄 완료 요약 — `Summary` 전부, 「오늘 판 다시 보기」= 읽기 전용 (선행: T0) · 1일
- [ ] T1 `ClonePad` Monaco — 지연 로드·옵션·테마 2종·거터 틱·줄 이탈 판정·`` ` `` 홀드·자동 저장·`remeasureFonts`·`Stepper`·`RefPlate`·`ScoreCard`·`DiffRows`·`WhyGate` (선행: 세션 셸, `04` T1 엔진) · 3일
- [ ] T2 `DependencyMap` — SVG 레이아웃·포트 분산·호버/포커스 강조·3티어 결과·커밋 출처, 13px 룰 맞춤 (선행: 세션 셸, `03` 그래프 모양) · 2일
- [ ] 인제스트·첫 실행·안내·설정 — 폴더 선택 다이얼로그, 진행 이벤트를 `TimeQueue` 로, 빈 상태 변형, newcomer 시트, 설정 화면 (선행: 홈, `01` 이벤트, `03` 판정) · 2일
- [ ] E2E 15 시나리오 + 시각 회귀 40장 + a11y 감사 자동화 — `mockIPC` 픽스처, webkit 프로젝트, 골든 갱신 규칙 (실 바이너리 E2E 는 06 Q15) (선행: 전 화면) · 3일
- [ ] 목업 정리 — `design/src/ink/tokens.css` 분리·홈을 `build.py` 로 이전, `.ladder` 개명, 그리고 앱과 어긋난 목업 동작 수정: `t0.js:146` 다시 찍기 판(`T.retry`)은 `lyTo = lyFrom`(문구 「원래 겹으로 돌아옴」) · `t0.js:268` 프롬프트 헤더 `c.file` → base name · `t2.js:140` `66` → `65` · `t1.js:180` `total` 비공백 줄 · `blink`/`spin`/`peek` 유한화 · 잠긴 노드 `shake` 제거 · `--yellow-text #664300` · `--verdict-*` 별칭 · Google Fonts `<link>` 는 목업 전용 주석 (선행: 결정) · 1일
