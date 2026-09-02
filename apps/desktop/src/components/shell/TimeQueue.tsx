import './TimeQueue.css';

/**
 * 시간 비례 진행바 (정본 §3-5 · 05 §5 `.queue`·`.qlist`).
 *
 * 왜 시간 비례인가: T0 30초 칸과 T1 9분 칸이 같은 크기면 「얼마나 남았나」가 거짓말이 된다.
 * 칸의 너비는 항목의 **예상 시간**에 비례하고(`--w`), 항목이 늘면 칸이 늘어난다.
 *
 * 인제스트 화면도 같은 것을 쓴다 (05 §2.1) — 스피너를 두지 않기로 했기 때문이다.
 * 마크업과 클래스는 목업 `design/ink-home.html` 의 `.queue` 그대로다.
 */

export interface QueueItem {
  /** 칸 색. 목업은 `t0`·`t1`·`t2`; 인제스트는 단계 이름을 쓴다. */
  kind: string;
  label: string;
  /** 예상 시간(분). 칸의 너비다. */
  mins: number;
  sub?: string;
  /** 다시 찍기·복습처럼 한 번 지나온 것 — 목업의 점무늬. */
  review?: boolean;
}

export interface TimeQueueProps {
  items: readonly QueueItem[];
  /** 지금 있는 칸의 인덱스. `items.length` 면 전부 끝난 것이다. */
  pos: number;
  /** 지금 칸 안에서의 진행 0~1. 모르면 생략한다 — 칸 단위로만 찬다. */
  progress?: number | undefined;
  /** 칸 아래에 이름·시간 목록을 함께 낸다. */
  labels?: boolean | undefined;
}

/** 「5칸 중 3번째 '파싱', 전체의 40%」. 화면 읽기가 이 문장만으로 성립해야 한다. */
function describe(items: readonly QueueItem[], pos: number, share: number): string {
  const at = items[pos];
  const percent = Math.round(share * 100);
  if (!at) return `${items.length}칸 모두 끝남`;
  return `${items.length}칸 중 ${pos + 1}번째 「${at.label}」, 전체의 ${percent}%`;
}

export function TimeQueue({ items, pos, progress, labels }: TimeQueueProps) {
  const total = items.reduce((sum, item) => sum + item.mins, 0) || 1;
  const before = items.slice(0, pos).reduce((sum, item) => sum + item.mins, 0);
  const inside = (items[pos]?.mins ?? 0) * (progress ?? 0);
  const share = Math.min(1, (before + inside) / total);

  return (
    <>
      <div className="queue" role="img" aria-label={describe(items, pos, share)}>
        {items.map((item, i) => (
          <i
            key={`${item.kind}-${item.label}`}
            className={`${item.kind}${item.review ? ' review' : ''}`}
            style={{ '--w': item.mins } as React.CSSProperties}
            data-state={i < pos ? 'done' : i === pos ? 'now' : 'later'}
          />
        ))}
      </div>
      {labels ? (
        <ul className="qlist" aria-hidden="true">
          {items.map((item, i) => (
            <li className="qi" key={`${item.kind}-${item.label}-row`} data-state={i < pos ? 'done' : i === pos ? 'now' : 'later'}>
              <span className={`pill ${item.kind}`}>{item.kind}</span>
              <span className="nm">
                {item.label}
                {item.sub ? <small>{item.sub}</small> : null}
              </span>
              <span className="min">{item.mins < 1 ? `${Math.round(item.mins * 60)}초` : `${item.mins}분`}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
