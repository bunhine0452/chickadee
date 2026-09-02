import { DeeLogo, DeeSprite, PressButton } from '@chickadee/ui';

import './empty.css';

export interface FirstRunProps {
  /** 리포 폴더를 고른다 (`plugin-dialog`). 화면은 부르기만 하고 IPC 를 모른다. */
  onPick: () => void;
}

/**
 * 첫 실행 · 빈 상태 (05 §2.1 `first-run`).
 * 리포가 0개일 때 화면에 있는 것은 셋뿐이다 — 로고 배지, 한 문단, 버튼 하나.
 */
export function FirstRun({ onPick }: FirstRunProps) {
  return (
    <div className="firstrun">
      {/* HomeScreen 과 같은 이유 — 셸이 생기면 스프라이트는 그리로 간다 (05 §6). */}
      <DeeSprite />
      <main className="firstrun-in grain" tabIndex={-1}>
        <DeeLogo className="firstrun-logo" />
        <h1 className="firstrun-title">Chickadee</h1>
        <p className="firstrun-note">
          바이브 코딩으로 만든 내 코드가 교재입니다. 리포를 하나 등록하면 커밋과 파일을 읽어
          기능마다 대지를 깔고, 내 코드에 실제로 쓰인 문법부터 판을 짭니다. 읽기만 하고 리포에는
          아무것도 쓰지 않습니다.
        </p>
        <PressButton onClick={onPick}>리포 등록</PressButton>
      </main>
    </div>
  );
}
