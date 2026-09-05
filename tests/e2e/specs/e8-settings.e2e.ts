/**
 * E8 설정 — API 키 저장(모의 키체인) → 화면이 바뀜, 삭제 → 되돌아옴, 「전부 지우기」 후
 * DB·로그 파일 부재 (06 §1.5). 그리고 **모의 키 grep 0**(06 §3.5).
 *
 * M5 의 「끝났다는 증거」 둘 중 나머지가 여기 있다(00 §5). 순서를 지킨다 — 「전부 지우기」는
 * 앱을 못 쓰는 상태로 만들기 때문에(`app_wipe` 가 DB 핸들을 놓는다) 반드시 마지막이다.
 *
 * **격리를 먼저 증명한다.** 앱이 스스로 말하는 `app_paths().dataDir` 이 우리가 보는 폴더와
 * 같은지 확인하고 나서야 「파일이 없다」에 뜻이 생긴다 — 아니면 남의 폴더를 보며 통과한다.
 * 같은 이유로 지우기 전에 **DB 가 있었다**는 것을 먼저 못박는다.
 */
import { strict as assert } from 'node:assert';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  DB_FILE, WIPED_ENTRIES, appDataDir, assertIsolated, grepAppData, listAppFiles, shortPath,
  waitForAppFile,
} from '../helpers/env.js';
import {
  before, describe, invoke, it, shown, waitForBoot, wd,
} from '../helpers/driver.js';

/** 모의 키 — 진짜처럼 생겼지만 어디에도 통하지 않는다. 이 문자열이 산출 파일에 있으면 실패다. */
const MOCK_KEY = 'sk-chickadee-e2e-MOCKKEY-0f1e2d3c4b5a69788796a5b4c3d2e1f0';
/** `data/maintenance.ts` 의 `LLM_ACCOUNT`. 화면과 「전부 지우기」가 같은 이름을 봐야 한다. */
const ACCOUNT = 'llm';
/** `with-keyring.sh` 가 Secret Service 왕복을 확인했을 때만 1 이다. */
const KEYRING = process.env['CHICKADEE_E2E_KEYRING'] === '1';

describe('E8 설정', () => {
  before(async () => {
    await waitForBoot();
    await shown('.today');
    const buttons = await (await shown('header.masthead')).$$('nav.mh-nav button.mh-link');
    for (const button of buttons) {
      if ((await button.getText()) === '설정') { await button.click(); break; }
    }
    await shown('main.l-page.settings');
  });

  it('앱이 격리된 데이터 폴더를 쓰고 있다', async () => {
    const paths = await invoke<{ dataDir: string }>('app_paths');
    assertIsolated(paths.dataDir);
    assert.ok(
      existsSync(join(appDataDir(), DB_FILE)),
      'DB 가 없다 — 앱이 이 폴더를 쓰고 있다는 증거가 없으면 뒤의 「파일 부재」는 뜻이 없다',
    );
  });

  it('「프라이버시 노트」 전문이 설정에 있다 (06 §3.6 — 문장을 고치지 않는다)', async () => {
    // `Section` 은 `id` 를 제목(h2)에 달고 섹션은 `aria-labelledby` 로 가리킨다.
    const body = await (await shown('section[aria-labelledby="set-privacy"]')).getText();
    assert.ok(
      body.includes('당신의 코드는 이 컴퓨터를 떠나지 않습니다'),
      '§3.6 의 첫 문장이 설정 화면에 없다',
    );
  });

  it(KEYRING
    ? '모의 키를 넣으면 키체인에 남고, 지우면 사라진다'
    : '키체인이 없는 컴퓨터에서는 저장이 실패하고, 앱이 「있다」고 말하지 않는다', async () => {
    if (KEYRING) {
      await invoke('secret_set', { account: ACCOUNT, value: MOCK_KEY });
      assert.equal(await invoke<boolean>('secret_has', { account: ACCOUNT }), true,
        '넣었는데 `secret_has` 가 false 다');
      await invoke('secret_delete', { account: ACCOUNT });
      assert.equal(await invoke<boolean>('secret_has', { account: ACCOUNT }), false,
        '지웠는데 `secret_has` 가 true 다');
      // 멱등이어야 한다 — 「전부 지우기」가 이것을 한 번 더 부른다.
      await invoke('secret_delete', { account: ACCOUNT });
      return;
    }

    // 06 §3.5: Secret Service 가 없으면 저장은 실패한다. 실패를 성공으로 삼키지 않는 것이
    // 여기서 확인할 값이다 — 삼키면 화면이 「저장됨」을 그리고 사용자는 키를 잃는다.
    await assert.rejects(
      () => invoke('secret_set', { account: ACCOUNT, value: MOCK_KEY }),
      (e: Error) => e.message.includes('secret_set 실패'),
      '키체인이 없는데 `secret_set` 이 성공했다',
    );
    assert.equal(await invoke<boolean>('secret_has', { account: ACCOUNT }), false,
      '저장이 실패했는데 `secret_has` 가 true 다');
  });

  // 06 §1.5 의 「API 키 저장 → 4단 「대화」 활성, 삭제 → 복귀」를 D106 이 **「키 존재가 화면을
  // 바꾸는 것」**으로 다시 읽었다(MVP 는 전송하지 않는다). 그래서 여기서 보는 것은 `KeyPanel`
  // 의 세 갈래 문구다.
  it(KEYRING
    ? '키를 넣으면 「LLM 키」 절이 바뀌고, 지우면 되돌아온다'
    : '키체인이 없으면 「LLM 키」 절이 「저장할 수 없습니다」를 낸다', async () => {
    const panel = await shown('.keypanel');

    if (!KEYRING) {
      await wd().waitUntil(async () => (await panel.getText()).includes('안전하게 저장할 수 없습니다'), {
        timeout: 20_000, timeoutMsg: 'Secret Service 가 없는데 「저장할 수 없습니다」가 안 뜬다',
      });
      assert.equal(await panel.$('.key-input').isExisting(), false,
        '저장할 수 없다면서 입력칸을 내주고 있다');
      return;
    }

    const input = await shown('.keypanel .key-input');
    await input.setValue(MOCK_KEY);
    for (const button of await panel.$$('button.flat-btn')) {
      if ((await button.getText()) === '저장') { await button.click(); break; }
    }
    await wd().waitUntil(async () => (await panel.getText()).includes('키체인에 저장돼 있습니다'), {
      timeout: 20_000, timeoutMsg: '저장했는데 화면이 「저장돼 있습니다」로 바뀌지 않는다',
    });
    assert.equal(await panel.$('.key-input').isExisting(), false,
      '저장한 뒤에도 입력칸이 남아 있다 — 값을 다시 보여 줄 자리가 생긴다');

    for (const button of await panel.$$('button.flat-btn')) {
      if ((await button.getText()) === '지우기') { await button.click(); break; }
    }
    await shown('.keypanel .key-input');
  });

  it('모의 키가 산출 파일 어디에도 없다 (06 §3.5 — 로그·크래시·내보내기·DB)', async () => {
    // 키가 앱을 한 번 지나간 뒤에 파일을 만든다 — 내보내기가 그 시점의 DB 를 통째로 훑는다.
    await invoke('secret_set', { account: ACCOUNT, value: MOCK_KEY }).catch(() => undefined);

    const buttons = await (await shown('section[aria-labelledby="set-data"]')).$$('button.flat-btn');
    for (const button of buttons) {
      if ((await button.getText()) === '내 기록 내보내기') { await button.click(); break; }
    }
    // 화면의 문구를 기다리지 않는다 — 내보내기 뒤 `app_reveal` 이 실패하면(xvfb 에는 파일
    // 관리자가 없다) 성공해 놓고도 「내보내지 못했습니다」가 뜬다. 디스크를 본다.
    await waitForAppFile((f) => f.startsWith('exports/'));

    const hits = grepAppData(MOCK_KEY);
    assert.deepEqual(
      hits.map(shortPath), [],
      `모의 키가 산출 파일에 실렸다: ${hits.map(shortPath).join(' · ')}`,
    );
  });

  it('「전부 지우기」 뒤 DB·로그 파일이 없다', async () => {
    const before_ = listAppFiles();
    assert.ok(
      before_.some((f) => f.endsWith(DB_FILE)),
      `지우기 전인데 DB 가 없다: ${before_.map(shortPath).join(' · ')}`,
    );

    const wipe = await shown('.set-wipe button.flat-btn');
    assert.equal(await wipe.getText(), '전부 지우기');
    await wipe.click();
    const confirm = await shown('.set-wipe .set-acts button.flat-btn');
    assert.equal(await confirm.getText(), '정말 전부 지웁니다');
    await confirm.click();
    // 화면의 문구를 기다리지 않는다 — 「전부 지웠습니다」는 `.vh#live` 낭독 지점에만 놓이고
    // 그 자리는 1px·`clip` 이라 WebDriver 의 「rendered text」에 안 들어온다. 지우기의 계약은
    // 파일이므로(06 §6.4) 디스크가 비는 것을 기다린다 — 바로 위 내보내기와 같은 이유다.
    await wd().waitUntil(async () => !listAppFiles().some((f) => f.endsWith(DB_FILE)), {
      timeout: 30_000,
      interval: 250,
      timeoutMsg: `「정말 전부 지웁니다」 뒤 30초가 지나도 ${DB_FILE} 이 그대로다`,
    });

    const left = listAppFiles().map(shortPath);
    for (const entry of WIPED_ENTRIES) {
      assert.ok(
        !left.some((f) => f === entry || f.startsWith(`${entry}/`)),
        `「전부 지우기」 뒤에도 ${entry} 가 남았다. 지금 남은 것: ${left.join(' · ') || '(없음)'}`,
      );
    }
    // **「하나도 없다」로 못박지 않는다.** 06 §3.1 의 표가 지우기의 계약이고 그것은 위 일곱
    // 칸이다. 같은 트리에 WebKit 이 자기 저장소를 둘 수 있고(그 자리는 플랫폼마다 다르다)
    // 그것을 여기서 실패로 부르면 게이트가 앱이 아니라 웹뷰 구현을 좇게 된다. 대신 남은
    // 것을 실패 메시지에 실어 사람이 판단할 재료를 남긴다.
  });

  it('지운 뒤 키체인 항목도 없다 (06 §6.4)', async () => {
    // 화면이 `wipeAll()` 안에서 `secret_delete` 를 부른다 — Rust 는 계정 이름을 모른다.
    // Secret Service 가 없는 러너에서는 `secret_has` 가 던진다. 「던졌다」는 「키가 있다」가
    // 아니므로 없는 것으로 읽되, 그 구분을 여기 적어 둔다.
    const has = await invoke<boolean>('secret_has', { account: ACCOUNT }).catch(() => false);
    assert.equal(has, false, '전부 지우기 뒤에도 키체인에 항목이 남았다');
  });
});
