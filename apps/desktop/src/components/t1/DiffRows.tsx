import { Fragment } from 'react';
import { t } from '@chickadee/i18n';
import { cx, FlatButton, RichText } from '@chickadee/ui';

import type { DiffFilterValue } from './DiffFilter';
import './DiffRows.css';

/** 줄 하나의 판정. 다섯 가지뿐이고 이 목록은 늘어나지 않는다 (04 T1 결과 모델). */
export type DiffStatus = 'exact' | 'equiv' | 'differ' | 'missing' | 'extra';

/**
 * 결과 한 줄.
 *
 * **판정 문구(`tag`·`why`)는 부모가 만들어 넘긴다** — 이 컴포넌트는 규칙을 모른다.
 * 어떤 사유로 동등이 되었는지, 어떤 스펙 카드를 붙일지는 T1 엔진의 지식이다.
 */
export interface DiffRow {
  /** 원본 줄 색인(0부터). 원본에 없는 줄이면 `-1`. */
  oi: number;
  /** 내가 쓴 줄 색인(0부터). 안 쓴 줄이면 `-1`. */
  ui: number;
  status: DiffStatus;
  /** 원본 원문. `null` 이면 「원본에 없는 줄입니다」. */
  original: string | null;
  /** 내가 쓴 원문. `null` 이면 「이 줄을 안 썼습니다」. */
  user: string | null;
  /** 태그 글자 — 「정합」·「동등」·「어긋남」·「누락」·「추가」·「이름 맞바꿈」. */
  tag: string;
  /** 사유 산문. 서식 글이라 RichText 를 지나간다. 빈 문자열이면 사유 칸이 없다. */
  why: string;
  /** 이의를 남길 수 있는 줄인가 (목업은 `differ` 만). */
  canAppeal: boolean;
  appealed: boolean;
}

/** 강조 조각. `mark` 면 `<mark>` 로 감싼다. */
export interface DiffSeg {
  readonly t: string;
  readonly mark: boolean;
}

/** 목업 `t1.js` 의 `toks()` 그대로 — 식별자 · 숫자 · 그 밖의 한 글자. */
function toks(s: string): string[] {
  return s.match(/[A-Za-z_$][\w$]*|\d+|\S/g) ?? [];
}

/**
 * 목업 `markDiff(o, u)` 를 옮긴 것. 토큰 수가 같을 때만 **다른 토큰만** 표시한다 —
 * 수가 다르면 정렬을 추측해야 하고, 추측한 강조는 없는 강조보다 나쁘다.
 *
 * 목업과 다른 점: HTML 문자열이 아니라 조각 배열을 돌려준다. 이어지는 맨 글자는 한 조각으로
 * 합쳐 DOM 을 목업의 텍스트 노드와 같은 수로 맞춘다.
 */
export function markDiff(original: string, user: string): DiffSeg[] {
  const x = toks(original);
  const y = toks(user);
  if (x.length !== y.length) return user === '' ? [] : [{ t: user, mark: false }];

  const out: DiffSeg[] = [];
  const push = (t: string, mark: boolean) => {
    if (t === '') return;
    const last = out[out.length - 1];
    if (!mark && last !== undefined && !last.mark) {
      out[out.length - 1] = { t: last.t + t, mark: false };
      return;
    }
    out.push({ t, mark });
  };

  let pos = 0;
  y.forEach((t, i) => {
    const at = user.indexOf(t, pos);
    if (at < 0) return;
    push(user.slice(pos, at), false);
    push(t, x[i] !== t);
    pos = at + t.length;
  });
  push(user.slice(pos), false);
  return out;
}

/** 판정 → `.rtag` 색 클래스. 정합 진홍 · 동등 청 · 그 밖 황 (05 §4.2 판정 색). */
const RTAG: Record<DiffStatus, 'e' | 'q' | 'd'> = {
  exact: 'e',
  equiv: 'q',
  differ: 'd',
  missing: 'd',
  extra: 'd',
};

/** 필터가 남기는 판정. 목업 `renderResult()` 의 세 갈래 그대로. */
const KEEP: Record<DiffFilterValue, (s: DiffStatus) => boolean> = {
  all: () => true,
  ne: (s) => s !== 'exact',
  d: (s) => s === 'differ' || s === 'missing' || s === 'extra',
};

export interface DiffRowsProps {
  rows: readonly DiffRow[];
  filter: DiffFilterValue;
  /** 「같은 뜻인데요」 — 넘기는 번호는 **`rows` 안의 색인**이다(필터 뒤 번호가 아니다). */
  onAppeal: (index: number) => void;
}

/** 내가 쓴 줄 칸. `differ` 이고 토큰 수가 같을 때만 다른 토큰이 `<mark>` 로 뜬다. */
function UserCell({ row }: { row: DiffRow }) {
  if (row.user === null) return <span>{t('clone.rowNotWritten')}</span>;
  if (row.status !== 'differ' || row.original === null) return <>{row.user}</>;
  return (
    <>
      {markDiff(row.original, row.user).map((sg, i) =>
        sg.mark ? <mark key={i}>{sg.t}</mark> : <Fragment key={i}>{sg.t}</Fragment>,
      )}
    </>
  );
}

/**
 * `.drows` — 줄별 결과 (05 §5).
 *
 * 표가 아니라 **목록**이다(`role=list`). 격자 4열로 보이지만 각 행은 원본·내 줄·태그·사유가
 * 한 덩어리로 읽혀야 하는 항목이고, `role=row` 로 만들면 스크린리더가 열 머리말을 찾다가
 * 없는 표를 읽는다.
 *
 * 이의 버튼은 토글(`aria-pressed`)이다 — 점수는 그대로 두고 규칙 쪽을 고치겠다는 표시라
 * 눌린 상태가 남아야 한다.
 */
export function DiffRows({ rows, filter, onAppeal }: DiffRowsProps) {
  const shown = rows.map((row, index) => ({ row, index })).filter(({ row }) => KEEP[filter](row.status));

  if (shown.length === 0) {
    return (
      <div className="drows" role="list" aria-label={t('clone.rowsLabel')}>
        <div className="drow exact empty" role="listitem">
          <i>·</i>
          <span className="o">{t('clone.rowsEmpty')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="drows" role="list" aria-label={t('clone.rowsLabel')}>
      {shown.map(({ row, index }) => (
        <div
          key={index}
          className={cx('drow', row.status, row.appealed && 'disputed')}
          role="listitem"
          data-oi={row.oi}
          data-ui={row.ui}
        >
          <i>{row.oi >= 0 ? row.oi + 1 : '＋'}</i>
          <span className="o">
            {row.original === null ? <span>{t('clone.rowNotInOriginal')}</span> : row.original}
          </span>
          <span className="u">
            <UserCell row={row} />
          </span>
          <span className="st">
            <span className={cx('rtag', RTAG[row.status])}>{row.tag}</span>
          </span>
          {row.why === '' && !row.canAppeal ? null : (
            <div className="why">
              <RichText html={row.why} />
              {row.canAppeal ? (
                <div>
                  <FlatButton ghost variant="dunno" on={row.appealed} onClick={() => onAppeal(index)}>
                    {row.appealed ? t('clone.appealDone') : t('clone.appealIdle')}
                  </FlatButton>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
