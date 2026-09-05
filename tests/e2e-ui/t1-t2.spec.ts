/**
 * 05 §11 시나리오 7~10 — T1 필사와 T2 구조.
 *
 * **넷 다 시드로 열리지 않는다.** 이유는 둘로 갈린다 (D113 으로 시드가 두꺼워진 뒤):
 * T1 은 재료가 없어서가 아니라 **아직 이 리포의 문법을 익히지 않아** 잠겨 있고(`block` 18행 ·
 * 숙련도 0), T2 는 `tiny` 가 **커밋 0개**라 정답지가 없다. 홈도 그것을 그대로 말한다
 * (「T1 필사 … 이 리포의 문법을 조금 익힌 뒤에 열립니다」 · 「이 리포로는 T2 를 짤 수 없습니다
 * — 지금 커밋은 0개입니다」).
 *
 * 억지로 열지 않는다. 판을 손으로 DB 에 넣어 통과시키면 재는 것이 「앱이 만든 판」이 아니라
 * 「테스트가 만든 판」이 되어, 05 §11 이 이 15건에 준 뜻(PR 차단·`retries:0`)이 사라진다.
 * 대신 **왜 못 여는지를 그 자리에서 확인**하고 건너뛴다 — 홈이 그 이유를 화면에 적고 있다.
 */
import { expect, openHome, test } from '../support/ui.js';

const T1_WHY =
  'T1 판을 걸 수 없다. 필사할 블록은 있지만(`block` 18행) 이 리포의 개념 숙련도가 0이라 '
  + '첫날 큐는 새 판(T0)뿐이다 — 홈의 「아직 못 하는 것」도 「T1 필사 … 이 리포의 문법을 '
  + '조금 익힌 뒤에 열립니다」로 그것을 말한다.';

const T2_WHY =
  'T2 판을 걸 수 없다. `tiny` 는 커밋 0개(`git_commit` 0행)다 — 배치·반경·흐름·방향 네 종의 '
  + '정답지가 커밋에서 나온다 (04 §7~§8). 홈의 예고도 「이 리포로는 T2 를 짤 수 없습니다 … '
  + '커밋은 0개」다.';

/** 못 여는 이유가 **화면에** 적혀 있는지부터 본다 — 건너뛰기의 근거가 코드 주석이면 썩는다. */
test('T1·T2 를 못 여는 이유가 홈에 적혀 있다', async ({ page, app }) => {
  await openHome(page);

  // D182 가 홈을 다시 짜면서 「아직 못 하는 것」 둘이 「아직 안 배운 문법」 아래 한 자리로
  // 모였다 — T1 필사(D96)와 책임 배치(D170 ⑤). 판 두 장이 하던 일을 두 문단이 한다.
  await expect(page.locator('.gaps-locked').first()).toContainText('T1 필사');
  await expect(page.locator('.gaps-locked').first()).toContainText('열립니다');
  await expect(page.locator('.forecast')).toContainText('책임 배치 문제');
  await expect(page.locator('.forecast')).toContainText('커밋은 0개');

  const counts = app.db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM block) AS blocks,
              (SELECT COUNT(*) FROM git_commit) AS commits,
              (SELECT COUNT(*) FROM import_edge) AS edges`,
    )
    .get() as { blocks: number; commits: number; edges: number };
  // T1 이 잠긴 이유가 **재료 부족이 아니라 숙련도**임을 못박는다 — 시드에 블록·간선은 있다(D113).
  expect(counts.blocks).toBeGreaterThan(0);
  expect(counts.edges).toBeGreaterThan(0);
  // T2 네 종의 정답지는 커밋이다 (04 §7~§8). 0 인 것이 화면의 「커밋은 0개」와 같은 사실이다.
  expect(counts.commits).toBe(0);
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
