import { ipc } from '@chickadee/ipc-client';
import type { ConceptId, RepoInfo } from '@chickadee/store-sql';
import { Toast } from '@chickadee/ui';
import { useEffect, useState } from 'react';

import type { TodayPreview } from './components/home/TodayPanel.js';
import { makePlateFor, pickPlateNow, type ManualResult } from './data/manual.js';
import { previewToday } from './data/session.js';
import { addRepo, ingest, refreshHome, report, todayKey } from './flow.js';
import { HomeScreen } from './screens/home/HomeScreen.js';
import { conceptLabel, type HomeData } from './screens/home/data.js';
import { FirstRun } from './screens/home/empty.js';
import { IngestScreen } from './screens/ingest/IngestScreen.js';
import { SessionScreen } from './screens/session/SessionScreen.js';
import { startSession } from './session-flow.js';
import { activeRepo, useUi } from './store.js';

/**
 * 화면 하나를 고르는 곳 (05 §2.2 — 라우터 없음, 상태가 곧 라우팅).
 *
 * 세션은 라우트가 아니라 **오버레이**다. 홈은 그대로 살아 있고 그 위에 교정쇄가 덮인다 —
 * 그래서 Esc 로 나오면 홈이 다시 그려지지 않고 그 자리에 있다 (05 §2.3).
 */
export function App(): React.JSX.Element {
  const ui = useUi();
  const repo = activeRepo(ui);
  const inSession = ui.session !== null;
  const [today, setToday] = useState<TodayPreview | null>(null);

  // 리포를 바꾸면 홈을 다시 읽는다. 화면 상태는 파생 캐시라 언제든 버릴 수 있다 (01 §5).
  useEffect(() => {
    if (ui.screen === 'home' && ui.home === null && ui.activeId !== null) void refreshHome();
  }, [ui.screen, ui.home, ui.activeId]);

  // 세션이 닫히면 오늘의 인쇄를 다시 읽는다 — 부분 갱신보다 통째로 다시 읽는 편이 싸다 (05 §3).
  useEffect(() => {
    if (ui.activeId === null || inSession) return;
    void (async () => {
      try {
        const preview = await previewToday(ui.activeId as number, Date.now());
        setToday({ ...preview, streak: 0, days: ui.home?.days ?? [] });
      } catch (e) {
        report(e, '오늘의 인쇄');
      }
    })();
  }, [ui.activeId, inSession, ui.home]);

  if (ui.screen === 'ingest' && repo) {
    return (
      <>
        <IngestScreen
          repoName={repo.name}
          at={ui.at}
          currentPath={ui.currentPath}
          warnings={ui.warnings}
          done={ui.ingestDone}
          cancelling={ui.cancelling}
          error={ui.error}
          onCancel={() => useUi.getState().cancel()}
          onDone={() => useUi.getState().go('home')}
        />
        <Toast msg={ui.toast ?? ''} on={ui.toast !== undefined} />
      </>
    );
  }

  if (repo === null || ui.repos.length === 0) {
    return (
      <>
        <FirstRun onPick={() => void pickFolder()} />
        <Toast msg={ui.toast ?? ''} on={ui.toast !== undefined} />
      </>
    );
  }

  if (ui.home === null) {
    // 홈 데이터가 아직 없는 한 프레임. 스피너를 두지 않는다 (정본 §3-7).
    return <main className="shell" tabIndex={-1} aria-busy="true" />;
  }
  // 콜백 안에서 좁혀진 타입이 유지되도록 지역 const 로 받는다 (`ui.home` 은 속성 접근이다).
  const home = ui.home;

  return (
    <>
      {/* 세션 중에는 홈이 보조 기술에 잡히지 않는다 — 오버레이가 유일한 문맥이다 (05 §5). */}
      <div inert={inSession ? true : undefined}>
        <HomeScreen
          data={home}
          repoName={repo.name}
          today={todayKey()}
          streak={0}
          {...(today ? { today_: today } : {})}
          onStart={() => void start(repo.id, repo.rootPath)}
          onMake={(conceptId) => void place('gap', repo, home, conceptId)}
          onPick={(conceptId) => void place('manual', repo, home, conceptId)}
        />
      </div>
      {inSession ? <SessionScreen repoId={repo.id} repoName={repo.name} /> : null}
      <Toast msg={ui.toast ?? ''} on={ui.toast !== undefined} />
    </>
  );
}

/** 「인쇄 시작」. 큐가 비면 세션을 열지 않고 그 이유를 말한다 (02 §5.3). */
async function start(repoId: number, rootPath: string): Promise<void> {
  const opened = await startSession(repoId, rootPath);
  if (!opened) {
    useUi.getState().say('오늘은 인쇄할 판이 없습니다 — 리포를 더 파거나 내일 다시 오세요.');
  }
}

/**
 * 홈의 「이 판 찍기」(`manual`) · 「판 만들기」(`gap`) (02 §5.5 · D88).
 *
 * 결과를 **어디에 무엇이 들어갔는지**로 말한다 — 「완료」 한 마디로는 큐를 확인하러
 * 세션을 열어 봐야 한다. 교정쇄가 열렸으면 그 판이 이미 화면에 있으니 말하지 않는다.
 */
async function place(
  role: 'manual' | 'gap',
  repo: RepoInfo,
  home: HomeData,
  conceptId: string,
): Promise<void> {
  const label = conceptLabel(home, conceptId);
  const req = {
    repoId: repo.id,
    rootPath: repo.rootPath,
    conceptId: conceptId as ConceptId,
    // 첫 노출 사용처는 `card.sites_for_concept` 의 순위가 정한다 (02 §6.2) — 화면은 고르지 않는다.
    siteId: null,
  };
  const result: ManualResult = role === 'gap' ? await makePlateFor(req) : await pickPlateNow(req);
  const { say } = useUi.getState();

  if (!result.ok) {
    // `no-plate` 의 사유는 `gap.reason` 에 적혔고 「판이 없는 문법」이 그것을 보인다 (04 §1.4).
    say(result.reason === 'no-plate'
      ? `「${label}」 판은 아직 만들 수 없습니다 — 사유는 「판이 없는 문법」에 적힙니다.`
      : `「${label}」 판을 걸지 못했습니다.`);
    return;
  }

  await refreshHome();
  if (result.opened) return;
  if (result.pos === null) {
    say(`「${label}」 판을 만들었습니다. 오늘은 인쇄할 큐가 없어 큐에 넣지는 못했습니다.`);
    return;
  }
  const where = `오늘 큐 ${result.pos + 1}번째`;
  say(result.reused
    ? `「${label}」 판은 이미 ${where}에 있습니다.`
    : `「${label}」 판을 ${where}에 넣었습니다.`);
}

/** 폴더 고르기. 대화상자도 `@tauri-apps/*` 라 `ipc-client` 를 거친다 (01 §2). */
async function pickFolder(): Promise<void> {
  const picked = await ipc.dialog.pickFolder('리포 폴더 고르기');
  if (picked !== null) await addRepo(picked);
}

/** 세션 시작 직전과 수동 새로고침이 부르는 재스캔 (03 §1.7). */
export const rescan = (): Promise<void> => ingest('incremental');
