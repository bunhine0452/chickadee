/**
 * E9 학습자 여정 — **막힘 0** 을 실제 창에서 (D186 ①).
 *
 * 브라우저 하네스가 같은 길을 걷지만(`tests/gates/journey.spec.ts`) 그것은 Chromium·WebKit
 * 이고 실물은 WebKitGTK 창이다. 창 크로뮴·포커스 정책·오버레이가 다르므로 **여기서 한 번 더**
 * 걷는다. 재는 것은 하나다: 학습자가 서는 자리마다 **다음 행동이 화면에 있는가**.
 *
 * 길: 홈 → 세션 첫 판 → Esc 로 나오기 → 코스 → 챕터 → 홈으로 → 설정 → 서가.
 * 앱은 「리포 하나가 등록된」 DB 위에서 뜬다 (`wdio.conf.ts` 의 `beforeSession`).
 *
 * **못 걷는 구간을 먼저 적는다.** 리포 등록은 네이티브 폴더 대화상자라 WebDriver 가 못
 * 만진다 — E2 가 그 사유를 적어 두고 비워 뒀고, 그래서 이 여정은 **등록 다음**에서 시작한다.
 * 코스 2~5단의 판은 `tiny` 시드가 못 굽는다(요청 줄기 0). 그 구간에서 이 스펙이 보는 것은
 * 「판이 없어도 다음 행동이 있는가」이고, 오버레이 안쪽은 브라우저 하네스가 본다.
 */
import { strict as assert } from 'node:assert';

import { before, describe, it, shown, waitForBoot, wd } from '../helpers/driver.js';

/** 지금 포커스가 앉은 요소의 태그·클래스. `body` 면 포커스를 잃은 것이다 (05 §9). */
const focusPath = (): Promise<string> =>
  wd().execute(() => {
    const el = document.activeElement;
    if (el === null) return '(null)';
    const cls = typeof el.className === 'string' && el.className !== ''
      ? `.${el.className.trim().split(/\s+/).join('.')}`
      : '';
    return `${el.tagName.toLowerCase()}${cls}`;
  });

/**
 * 이 화면에 다음 행동이 있나. 주 단추 하나 이상이거나, 「오늘 끝」 표식(`.today-off`)이다 —
 * 끝났다고 말하고 어디에 더 있는지 가리키는 화면은 막힌 것이 아니다 (정본 §3).
 */
async function nextStep(where: string): Promise<void> {
  const n = await wd().execute(
    () => document.querySelectorAll('button.press-btn:not([disabled]), .today-off').length,
  );
  assert.ok(n > 0, `${where} — 주 단추도 「끝났다」 표식도 없다 (막힘)`);
}

/** 마스트헤드의 링크 하나를 이름으로 누른다. */
async function nav(name: string): Promise<void> {
  for (const link of await wd().$$('header.masthead .mh-link')) {
    if ((await link.getText()).trim() === name) {
      await link.click();
      return;
    }
  }
  throw new Error(`마스트헤드에 「${name}」 이 없다`);
}

/** 「홈으로」 — 화면마다 같은 이름의 문이 있어야 한다. */
async function home(): Promise<void> {
  for (const btn of await wd().$$('button')) {
    if ((await btn.getText()).trim() === '홈으로') {
      await btn.click();
      await shown('.masthead');
      return;
    }
  }
  throw new Error('「홈으로」 가 없다 — 되돌아가지 않고는 못 나간다');
}

describe('E9 학습자 여정 — 막힘 0', () => {
  before(async () => {
    await waitForBoot();
    await shown('.today');
  });

  it('홈 — 다음 행동이 하나 서 있다', async () => {
    await nextStep('홈');
  });

  it('홈 → 첫 판은 클릭 한 번이고, 판에도 나가는 문이 있다', async () => {
    await (await shown('.today button.press-btn')).click();
    await shown('.proof');
    const sheet = await shown('.ps');
    assert.equal(await sheet.isDisplayed(), true, '교정지가 안 보인다');
    await nextStep('세션 첫 판');

    // 나가는 문 — 되돌아가지 않고 나갈 수 있다 (정본 §3-4 · Esc 하나). 작업 띠의 조작 칸에
    // 「나가기」가 서 있고, 같은 일을 Esc 가 한다.
    const ctl = await shown('.jb-ctl');
    assert.ok((await ctl.getText()).includes('나가기'), '작업 띠에 나가는 문이 없다');
  });

  it('Esc 하나로 세션에서 나오고 홈에 다음 행동이 남아 있다', async () => {
    await wd().keys(['Escape']);
    await shown('.masthead');
    const gone = await wd().execute(() => document.querySelectorAll('.proof').length);
    assert.equal(gone, 0, 'Esc 를 눌러도 학습 화면이 안 닫힌다');
    await nextStep('세션에서 나온 홈');
  });

  it('코스 — 들어가면 포커스가 화면 안이고 다음 행동이 있다', async () => {
    await nav('코스');
    await shown('main.cc');
    await shown('.cc-today');
    await nextStep('코스');

    const at = await focusPath();
    assert.notEqual(at, 'body', '코스에 들어가자마자 포커스가 body 다 — 키보드로 첫 걸음을 못 뗀다');

    // 「오늘 15분」은 비어 있어도 **왜** 비었는지를 말한다 (D186 ④).
    const today = await (await shown('.cc-today')).getText();
    assert.ok(today.trim().length > 0, '「오늘 15분」 칸이 비어 있다');
    await home();
  });

  it('설정 — 밝기는 여기에 있고 헤더에는 없다 (D187 ⑫)', async () => {
    const inHeader = await wd().execute(
      () => document.querySelectorAll('header.masthead [role="switch"]').length,
    );
    assert.equal(inHeader, 0, '헤더에 밝기 스위치가 남아 있다');

    await nav('설정');
    await shown('main.settings');
    assert.notEqual(await focusPath(), 'body', '설정에 들어가자마자 포커스가 body 다');

    let system = false;
    for (const el of await wd().$$('main.settings [role="radio"]')) {
      if ((await el.getText()).trim() === '시스템 따름') {
        system = (await el.getAttribute('aria-checked')) === 'true';
      }
    }
    assert.equal(system, true, '밝기의 기본이 「시스템 따름」이 아니다');
    await home();
  });

  it('서가 — 들어가면 포커스가 화면 안이고 나오는 문이 있다', async () => {
    await nav('서가');
    await shown('main.shelf');
    assert.notEqual(await focusPath(), 'body', '서가에 들어가자마자 포커스가 body 다');
    await home();
  });
});
