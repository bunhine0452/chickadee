import type { CSSProperties, ReactNode } from 'react';
import { t } from '@chickadee/i18n';
import { cx, DeeLogo } from '@chickadee/ui';

import { TimeQueue } from '../shell/TimeQueue';
import type { QueueItem } from '../shell/TimeQueue';
import './JobBand.css';

/** 작업 띠의 로고 크기(px). 05 §6 이 못박은 세 자리 중 하나. */
const LOGO_SIZE = 46;

/** 이름을 적어 줄 만큼 긴 칸. 목업의 `q.mins >= 2`. */
const LABEL_MIN_MINS = 2;

/** 목업 `fmtMin` — 1분 미만은 초로. */
function fmtMin(mins: number): string {
  return mins < 1
    ? t('band.seconds', { n: String(Math.round(mins * 60)) })
    : t('band.minutes', { n: String(Math.round(mins * 10) / 10) });
}

export interface JobBandProps {
  /** 「Run 08」. */
  runNo: string;
  repo: string;
  queue: readonly QueueItem[];
  /** 지금 걸린 판의 자리(0부터). `queue.length` 면 인쇄가 끝난 것이다. */
  pos: number;
  /** 지금 판에서 흐른 시간(초). 남은 시간과 지금 칸의 채움이 여기서 나온다. */
  elapsed: number;
  /** 오늘 세션 전체에서 흐른 시간(초). 인쇄가 끝났을 때만 쓴다. */
  totalElapsed?: number | undefined;
  /** 오른쪽 조작 — 「나가기」·주간반/야간반 스위치. */
  children?: ReactNode;
}

/**
 * `.jobband` — 어느 판을 걸었고 얼마나 남았나 (05 §5).
 *
 * 진행바는 시간 비례다 (정본 §3-5) — 30초 판과 9분 판이 같은 크기면 남은 양이 거짓말이 된다.
 * 막대는 `shell/TimeQueue` 가 그리고, 이 띠는 그 위아래의 문장과 이름표만 맡는다.
 */
export function JobBand({ runNo, repo, queue, pos, elapsed, totalElapsed, children }: JobBandProps) {
  const done = pos >= queue.length;
  const at = queue[pos];

  const left = queue.reduce((sum, item, i) => {
    if (i < pos) return sum;
    return sum + Math.max(0, item.mins * 60 - (i === pos ? elapsed : 0));
  }, 0);

  const progress = at === undefined || at.mins === 0 ? 0 : Math.min(1, elapsed / (at.mins * 60));

  return (
    <header className="jobband grain" aria-label={t('band.label')}>
      <div className="jb-brand">
        <DeeLogo size={LOGO_SIZE} className="logo" />
        <div>
          <div className="jb-title">{t('band.title')}</div>
          <div className="jb-sub">
            {runNo} · {repo}
          </div>
        </div>
      </div>

      <div className="jb-queue">
        <div className="jq-h">
          {done || at === undefined ? (
            <span>
              <b>
                {queue.length} / {queue.length}
              </b>{' '}
              · {t('session.printDone')}
            </span>
          ) : (
            <span>
              {t('band.now')}{' '}
              <b>
                {pos + 1} / {queue.length}
              </b>{' '}
              · {at.label}
              {at.sub === undefined ? '' : ` (${at.sub})`}
            </span>
          )}
          <span className="time">
            {done || at === undefined
              ? t('band.today', { time: fmtMin((totalElapsed ?? elapsed) / 60) })
              : t('band.left', {
                n: String(Math.max(1, Math.round(left / 60))),
                time: fmtMin(at.mins),
              })}
          </span>
        </div>

        <TimeQueue items={queue} pos={pos} progress={progress} />

        <div className="jq-labels" aria-hidden="true">
          {queue.map((item, i) => (
            <span
              key={`${item.kind}-${item.label}-${i}`}
              className={cx(i === pos && 'now')}
              style={{ '--w': item.mins } as CSSProperties}
            >
              {item.mins >= LABEL_MIN_MINS ? item.label : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="jb-ctl">{children}</div>
    </header>
  );
}
