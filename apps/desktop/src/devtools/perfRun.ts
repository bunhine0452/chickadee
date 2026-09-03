/**
 * WKWebView 실측 하네스 (05 §10 · 01 §8). **개발용이고 기본으로 꺼져 있다** —
 * `VITE_PERF=1` 로 빌드했을 때만 이 파일의 내용이 돈다.
 *
 * 왜 필요한가: 릴리스 앱에는 DevTools 가 없고, Web Inspector 를 붙이는 것은 사람이 손으로
 * 하는 일이라 자동화 파이프라인에 들어가지 않는다(그래서 M1·M2 내내 이 수치가 비어 있었다).
 * 손잡이를 앱 안에 두고 결과를 `perf_sample` 에 적으면, 창을 한 번 띄우는 것만으로 숫자가 남는다.
 *
 * 재는 것과 재지 않는 것: 프레임 p95 는 **합성 부하**(스크롤 + hover 교대)이고 실제 사용이
 * 아니다. 그래도 재는 대상이 스타일 재계산과 합성 비용이라 목업이 재던 것과 같다.
 */
import { ipc, log, setSink } from '@chickadee/ipc-client';

import { BUDGET, FRAME_BUDGET_MS, collected, perf, type Mark } from './audit.js';

/** 프레임 쓸기 길이. 3초면 WKWebView 에서 150~180 프레임이 모인다. */
const SWEEP_MS = 3_000;
/** 홈이 실데이터로 그려질 때까지 기다리는 상한. */
const READY_TIMEOUT_MS = 60_000;
/** `perf_sample` 순환 (06 §8). */
const KEEP_ROWS = 500;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * 진행 표식. 릴리스 앱에는 콘솔이 없어서 **어디까지 갔는지**를 원장에 적어야 알 수 있다 —
 * 웹뷰가 도중에 죽으면 마지막 표식이 그 자리를 가리킨다.
 */
async function step(name: string, ms = 0): Promise<void> {
  try {
    await ipc.store.exec('perf.insert', { kind: `step:${name}`, ms, n: 0, at: Date.now() });
  } catch {
    // 표식을 못 남기는 상황이면 남길 곳도 이미 없다.
  }
}

/**
 * 로그를 원장으로 돌린다. 릴리스 앱에는 콘솔이 없어서, 인제스트가 조용히 실패하면
 * 그 이유가 화면의 토스트 한 줄로만 남고 밖에서는 볼 수 없다.
 */
function pipeLogsToDb(): void {
  let writing = false;
  setSink((level, message, fields) => {
    if (writing) return; // 표식을 쓰다 난 오류로 다시 들어오지 않게
    writing = true;
    const code = typeof fields['errorCode'] === 'string' ? fields['errorCode'] : '';
    const detail = typeof fields['message'] === 'string' ? ` ${fields['message']}` : '';
    void ipc.store
      .exec('perf.insert', {
        kind: `log:${level}:${message}${code === '' ? '' : ` (${code})`}${detail}`.slice(0, 400),
        ms: 0, n: 0, at: Date.now(),
      })
      .catch(() => undefined)
      .finally(() => { writing = false; });
  }, 'debug');
}

/** 홈이 실제로 놓였나 — 스티커가 하나라도 있어야 프레임 쓸기가 뜻이 있다. */
const homeReady = (): boolean => document.querySelectorAll('.node, .sheet').length > 0;

async function waitFor(ok: () => boolean, timeoutMs: number): Promise<boolean> {
  const until = performance.now() + timeoutMs;
  while (performance.now() < until) {
    if (ok()) return true;
    await sleep(250);
  }
  return ok();
}

/** 주간반 ↔ 야간반을 두 번 눌러 전환 비용을 두 표본 남긴다. */
async function toggleTheme(): Promise<void> {
  // 두 갈래 스위치는 **버튼 자신이** `.sw` 다 (05 §5 — 2개면 `role=switch`).
  const sw = document.querySelector<HTMLElement>('button.sw[aria-label*="야간반"]');
  if (!sw) {
    await step('theme-switch-missing');
    return;
  }
  sw.click();
  await sleep(400);
  sw.click();
  await sleep(400);
  await step('theme-toggled');
}

/**
 * 판 한 장을 실제로 걸고 채점한다 — `session:mount` 와 `t0:grade` 는 지나가야 찍힌다.
 * 여기서 카드가 처음 만들어지므로 **진짜 사전으로 생성기가 도는지**도 같이 확인된다.
 */
async function runOnePlate(): Promise<void> {
  const { startSession } = await import('../session-flow.js');
  const { useUi } = await import('../store.js');
  const repo = useUi.getState().repos[0];
  if (!repo) {
    await step('no-repo');
    return;
  }
  const opened = await startSession(repo.id, repo.rootPath);
  await step(opened ? 'session-open' : 'session-empty');
  if (!opened) return;

  // 교정지가 실제로 놓일 때까지 — `session:mount` 는 그때 닫힌다.
  await waitFor(() => document.querySelector('.ps') !== null, 10_000);
  await sleep(300);

  // **화면을 거쳐 답한다.** `answerPlate` 를 직접 부르면 LIFER 의식이 사는 자리(`SessionScreen`)를
  // 건너뛰어 `lifer:open` 이 영영 안 재진다. 정답을 고르는 이유도 같다 — 첫 성공이 없으면
  // 의식 자체가 안 뜬다.
  const plate = useUi.getState().plates[useUi.getState().pos];
  const answer = plate?.payload.track === 't0' ? plate.payload.answer : 0;
  const choice = document.querySelector<HTMLElement>(`.ch[data-k="${answer + 1}"]`)
    ?? document.querySelector<HTMLElement>(`.tk[data-k="${answer + 1}"]`);
  const submit = document.querySelector<HTMLElement>('.acts .press-btn');
  if (!choice || !submit) {
    await step('plate-controls-missing');
    return;
  }
  choice.click();
  await sleep(200);
  submit.click();
  // 의식이 놓일 시간을 준다 — `lifer:open` 은 베일이 마운트될 때 닫힌다.
  await sleep(1_500);
  await step(`plate-graded:${String(document.querySelector('.lifer-card') !== null)}`);
}

/** 한 줄에 담는 결과. `kind` 는 06 §8 이 정한 이름 공간을 그대로 쓴다. */
interface Row { kind: string; ms: number; n: number }

/**
 * 한 바퀴 돌고 결과를 원장에 적는다. 실패해도 앱을 멈추지 않는다 — 계측이 제품을
 * 방해하면 그 계측은 꺼진다.
 */
export async function runPerf(repoPath: string): Promise<void> {
  try {
    log.info('perf: 시작', { repoPath: repoPath.split('/').slice(-1)[0] ?? '' });
    pipeLogsToDb();
    await step('boot');

    // 홈에 실데이터가 없으면 이 리포를 등록하고 읽는다. 두 번째 실행부터는 그냥 지나간다.
    if (!homeReady()) {
      const { addRepo } = await import('../flow.js');
      const { useUi } = await import('../store.js');
      await step('flow-loaded');
      if (useUi.getState().repos.length === 0) {
        await addRepo(repoPath);
        await step('add-repo-returned');
      }
      const ready = await waitFor(homeReady, READY_TIMEOUT_MS);
      await step(ready ? 'home-ready' : 'home-timeout');
    }

    // 홈이 안정될 때까지 한 박자 — 인제스트 직후의 리렌더가 프레임에 섞이면 안 된다.
    await sleep(1_000);

    // **창이 앞에 있어야 한다.** 가려진 WKWebView 는 `requestAnimationFrame` 을 멈춰서
    // 쓸기가 한 프레임만 모으고 끝난다(실측: 0프레임).
    await ipc.win.show().catch(() => undefined);
    await sleep(500);
    await step(`visibility:${document.visibilityState}:focus=${String(document.hasFocus())}`);

    const frames = await perf(SWEEP_MS);
    await step('swept', frames.p95);

    // 전환 두 번 — `theme:switch` 는 **전환**의 값이라 마운트가 아니라 여기서 나온다.
    await toggleTheme();
    // 세션 한 판 — `session:mount`·`t0:grade`(첫 성공이면 `lifer:open`)가 여기서 찍힌다.
    await runOnePlate();
    const rows: Row[] = [{ kind: 'frame_p95', ms: frames.p95, n: frames.frames }];

    // `measure` 로 이미 찍힌 구간들 — 이번 실행에서 지나온 것만 담긴다.
    for (const [mark, sample] of Object.entries(collected()) as [Mark, ReturnType<typeof collected>[Mark]][]) {
      if (sample) rows.push({ kind: mark, ms: sample.p95, n: sample.frames });
    }

    const at = Date.now();
    await ipc.store.batch(rows.map((r) => ({
      name: 'perf.insert' as const,
      params: { kind: r.kind, ms: r.ms, n: r.n, at },
    })));
    await ipc.store.exec('perf.trim', { keep: KEEP_ROWS });

    for (const row of rows) {
      const budget = row.kind === 'frame_p95' ? FRAME_BUDGET_MS : BUDGET[row.kind as Mark];
      log.info('perf: 구간', {
        kind: row.kind,
        p95: Math.round(row.ms * 100) / 100,
        n: row.n,
        budget: budget ?? null,
        over: budget === undefined ? null : row.ms > budget,
      });
    }
    log.info('perf: 끝', { rows: rows.length, avgMs: Math.round(frames.avg * 100) / 100 });
  } catch (e) {
    log.error('perf: 실패', { message: e instanceof Error ? e.message : 'unknown' });
  }
}
