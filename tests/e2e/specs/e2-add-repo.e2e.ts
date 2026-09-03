/**
 * E2 리포 등록 — 폴더 선택 → 경로가 sqlite `repo` 에 저장, `.git` 없는 폴더는 친절한 거부
 * (06 §1.5).
 *
 * **못 만들었다.** 등록으로 가는 유일한 문이 `plugin-dialog` 의 **네이티브 폴더 대화상자**다
 * (`App.tsx` 의 `pickFolder`). GTK 파일 선택기는 WebView 밖의 창이라 WebDriver 가 만지지
 * 못한다 — `browser.$` 가 닿는 것은 웹뷰 DOM 뿐이다.
 *
 * 열 수 있는 길 셋과 값:
 *   ① 앱에 테스트 전용 인자(`--repo <path>`)를 둔다 — Rust 줄이 늘고(D68 예산 0) 제품에
 *      테스트용 문이 생긴다.
 *   ② `xdotool` 로 GTK 대화상자를 두들긴다 — 06 §1.1 이 「OS별 타이밍 플레이키로 무너진다」고
 *      적어 둔 바로 그 종류다.
 *   ③ 대화상자를 열지 않고 `addRepo(path)` 를 부를 수 있게 화면에 문을 낸다 — 제품 표면이 는다.
 * 셋 다 비용이 통과 하나보다 크다고 보고 **비워 둔다**. 등록·거부의 결정론적 확인은
 * `packages/concepts` 의 `repos.test.ts` 와 통합 파이프라인(06 §1.4)이 이미 들고 있다.
 */
import { describe, pending } from '../helpers/driver.js';

describe('E2 리포 등록', () => {
  pending(
    '폴더 선택 → 경로가 sqlite `repo` 에 저장된다',
    '네이티브 GTK 폴더 대화상자는 WebView 밖이라 WebDriver 가 못 만진다 (파일 머리의 ①~③ 참고)',
  );
  pending(
    '`.git` 없는 폴더는 친절한 거부',
    '같은 이유 — 거부 문구는 `repos.test.ts` 의 `GIT_NOT_REPO` 케이스가 잡고 있다',
  );
});
