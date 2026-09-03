/**
 * E5 세션 전 흐름 — T0 정답·오답·모르겠어요 사다리 4단·아래층 점프·복귀 → T1 필사 채점 →
 * T2 배치 → 요약 (06 §1.5).
 *
 * **절반만 만들었다.** 창에서 실제로 확인되는 것은 교정쇄가 열리고 · 고르기와 제출이 판정을
 * 부르고 · 「모르겠어요」가 사다리를 편다는 것까지다. 나머지 둘은 사유가 다르다.
 *
 *   1) **정답과 오답을 갈라 누르지 못한다.** 정답 번호는 카드 payload 에 있고 그것은
 *      스토어 안이다 — WebDriver 가 닿는 것은 DOM 뿐이라 「몇 번이 정답인가」를 알 길이
 *      없다. 앱에 답을 내보내는 문을 내는 것은 제품에 테스트용 구멍을 내는 일이라 하지
 *      않았다. 대신 **판정이 실제로 났다**(피드백이 열렸다)는 것까지 확인한다. 정답/오답의
 *      가름은 `packages/grading` 의 골든과 `SessionScreen.test.tsx` 가 결정론적으로 잡는다.
 *   2) **T1·T2 판이 시드에 없다.** 시드는 `fixtures/ipc/tiny` 덤프 한 파일에서 파생한다 —
 *      T2 는 파일 하나로 지도를 못 그리고(D103 이 `two-commits` 에서 적은 것과 같은 이유),
 *      T1 은 04 §3.1 순위 ②(「모르는 문법 ≤ 3개」)가 갓 만든 숙련도에서 후보를 0 으로
 *      만든다. `perfRun.ts` 가 그 「며칠 뒤」를 억지로 만드는 코드를 들고 있으니(숙련도 2겹
 *      선기입 + `makeT1Card`), E5 를 끝까지 끌려면 그 절차를 시드 쪽에 옮기는 것이 길이다.
 */
import { strict as assert } from 'node:assert';

import { before, describe, it, pending, shown, waitForBoot, wd } from '../helpers/driver.js';

describe('E5 세션 전 흐름', () => {
  before(async () => {
    await waitForBoot();
    await shown('.today');
    await (await shown('.today button.press-btn')).click();
  });

  it('교정쇄가 열린다 (05 §2.3 — 라우트가 아니라 오버레이)', async () => {
    const proof = await shown('.proof');
    assert.equal(await proof.getAttribute('aria-modal'), 'true', '교정쇄가 모달이 아니다');
    await shown('.ps');
  });

  it('고르기 → 제출 → 판정이 난다', async () => {
    const choice = await shown('.ps .ch[data-k="1"], .ps .tk[data-k="1"]');
    await choice.click();

    const submit = await shown('.acts button.press-btn');
    assert.equal(await submit.isEnabled(), true, '고른 뒤에도 제출이 비활성이다');
    await submit.click();

    // 판정은 피드백 판이 열리는 것으로 보인다 (05 §5 `.fb`). 맞았는지 틀렸는지는
    // 위 머리의 (1) 때문에 여기서 가르지 않는다.
    const fb = await shown('.fb.on');
    const text = await fb.getText();
    assert.ok(text.trim().length > 0, '피드백이 열렸는데 문구가 비었다');
  });

  it('「모르겠어요」가 4단 사다리를 편다 (정본 §3-1)', async () => {
    const dunno = await shown('button.dunno');
    await dunno.click();
    const ladder = await shown('.reprint');
    const rungs = await ladder.$$('button, [role="button"]');
    assert.ok(rungs.length >= 4, `사다리 단이 ${rungs.length}개다 — 4단이어야 한다`);
    assert.ok(
      (await ladder.getText()).includes('모르겠어요 = 다시 찍기'),
      '사다리 제목이 다르다',
    );
  });

  it('Esc 로 사다리만 접힌다 (05 §5 — 세션은 안 닫힌다)', async () => {
    await wd().keys(['Escape']);
    const ladder = wd().$('.reprint');
    await ladder.waitForDisplayed({ timeout: 5_000, reverse: true, timeoutMsg: '사다리가 안 접혔다' });
    assert.equal(await wd().$('.proof').isDisplayed(), true, 'Esc 한 번에 세션까지 닫혔다');
  });

  pending(
    'T0 정답과 오답을 갈라 누르고 각각의 판정을 본다',
    '정답 번호가 DOM 에 없다 — 파일 머리 (1) 참고. 골든이 그 가름을 들고 있다',
  );
  pending(
    '사다리 4단 → 아래층 점프 → 자동 복귀',
    '아래층 판이 시드에 없다(개념 한 파일치) — 점프가 갈 곳이 없다',
  );
  pending(
    'T1 필사 채점 → T2 배치 → 요약',
    'T1·T2 판이 시드에 없다 — 파일 머리 (2) 참고',
  );
});
