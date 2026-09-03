import './LockedPanel.css';

export interface LockedPanelProps {
  /** 04 §3.1 순위 ②를 통과하는 블록 수. 0 보다 크면 아무것도 그리지 않는다. */
  openable: number;
  /** 인제스트된 파일 수. 0 이면 아직 읽은 것이 없어 안내할 것도 없다. */
  files: number;
}

/**
 * `.locked-panel` — 「아직 안 열린 것」 (D96).
 *
 * T1 필사는 04 §3.1 순위 ②(「모르는 문법 ≤ 3개」)를 통과하는 블록이 있어야 열린다. 갓
 * 등록한 리포는 모든 개념이 0겹이라 그런 블록이 하나도 없고, 그러면 오늘의 인쇄에 필사
 * 판이 **조용히 빠진다**. M3 에서 실제로 그랬고 화면이 아무 말도 하지 않아 고장으로 읽혔다.
 *
 * 「판이 없는 문법」 옆에 두는 이유는 그 패널도 「아직 카드가 없다」는 말이기 때문이다 —
 * 「아직 못 하는 것」을 한 자리에 모으면 같은 문장으로 읽힌다.
 *
 * **아무것도 잠그지 않는다.** `Newcomer` 와 같은 규칙이다: 게이트가 아니라 안내이므로
 * 버튼도 닫기도 없고, 조건이 풀리면 스스로 사라진다.
 */
export function LockedPanel({ openable, files }: LockedPanelProps) {
  if (openable > 0 || files === 0) return null;

  return (
    <aside className="locked-panel" aria-label="아직 안 열린 것">
      <b>T1 필사</b>
      <p>
        이 리포의 문법을 조금 익힌 뒤에 열립니다. 지금은 어느 블록을 봐도 처음 보는 문법이
        너무 많아, 필사가 타자 연습이 됩니다.
      </p>
      <p className="how">문법 판(T0)을 며칠 찍으면 그 블록부터 열립니다.</p>
    </aside>
  );
}
