/**
 * E7 어둡게 — 설정에서 고르면 `data-theme=dark`, 저장되어 재실행 후에도 유지 (06 §1.5).
 *
 * 스위치는 **헤더에 없다** (D187 ⑫). 기본은 「시스템 따름」이고, 그것을 덮어쓰는 것은
 * 한 번 정하고 마는 일이라 설정 화면 몫이다 — 이 스펙이 그 자리를 못박는다.
 *
 * 「재실행」은 `reloadSession()` 이다 — 드라이버가 앱 프로세스를 죽이고 다시 띄운다.
 * 격리 트리는 그대로 두므로(스펙 파일 단위로만 지운다) DB 의 `settings` 가 살아 있다.
 */
import { strict as assert } from 'node:assert';

import { before, describe, it, shown, waitForBoot, wd } from '../helpers/driver.js';

const theme = (): Promise<string | null> =>
  wd().execute(() => document.documentElement.getAttribute('data-theme'));

/** 밝기는 라디오 셋이다 — 시스템 따름 · 밝게 · 어둡게 (D187 ⑫). 이름은 글자로만 붙는다. */
const darkRadio = async () => {
  for (const el of await wd().$$('main.settings [role="radio"]')) {
    if ((await el.getText()).trim() === '어둡게') return el;
  }
  throw new Error('설정에 「어둡게」 라디오가 없다');
};

/** 헤더의 「설정」. 마스트헤드의 셋째 링크다. */
const toSettings = async (): Promise<void> => {
  const links = await wd().$$('header.masthead .mh-link');
  for (const link of links) {
    if ((await link.getText()).trim() === '설정') {
      await link.click();
      return;
    }
  }
  throw new Error('마스트헤드에 「설정」이 없다');
};

describe('E7 어둡게', () => {
  before(async () => {
    await waitForBoot();
    await shown('.today');
  });

  it('헤더에는 밝기 스위치가 없다 (D187 ⑫)', async () => {
    const n = await wd().execute(
      () => document.querySelectorAll('header.masthead [role="switch"]').length,
    );
    assert.equal(n, 0, '헤더에 스위치가 남아 있다 — 밝기는 설정에서 고른다');
  });

  it('설정에서 「어둡게」를 고르면 `data-theme=dark` 가 된다', async () => {
    assert.notEqual(await theme(), 'dark', '시작부터 어둡게다 — 앞 스펙의 설정이 남았다');
    await toSettings();
    await shown('main.settings');
    await (await darkRadio()).click();
    await wd().waitUntil(async () => (await theme()) === 'dark', {
      timeout: 10_000, timeoutMsg: '어둡게를 골라도 data-theme 이 안 바뀐다',
    });
    assert.equal(await (await darkRadio()).getAttribute('aria-checked'), 'true');
  });

  it('재실행해도 어둡게가 유지된다 (settings 테이블, 별도 파일 없음 — 06 §3.1)', async () => {
    await wd().reloadSession();
    await waitForBoot();
    await shown('.today');
    assert.equal(await theme(), 'dark', '다시 띄우니 밝게로 돌아갔다 — 설정이 저장되지 않았다');
  });
});
