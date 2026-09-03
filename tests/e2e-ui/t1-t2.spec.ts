/**
 * 05 §11 시나리오 7~10 — T1 필사와 T2 구조.
 *
 * **넷 다 시드로 열리지 않는다.** `fixtures/ipc/tiny` 의 덤프에는 `ts/optional-chaining`
 * 캡처 8개만 있고 `_blocks`·`_imports` 캡처가 없으며 커밋은 0개다. 그래서 `block` 0행 ·
 * `import_edge` 0행 · `git_commit` 0행이고, 홈도 그것을 그대로 말한다
 * (「T1 필사 … 아직 열립니다」 · 「이 리포로는 T2 를 짤 수 없습니다 — 지금 커밋은 0개입니다」).
 *
 * 억지로 열지 않는다. 판을 손으로 DB 에 넣어 통과시키면 재는 것이 「앱이 만든 판」이 아니라
 * 「테스트가 만든 판」이 되어, 05 §11 이 이 15건에 준 뜻(PR 차단·`retries:0`)이 사라진다.
 * 대신 **왜 못 여는지를 그 자리에서 확인**하고 건너뛴다 — 홈이 그 이유를 화면에 적고 있다.
 */
import { expect, openHome, test } from '../support/ui.js';

const T1_WHY =
  'T1 판을 걸 수 없다. `tiny` 덤프의 캡처는 `ts/optional-chaining` 8개뿐이고 `_blocks` 캡처가 '
  + '없어 `block` 테이블이 0행이다 — 필사할 블록 자체가 없다. 홈의 「아직 못 하는 것」도 '
  + '「T1 필사 … 이 리포의 문법을 조금 익힌 뒤에 열립니다」로 그것을 말한다.';

const T2_WHY =
  'T2 판을 걸 수 없다. `tiny` 는 커밋 0개(`git_commit` 0행)이고 `_imports` 캡처가 없어 '
  + '`import_edge` 도 0행이다 — 배치·반경·흐름·방향 네 종이 모두 커밋 또는 import 그래프를 '
  + '정답지로 쓴다 (04 §7~§8). 홈의 예고도 「이 리포로는 T2 를 짤 수 없습니다 … 커밋은 0개」다.';

/** 못 여는 이유가 **화면에** 적혀 있는지부터 본다 — 건너뛰기의 근거가 코드 주석이면 썩는다. */
test('T1·T2 를 못 여는 이유가 홈에 적혀 있다', async ({ page, app }) => {
  await openHome(page);

  await expect(page.locator('.locked-panel')).toContainText('T1 필사');
  await expect(page.locator('.locked-panel')).toContainText('열립니다');
  await expect(page.locator('.forecast')).toContainText('T2 를 짤 수 없습니다');
  await expect(page.locator('.forecast')).toContainText('커밋은 0개');

  const counts = app.db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM block) AS blocks,
              (SELECT COUNT(*) FROM git_commit) AS commits,
              (SELECT COUNT(*) FROM import_edge) AS edges`,
    )
    .get() as { blocks: number; commits: number; edges: number };
  expect(counts).toEqual({ blocks: 0, commits: 0, edges: 0 });
});

test('07 T1 예시 답안 채점', async ({ page, app }) => {
  test.skip(
    true,
    `${T1_WHY} 04 §9 골든 픽스처의 숫자(비공백 줄 기준 백분율·문턱)를 화면에서 확인하려면 `
    + '먼저 판이 걸려야 한다.',
  );
  void page;
  void app;
});

test('08 T1 이의 → 왜 게이트', async ({ page, app }) => {
  test.skip(true, `${T1_WHY} 채점 결과가 없으니 이의 줄도 「왜」 게이트도 뜨지 않는다.`);
  void page;
  void app;
});

test('09 `` ` `` 홀드 / 해제 / window blur', async ({ page, app }) => {
  test.skip(true, `${T1_WHY} 「원본 잠깐 보기」는 T1 편집 화면(ClonePad·PlainPad)에만 있다.`);
  void page;
  void app;
});

test('10 T2 힌트 3 → 채점 → 이것도 맞다', async ({ page, app }) => {
  test.skip(true, T2_WHY);
  void page;
  void app;
});
