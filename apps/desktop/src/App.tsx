import { ipc } from '@chickadee/ipc-client';
import { Toast } from '@chickadee/ui';
import { useEffect, useState } from 'react';

import type { TodayPreview } from './components/home/TodayPanel.js';
import { previewToday } from './data/session.js';
import { addRepo, ingest, refreshHome, report, todayKey } from './flow.js';
import { HomeScreen } from './screens/home/HomeScreen.js';
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

  return (
    <>
      {/* 세션 중에는 홈이 보조 기술에 잡히지 않는다 — 오버레이가 유일한 문맥이다 (05 §5). */}
      <div inert={inSession ? true : undefined}>
        <HomeScreen
          data={ui.home}
          repoName={repo.name}
          today={todayKey()}
          streak={0}
          {...(today ? { today_: today } : {})}
          onStart={() => void start(repo.id, repo.rootPath)}
          onMake={(conceptId) => useUi.getState().say(`「${conceptId}」 판 만들기는 M3 에서 열립니다.`)}
          onPick={(conceptId) => useUi.getState().say(`「${conceptId}」 찍기는 M3 에서 열립니다.`)}
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

/** 폴더 고르기. 대화상자도 `@tauri-apps/*` 라 `ipc-client` 를 거친다 (01 §2). */
async function pickFolder(): Promise<void> {
  const picked = await ipc.dialog.pickFolder('리포 폴더 고르기');
  if (picked !== null) await addRepo(picked);
}

/** 세션 시작 직전과 수동 새로고침이 부르는 재스캔 (03 §1.7). */
export const rescan = (): Promise<void> => ingest('incremental');
