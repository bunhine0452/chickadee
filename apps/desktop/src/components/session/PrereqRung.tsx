import { cx, Dee, Pill, PressButton } from '@chickadee/ui';
import type { InkLayer } from '@chickadee/ui';

import './PrereqRung.css';

/** 아래층 한 칸의 상태 — 비었나(gap) · 판이 아직 없나(none) · 이미 찍혔나(ok). */
export type PrereqState = 'gap' | 'none' | 'ok';

/**
 * 아래층 한 줄.
 *
 * `CardPayload`(t0) 의 `prereq` 는 `{ conceptId, n }` 뿐이라 상태·겹·발췌가 없다.
 * 그 세 가지는 진단 문장을 쓰는 데 반드시 필요하므로 화면용 모형을 따로 둔다 —
 * 스키마를 넓히지 않고 화면이 필요한 것만 여기서 요구한다.
 */
export interface PrereqRow {
  conceptId: string;
  /** 개념 이름. */
  n: string;
  ly: InkLayer;
  state: PrereqState;
  /** 「3일 전 · 2겹」 같은 곁말. */
  note: string;
}

export interface PrereqRungProps {
  rows: readonly PrereqRow[];
  /** 이번 사다리에서 이미 보고 온 개념 id. */
  done: readonly string[];
  onJump?: ((row: PrereqRow) => void) | undefined;
}

/** 「모르겠어요」의 대부분은 이 개념이 어려워서가 아니라 아래층이 비어서다 (정본 §3-1). */
function diagnosis(rows: readonly PrereqRow[], gaps: number): string {
  if (rows.length === 0) {
    return '이 개념의 아래층은 모두 찍혀 있습니다. 이건 「이해 못 한」 것이 아니라 아직 익숙하지 않은 것입니다. 설명을 더 읽기보다 3단으로 내려가 같은 문법이 쓰인 내 코드를 여러 개 보는 편이 빠릅니다.';
  }
  if (gaps > 0) {
    return `「모르겠어요」의 대부분은 이 개념이 어려워서가 아니라 아래층이 비어 있어서입니다. 이 개념을 떠받치는 ${rows.length}개 중 ${gaps}개가 아직 안 찍혔습니다.`;
  }
  return '비어 있던 층을 방금 채웠습니다. 아래층이 다 찼으니 위 「이어보기」 문단을 한 번 더 읽고 다시 짚어 보세요.';
}

/**
 * `.prereq` — 사다리 ②단, 아래층 진단 (05 §5 · 정본 §3-1).
 *
 * 내려가도 지금 판은 사라지지 않는다. 아래층을 마치면 이 자리로 자동으로 돌아오고,
 * 돌아오면 `LinkPara` 문단이 새로 열린다.
 */
export function PrereqRung({ rows, done, onJump }: PrereqRungProps) {
  const isDone = (row: PrereqRow) => done.includes(row.conceptId);
  const gaps = rows.filter((r) => r.state === 'gap' && !isDone(r));

  return (
    <>
      <h4>아래층 진단 — 무엇이 비어 있나</h4>
      <p>{diagnosis(rows, gaps.length)}</p>

      <div className="prereq">
        {rows.map((row) => {
          const seen = isDone(row);
          const ly = (seen ? Math.min(4, Math.max(1, row.ly + 1)) : row.ly) as InkLayer;
          return (
            <div key={row.conceptId} className={cx('pq', row.state === 'gap' && !seen && 'gap')}>
              <Dee ly={ly} sticker />
              <span className="nm">
                {row.n}
                <small>{seen ? `방금 봄 · ${ly}겹` : row.note}</small>
              </span>
              {/*
                내려갈 수 있다는 뜻은 `state === 'gap'` 하나가 이미 담고 있다
                (`stateOf` 가 `hasCard && hasSite` 일 때만 그 값을 준다). 앞서 여기에
                `row.cardId !== undefined` 가 하나 더 걸려 있었는데 그 필드를 **아무도
                채우지 않아** 점프 단추가 한 번도 뜨지 않았다 — 02 §4 의 아래층 점프가
                화면에서 도달 불가였다 (D111). 판 만들기는 `jumpPrereq` 가 점프 시점에 한다.
              */}
              {row.state === 'gap' ? (
                seen ? (
                  <Pill ghost>✓ 방금 보고 왔습니다</Pill>
                ) : (
                  <PressButton tone="blue" onClick={() => onJump?.(row)}>
                    ↳ 이 판으로 내려가기 · 1문제 · 약 40초
                  </PressButton>
                )
              ) : row.state === 'none' ? (
                <Pill ghost>판 없음 · 홈에서 「판 만들기」</Pill>
              ) : (
                <Pill ghost>찍혀 있음</Pill>
              )}
            </div>
          );
        })}
      </div>

      {gaps.length === 0 ? null : (
        <p className="prereq-note">
          내려가도 지금 판은 사라지지 않습니다. 아래층을 마치면 <b>이 자리로 자동으로 돌아오고</b>, 돌아오면
          이어보기 문단이 새로 열립니다.
        </p>
      )}
    </>
  );
}
