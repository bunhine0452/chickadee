/**
 * E4 홈 — 오늘 할 것 표시, 총 분 10~25, 「학습 시작」 활성 (06 §1.5).
 *
 * 앱은 「리포 하나가 등록된」 DB 위에서 뜬다(`wdio.conf.ts` 의 `beforeSession`). 그 DB 는
 * 손으로 넣은 행이 아니라 Rust 덤프에서 앱 코드가 파생한 시드다(D108).
 */
import { strict as assert } from 'node:assert';

import { before, describe, it, shown, waitForBoot } from '../helpers/driver.js';

describe('E4 홈', () => {
  before(async () => {
    await waitForBoot();
    await shown('.today');
  });

  it('오늘 할 것이 보인다', async () => {
    const list = await shown('.today .qlist');
    const items = await list.$$('li');
    assert.ok(items.length > 0, '오늘 낼 문제가 하나도 없다 — 시드가 큐를 못 만들었다');
  });

  /**
   * 하한 10 분은 여기서 재지 않는다 (D113). 첫날 DB 의 미리보기는 복습 0 + 새 문제
   * `newPerDay`(기본 2)개이고 새 문제 예상이 2분이라 **최대 4분**이다 — 재료를 아무리 넣어도
   * 10 분에 못 닿는다. 10~25 는 돌아가는 큐의 예산이고 스케줄러 property 가 그것을 잰다.
   */
  it('총 분이 상한 25 안이고 큐 길이와 맞는다 (02 §5.3 예산 · D113)', async () => {
    const line = await (await shown('.today .today-n')).getText();
    const found = /(\d+)\s*문제\s*·\s*약\s*(\d+)\s*분/.exec(line);
    assert.ok(found, `「N문제 · 약 M분」 모양이 아니다: ${JSON.stringify(line)}`);
    const plates = Number(found[1]);
    const mins = Number(found[2]);
    assert.ok(plates > 0, `문제가 0개다: ${line}`);
    assert.ok(mins > 0 && mins <= 25, `총 분이 상한 25 밖이다: ${mins}분`);

    const items = await (await shown('.today .qlist')).$$('li');
    assert.equal(items.length, plates, `줄은 ${plates}문제인데 목록은 ${items.length}개다`);
  });

  it('「학습 시작」이 눌린다', async () => {
    const start = await shown('.today button.press-btn');
    assert.equal(await start.isEnabled(), true, '「학습 시작」이 비활성이다');
    assert.ok(
      (await start.getText()).startsWith('학습 시작'),
      '첫 진입인데 「이어 풀기」로 떠 있다 — 앞 시나리오의 세션이 남았다',
    );
  });

  it('마스트헤드에서 설정으로 갈 수 있다 (E7·E8 의 입구)', async () => {
    const masthead = await shown('header.masthead');
    const buttons = await masthead.$$('button.flat-btn');
    // WebdriverIO v9 의 `ElementArray` 는 `map`·`filter` 를 **비동기 판**으로 덮어쓴다 —
    // 배열이 아니라 Promise 가 나오므로 `Promise.all` 에 넣으면 「object is not iterable」이다.
    const labels: string[] = [];
    for (const button of buttons) labels.push(await button.getText());
    assert.ok(labels.includes('설정'), `마스트헤드에 「설정」이 없다: ${labels.join(' · ')}`);
  });
});
