import { ipc } from '@chickadee/ipc-client';
import { Toast } from '@chickadee/ui';
import { useEffect } from 'react';

import { addRepo, ingest, refreshHome, todayKey } from './flow.js';
import { HomeScreen } from './screens/home/HomeScreen.js';
import { FirstRun } from './screens/home/empty.js';
import { IngestScreen } from './screens/ingest/IngestScreen.js';
import { activeRepo, useUi } from './store.js';

/**
 * 화면 하나를 고르는 곳 (05 §2.2 — 라우터 없음, 상태가 곧 라우팅).
 *
 * 세션 오버레이는 라우트가 아니라 상태이고 M2 에서 여기 위에 얹힌다.
 */
export function App(): React.JSX.Element {
  const ui = useUi();
  const repo = activeRepo(ui);

  // 리포를 바꾸면 홈을 다시 읽는다. 화면 상태는 파생 캐시라 언제든 버릴 수 있다 (01 §5).
  useEffect(() => {
    if (ui.screen === 'home' && ui.home === null && ui.activeId !== null) void refreshHome();
  }, [ui.screen, ui.home, ui.activeId]);

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
      <HomeScreen
        data={ui.home}
        repoName={repo.name}
        today={todayKey()}
        streak={0}
        onMake={(conceptId) => useUi.getState().say(`「${conceptId}」 판 만들기는 M2 에서 열립니다.`)}
        onPick={(conceptId) => useUi.getState().say(`「${conceptId}」 찍기는 M2 에서 열립니다.`)}
      />
      <Toast msg={ui.toast ?? ''} on={ui.toast !== undefined} />
    </>
  );
}

/** 폴더 고르기. 대화상자도 `@tauri-apps/*` 라 `ipc-client` 를 거친다 (01 §2). */
async function pickFolder(): Promise<void> {
  const picked = await ipc.dialog.pickFolder('리포 폴더 고르기');
  if (picked !== null) await addRepo(picked);
}

/** 세션 시작 직전과 수동 새로고침이 부르는 재스캔 (03 §1.7). */
export const rescan = (): Promise<void> => ingest('incremental');
