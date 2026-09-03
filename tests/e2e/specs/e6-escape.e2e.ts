/**
 * E6 Esc 복구 — 3번째 판에서 Esc → 홈 → 재진입 시 3번째 판부터, 입력 중 Esc 는 입력만
 * 빠져나감 (06 §1.5 · 02 §5.6).
 *
 * 「몇 번째 판인가」는 홈이 스스로 말한다 — 「이어 찍기 · N번째 판부터」(`TodayPanel`). 그래서
 * 이 시나리오는 스토어를 들여다보지 않고 **버튼 문구**로 판정한다.
 *
 * 큐 길이는 데이터가 정한다. 시드 큐가 3장보다 짧으면 목표를 마지막 판으로 낮춘다 — 판
 * 번호 3 은 시나리오의 뜻(「중간에서 나갔다 그 자리로 돌아온다」)이지 상수가 아니다.
 * 「입력 중 Esc 는 입력만」은 T1 필사 판(Monaco)이 있어야 하는데 시드에 없다(E5 머리 참고).
 */
import { strict as assert } from 'node:assert';

import { before, describe, it, pending, shown, waitForBoot, wd } from '../helpers/driver.js';

/** 한 판을 답하고 다음 판으로 넘긴다. 정답 여부는 보지 않는다(E5 머리 (1)). */
async function answerAndAdvance(): Promise<void> {
  await (await shown('.ps .ch[data-k="1"], .ps .tk[data-k="1"]')).click();
  await (await shown('.acts button.press-btn')).click();
  await shown('.fb.on');

  // 첫 성공이면 LIFER 의식이 덮는다 (D76). Esc 로 걷는다 — 걷히지 않으면 다음 클릭이 막힌다.
  if (await wd().$('.lifer-card').isExisting()) {
    await wd().keys(['Escape']);
    await wd().$('.lifer-card').waitForExist({ timeout: 10_000, reverse: true });
  }
  await (await shown('.acts button.press-btn')).click();
}

describe('E6 Esc 복구', () => {
  let target = 3;

  before(async () => {
    await waitForBoot();
    await shown('.today');
    const items = await (await shown('.today .qlist')).$$('li');
    target = Math.min(3, items.length);
    assert.ok(target >= 2, `큐가 ${items.length}장이라 「중간에서 나가기」를 만들 수 없다`);
  });

  it('3번째 판(큐가 짧으면 마지막 판)에서 Esc 로 나오면 홈이 그 자리에 있다', async () => {
    await (await shown('.today button.press-btn')).click();
    await shown('.ps');
    for (let i = 1; i < target; i += 1) await answerAndAdvance();

    await wd().keys(['Escape']);
    await wd().$('.proof').waitForDisplayed({
      timeout: 10_000, reverse: true, timeoutMsg: 'Esc 로 교정쇄가 안 닫혔다',
    });
    // 05 §2.3 — 세션은 오버레이라 홈은 다시 그려지지 않고 그 자리에 있다.
    assert.equal(await wd().$('.today').isDisplayed(), true, 'Esc 뒤 홈이 없다');
  });

  it('재진입하면 나갔던 판부터 이어 찍는다', async () => {
    const button = await shown('.today button.press-btn');
    const label = await button.getText();
    assert.ok(
      label.startsWith(`이어 찍기 · ${target}번째 판부터`),
      `이어 찍기 자리가 ${target}번째가 아니다: ${JSON.stringify(label)}`,
    );

    await button.click();
    await shown('.proof');
    await shown('.ps');
  });

  pending(
    '입력 중 Esc 는 입력만 빠져나간다',
    'T1 필사 판(Monaco)이 시드에 없다 — E5 머리 (2) 와 같은 이유',
  );
});
