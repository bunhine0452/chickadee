/**
 * 05 §11 시나리오 11~14 — 요약 · 모양 스위치 · Esc 4단계 · 리포 등록과 인제스트.
 *
 * 이 넷은 교정지 한 장이 아니라 **셸**을 잰다: 세션이 닫힐 때 무엇이 남는가, 테마와 부속이
 * 조판을 건드리지 않는가, Esc 가 한 번에 한 겹만 벗기는가, 리포를 처음 등록하면 무엇이 도는가.
 */
import type { Database } from 'better-sqlite3';

import {
  emitIpcEvent, expect, focusPath, focusWithin, openApp, openHome, queueSpeech, stubCommands,
  test, wipeRepos,
} from '../support/ui.js';

const SHEET = '.proof article.ps';
const DONE = '[aria-label="인쇄 완료"]';

function answerKey(db: Database): number {
  const row = db.prepare('SELECT payload_json FROM card ORDER BY id DESC LIMIT 1').get() as
    | { payload_json: string }
    | undefined;
  if (row === undefined) throw new Error('카드가 없다 — 세션이 열리지 않았다');
  return (JSON.parse(row.payload_json) as { answer: number }).answer + 1;
}

test('11 요약', async ({ page, app }) => {
  await openHome(page);
  await page.getByRole('button', { name: /인쇄 시작/ }).click();
  await page.locator(SHEET).waitFor();
  await page.locator(`.ch[data-k="${answerKey(app.db)}"]`).click();
  await page.locator('.acts .press-btn').click();

  // LIFER 는 첫 정합의 연출이다 — 닫고 나서야 다음 판으로 간다.
  await page.locator('.lifer-veil').waitFor();
  await page.keyboard.press('KeyG');
  await page.keyboard.press('Space');
  await page.locator(DONE).waitFor();

  // 겹 이동 목록 — %가 아니라 겹으로 센다.
  const shift = page.locator(`${DONE} .shifts .shift`);
  await expect(shift).toHaveCount(1);
  await expect(shift.first()).toContainText('옵셔널 체이닝');
  await expect(shift.first().locator('small')).toContainText('미인쇄 → 애벌 · +1겹');
  await expect(shift.first().locator('.next')).toContainText('다음 인쇄');

  // LIFER 박스 · 내일 예고.
  await expect(page.locator(`${DONE} .lifer-box`)).toContainText('처음 기록한 문법');
  await expect(page.locator(`${DONE} .lifer-box`)).toContainText('repo.ts:50');
  await expect(page.locator(`${DONE} .hintbox`)).toContainText('내일은');

  // 요약이 뜨면 포커스는 「홈으로」다 (05 §7).
  expect(await focusPath(page)).toContain('press-btn');
  await expect(page.locator(`${DONE} .acts .press-btn`)).toContainText('홈으로');

  // Enter 로 홈. 세션이 닫히면 홈이 오늘의 인쇄를 다시 읽는다 — 큐가 비었으니 단추가 잠긴다.
  await page.keyboard.press('Enter');
  await page.locator('.masthead').waitFor();
  await expect(page.locator('.proof')).toHaveCount(0);
  await expect(page.locator('.today-empty')).toBeVisible();
  await expect(page.locator('.today .press-btn')).toBeDisabled();
});

test('12 야간반 + 부속 숨김', async ({ page }) => {
  // `?dev=1` 이라야 `__audit` 이 붙는다 (05 §10) — 대비 전수는 그 손잡이로 잰다.
  await openHome(page, '?dev=1');

  /** 텍스트 박스의 좌표. 테마와 부속은 1px 도 옮기면 안 된다 (05 §4.3). */
  const boxes = (): Promise<string[]> =>
    page.evaluate(() =>
      [...document.querySelectorAll('.press p, .press h1, .press h2, .press h3, .press li, .press .tk-v')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(',');
        }));

  const contrast = (): Promise<{ checked: number; below7: string[] }> =>
    page.evaluate(() => {
      const report = (window as unknown as {
        __audit: { contrast: () => { checked: number; paper: { below7: { sel: string; ratio: number }[] } } };
      }).__audit.contrast();
      return {
        checked: report.checked,
        below7: report.paper.below7.map((r) => `${r.sel} ${r.ratio}`),
      };
    });

  const day = await boxes();
  expect(day.length).toBeGreaterThan(5);
  const dayContrast = await contrast();
  expect(dayContrast.checked).toBeGreaterThan(20);
  // 스위치의 색 전환은 120ms 다 (`Switch.css`) — 굳을 때까지 다시 잰다. 고정 대기가 아니라
  // 폴링이라, 정말로 7:1 아래인 자리는 제한 시간 뒤에 그대로 드러난다 (06 §1.9-2).
  await expect.poll(async () => (await contrast()).below7, { timeout: 5_000 }).toEqual([]);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // 야간반으로.
  await page.getByRole('switch', { name: '주간반 · 야간반 전환' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await boxes()).toEqual(day);

  // 부속을 보였다 숨겼다 한다 — 어느 쪽에서 시작하든 조판은 1px 도 안 움직인다.
  // 기본값(`DEFAULTS.trim`)은 설정 화면 쪽에서 바뀔 수 있으니 지금 값에서 출발한다.
  const trim = page.getByRole('switch', { name: '인쇄 부속 보이기 · 숨기기' });
  const first = await page.locator('html').getAttribute('data-trim');
  await trim.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-trim', first ?? '');
  expect(await boxes()).toEqual(day);
  await trim.click();
  await expect(page.locator('html')).toHaveAttribute('data-trim', first ?? '');
  expect(await boxes()).toEqual(day);

  // 표가 말한 자리 — 야간반 + 부속 숨김에서 끝난다.
  if ((await page.locator('html').getAttribute('data-trim')) !== 'on') await trim.click();
  await expect(page.locator('html')).toHaveAttribute('data-trim', 'on');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await boxes()).toEqual(day);

  // 야간반에서도 종이 위 텍스트는 7:1 이다 (05 §9 · 정본 §6).
  await expect.poll(async () => (await contrast()).below7, { timeout: 5_000 }).toEqual([]);
  expect((await contrast()).checked).toBe(dayContrast.checked);
});

test('13 Esc 4단계', async ({ page, app }) => {
  void app;
  await openHome(page);
  await page.getByRole('button', { name: /인쇄 시작/ }).click();
  await page.locator(SHEET).waitFor();
  await page.locator('.acts .dunno').click();
  await page.locator('.reprint').waitFor();
  await page.locator('.rung[data-r="4"]').click();
  await page.locator('.askbox textarea').focus();
  await page.keyboard.type('여기서 막혔습니다');

  // ① 입력 중 Esc — 입력에서만 빠져나온다. 사다리도 세션도 그대로다.
  await page.keyboard.press('Escape');
  await expect(page.locator('.askbox textarea')).not.toBeFocused();
  await expect(page.locator('.reprint')).toHaveCount(1);
  await expect(page.locator('.proof')).toHaveCount(1);
  await expect(page.locator('.askbox textarea')).toHaveValue('여기서 막혔습니다');

  // ② 사다리 접기. **포커스가 사다리 안일 때만** 이 겹이 벗겨진다 (05 §2.3 ③) —
  //    ① 의 `blur()` 가 포커스를 `<body>` 로 떨어뜨리므로 여기서 다시 사다리로 넣어 준다.
  //    그 자리 이동이 필요하다는 것 자체가 결함이다(보고 참조).
  await page.locator('.rung[data-r="4"]').focus();
  expect(await focusWithin(page, '.reprint')).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.reprint')).toHaveCount(0);
  await expect(page.locator('.proof')).toHaveCount(1);
  // 접으면 포커스는 「모르겠어요」로 돌아온다.
  expect(await focusPath(page)).toContain('dunno');

  // ③ 나가기 — 확인 모달 없음 (정본 §3-4).
  await page.keyboard.press('Escape');
  await page.locator('.masthead').waitFor();
  await expect(page.locator('.proof')).toHaveCount(0);

  // ④ 홈은 「이어 찍기」로 바뀌어 있다. 진행은 저장됐다.
  const resume = page.locator('.today .press-btn');
  await expect(resume).toContainText('이어 찍기 · 1번째 판부터');

  // 재진입하면 같은 판이 다시 걸린다.
  await resume.click();
  await page.locator(SHEET).waitFor();
  await expect(page.locator(SHEET)).toHaveAttribute('aria-label', /1판 · 옵셔널 체이닝/);
  await expect(page.locator('.jq-h')).toContainText('지금 1 / 1');
});

test('14 리포 등록 → 인제스트 진행 → 홈', async ({ page, app }) => {
  // 빈 상태에서 시작한다 — 리포가 0개면 첫 실행 화면이다 (05 §2.1 `first-run`).
  wipeRepos(app.db);

  // 하네스에 없는 셋(+ 폴더 고르기)을 테스트가 답한다. 진행은 이벤트로 직접 흘린다.
  await stubCommands(page, {
    'plugin:dialog|open': '/w/fresh',
    repo_probe: { rootPath: '/w/fresh', fingerprint: 'ff', headCommit: 'deadbeef' },
    ingest_start: { jobId: 'job-1' },
    ingest_cancel: null,
    ingest_status: { jobId: 'job-1', phase: 'walk', done: 0, total: 0, elapsedMs: 0 },
  });

  await openApp(page);
  await expect(page.locator('.firstrun')).toBeVisible();
  await expect(page.locator('.firstrun')).toContainText('리포에는 아무것도 쓰지 않습니다');

  await page.getByRole('button', { name: '리포 등록' }).click();
  await page.locator('.ingest').waitFor();
  await expect(page.locator('.ingest-h')).toHaveText('fresh 을 읽는 중');
  // 스피너가 아니라 시간 비례 큐 4칸이다 (D47 · 정본 §3-5).
  const queue = page.locator('.ingest .queue');
  expect((await queueSpeech(queue)).cells).toBe(4);

  /**
   * 단계 큐는 뒤로 가지 않는다 — 칸도, 채움도.
   *
   * 단계는 **`jobs.rs` 가 실제로 내보내는 순서**로 흘린다: `walk → parse → git → write`.
   * 앞서는 `phases.ts` 가 `walk` 와 `git` 을 한 칸에 묶어 이 순서에서 막대가
   * 1 → 2 → **1** → 3 으로 되돌았다 — D110 이 묶음을 순서에 맞췄고, 이 테스트가
   * 그것을 고정한다. `git` 이 `total = 0` 으로 오는 것도 그대로 재현한다.
   */
  const steps = [
    ['walk', 4, 10, 1],
    ['walk', 10, 10, 1],
    ['parse', 6, 10, 1],
    ['parse', 10, 10, 1],
    ['git', 12, 0, 2],
    ['write', 8, 8, 2],
  ] as const;
  const seen: number[] = [(await queueSpeech(queue)).share];
  for (const [phase, done, total, cell] of steps) {
    await emitIpcEvent(page, 'ingest_progress', {
      jobId: 'job-1', phase, done, total, currentRelPath: `src/${phase}.ts`, elapsedMs: 1,
    });
    await expect.poll(async () => (await queueSpeech(queue)).at).toBe(cell);
    const share = (await queueSpeech(queue)).share;
    expect(share, `${phase} 에서 막대가 뒤로 갔다`).toBeGreaterThanOrEqual(seen.at(-1) as number);
    seen.push(share);
  }
  expect(seen.at(-1)).toBeGreaterThan(seen[0] as number);
  // 칸마다 무엇을 하는 중인지가 곁에 적힌다.
  await expect(page.locator('.ingest-now')).toHaveText('커밋과 캡처 저장');
  // 「지금 읽는 파일」(`.ingest-path`)은 뜨지 않는다 — `currentRelPath` 가 `onProgress` 를
  // 건너오지 못한다(보고 참조). 여기서 그 자리를 단언하면 결함을 굳히게 되므로 재지 않는다.

  await emitIpcEvent(page, 'ingest_warning', { jobId: 'job-1', relPath: 'huge.ts', reason: 'oversize' });
  await expect(page.locator('.ingest-skips')).toContainText('건너뛴 파일 1개');
  await expect(page.locator('.ingest-skips li')).toContainText('너무 커서 건너뜀');

  // 취소 — 누르면 그 자리에서 잠긴다. 읽은 부분은 남는다.
  const cancel = page.getByRole('button', { name: '그만 읽기' });
  await expect(cancel).toBeEnabled();
  await cancel.click();
  const stopping = page.getByRole('button', { name: '멈추는 중…' });
  await expect(stopping).toBeVisible();
  await expect(stopping).toBeDisabled();

  // 끝나면 홈이다 (05 §2.1). 판이 하나도 안 나오면 홈이 그 빈 상태를 변형으로 말한다.
  await emitIpcEvent(page, 'ingest_done', {
    jobId: 'job-1', files: 0, changed: 0, deleted: 0, captures: 0, commits: 0,
    escalatedToFull: false, elapsedMs: 5, peakRssMb: 1, cancelled: true, warnings: 1,
  });
  await page.locator('.masthead').waitFor();
  await expect(page.locator('.masthead')).toContainText('fresh');
  await expect(page.locator('.sheets')).toContainText('아직 대지가 없습니다');
  await expect(page.locator('.forecast .fc-mark')).toHaveText('불가');
  await expect(page.locator('.today-empty')).toBeVisible();

  // 원장에도 리포 한 줄이 남았다 — 화면 밖 사실이다.
  const repos = app.db.prepare('SELECT root_path, name FROM repo').all() as
    { root_path: string; name: string }[];
  expect(repos).toEqual([{ root_path: '/w/fresh', name: 'fresh' }]);
});
