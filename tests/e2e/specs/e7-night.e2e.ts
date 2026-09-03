/**
 * E7 야간반 — 스위치 → `data-theme=dark` 저장·재실행 후 유지 (06 §1.5).
 *
 * 「재실행」은 `reloadSession()` 이다 — 드라이버가 앱 프로세스를 죽이고 다시 띄운다.
 * 격리 트리는 그대로 두므로(스펙 파일 단위로만 지운다) DB 의 `settings` 가 살아 있다.
 */
import { strict as assert } from 'node:assert';

import { before, describe, it, shown, waitForBoot, wd } from '../helpers/driver.js';

const SWITCH = 'header.masthead button.sw[role="switch"][aria-label="주간반 · 야간반 전환"]';
const theme = (): Promise<string | null> =>
  wd().execute(() => document.documentElement.getAttribute('data-theme'));

describe('E7 야간반', () => {
  before(async () => {
    await waitForBoot();
    await shown('.today');
  });

  it('스위치를 누르면 `data-theme=dark` 가 된다', async () => {
    assert.notEqual(await theme(), 'dark', '시작부터 야간반이다 — 앞 스펙의 설정이 남았다');
    await (await shown(SWITCH)).click();
    await wd().waitUntil(async () => (await theme()) === 'dark', {
      timeout: 10_000, timeoutMsg: '스위치를 눌러도 data-theme 이 안 바뀐다',
    });
    assert.equal(await (await shown(SWITCH)).getAttribute('aria-checked'), 'true');
  });

  it('재실행해도 야간반이 유지된다 (settings 테이블, 별도 파일 없음 — 06 §3.1)', async () => {
    await wd().reloadSession();
    await waitForBoot();
    await shown('.today');
    assert.equal(await theme(), 'dark', '다시 띄우니 주간반으로 돌아갔다 — 설정이 저장되지 않았다');
  });
});
