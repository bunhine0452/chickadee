# 시각 회귀 기준선 — 만드는 자리와 갱신 규칙

06 §1.7 · 05 §11. **기준선은 Linux 것만 둔다.** OS 별로 3벌을 두면 유지비가 3배가 되고,
한 벌만 갱신한 PR 이 나머지 둘을 빨갛게 만든다.

| | |
|---|---|
| 장수 | 10장 × 주간/야간 × 엔진 2(`chromium`·`webkit`) = **40장** |
| 자리 | `tests/visual/__screenshots__/linux/{chromium,webkit}/*.png` |
| 임계 | `maxDiffPixelRatio 0.002` · `threshold 0.2` (`playwright.config.ts`) |
| 무엇을 찍나 | `shots.spec.ts` — 홈 · 홈(부속 숨김) · T0 미답 · 사다리 1·2·4단 · 정합 · 어긋남 · LIFER · 요약 |

## 이 리포에는 아직 기준선이 없다

**최초 생성은 CI 의 Linux 러너에서 해야 한다.** macOS·Windows 에서 만든 PNG 를 커밋하면
글리프 래스터와 서브픽셀이 달라 Linux CI 가 영원히 빨갛다 — 그 PNG 는 이 리포에 들어오면
안 된다.

절차:

1. `.github/workflows/ci.yml` 의 `design-gates` 잡을 켠다(06 §5.1). 브라우저는 **둘 다**
   깔아야 한다 — 주석에 남아 있는 `playwright install chromium` 은 `webkit` 프로젝트를
   못 돌린다(`pnpm exec playwright install --with-deps chromium webkit`).
2. 기준선이 없으므로 첫 실행의 `pnpm test:visual` 은 실패한다. 브랜치에서 한 번
   `pnpm exec playwright test tests/visual --update-snapshots` 를 돌리는 잡을 임시로 붙이거나,
   `ubuntu-22.04` 컨테이너(`mcr.microsoft.com/playwright:v<버전>-jammy`)에서 로컬로 돌려
   나온 40장을 커밋한다.
3. 커밋한 뒤 `pnpm test:visual` 이 **두 번 연속** 통과하는지 본다. 한 번만 보면 스크롤·전환이
   덜 멈춘 채 굳은 기준선을 못 잡는다.

macOS 에서 확인만 하고 싶으면 만들고 지워라 — 커밋하지 마라:

```
pnpm build
pnpm exec playwright test tests/visual --update-snapshots   # 생성
pnpm exec playwright test tests/visual                      # 자기 자신과 diff 0 인지
rm -rf tests/visual/__screenshots__                          # 반드시 지운다
```

## 갱신 규칙 (06 §1.7)

기준선은 **라벨 `visual-ok` 가 붙은 PR** 에서만 갱신한다. 갱신하는 사람은
`--update-snapshots` 로 다시 굽고, PR 본문에 **무엇이 왜 달라졌는지**를 적는다.
diff 이미지는 CI 아티팩트(`test-results/`)에 남는다. 라벨 없이 들어온 PNG 변경은
「기준선이 바뀐 것」이 아니라 「화면이 바뀐 것」이므로 되돌린다.

## 흔들리면 여기부터 본다

기준선이 흔들리는 원인은 지금까지 셋이었다. 셋 다 `shots.spec.ts` 가 막고 있으니,
새로 흔들리면 먼저 이 셋이 아닌지 확인해라.

- **스크롤** — `SessionOverlay.css` 의 `.bench` 는 `scroll-behavior: smooth` 다. 포커스가
  옮겨가며 부드럽게 움직이는 도중에 찍으면 전체 픽셀의 6~16%가 달라진다. `open()` 이
  부드러운 스크롤을 끄고, `shoot()` 이 **멈춘 뒤에** 자리를 산술로 세운 다음 다시 멈춤을
  확인하고 찍는다.
- **전환** — 테마를 바꾸면 `.sw span`·`.press-btn` 이 120ms 동안 색을 옮긴다. `settled()` 가
  `CSSTransition` 이 하나도 안 남을 때까지 기다린다.
- **실시각** — 날짜 · 연속 인쇄 · 남은 시간 · 걸린 시간은 `mask` 로 가린다. 마스크는
  z-순서를 모르므로 **화면별로 나눠** 든다(오버레이 위에 홈의 마스크를 얹으면 그 위가 지워진다).

흔들리지 않는 것은 이미 코드가 보장한다: 시각은 `tests/support/build-seed-const.ts` 의
`NOW` 로 굳어 있고, 노드 지터(`--dy/--rot/--d`)는 개념 id 해시로(05 §10), 도장 각도는
상수(`STAMP_ROTATE`)로 정해진다. 리포 어디에도 `Math.random` 이 없다(ESLint 가 막는다).

## 시드로 열리지 않는 화면

`fixtures/ipc/tiny` 로는 **T1·T2 판이 큐에 서지 않는다** — `block` 행이 없어
`cardMaker.forBlock()` 이, 커밋과 import 간선이 없어 `makeT2Card()` 가 각각 `null` 을 준다.
홈의 대지도 비어 있어 노드가 0개다. 그래서 이 40장에는 T1 필사·T2 구조·대지 위 노드가
없다. 그 화면들의 기준선은 더 큰 시드(06 §1.2 의 `projectox-like` 급)를 굽는 일과 같이
와야 한다 — 없는 것을 있는 것처럼 찍지 않았다.
