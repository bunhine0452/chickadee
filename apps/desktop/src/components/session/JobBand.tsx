import type { ReactNode } from 'react';
import { t } from '@chickadee/i18n';

import { TimeQueue } from '../shell/TimeQueue';
import type { QueueItem } from '../shell/TimeQueue';
import './JobBand.css';

/** 1분 미만은 초로. */
function fmtMin(mins: number): string {
  return mins < 1
    ? t('band.seconds', { n: String(Math.round(mins * 60)) })
    : t('band.minutes', { n: String(Math.round(mins * 10) / 10) });
}

export interface JobBandProps {
  /** 「1번째 학습 · 로그인 2단」. */
  runNo: string;
  repo: string;
  queue: readonly QueueItem[];
  /** 지금 걸린 문제의 자리(0부터). `queue.length` 면 다 푼 것이다. */
  pos: number;
  /** 지금 문제에서 흐른 시간(초). 남은 시간과 지금 칸의 채움이 여기서 나온다. */
  elapsed: number;
  /** 오늘 세션 전체에서 흐른 시간(초). 다 푼 뒤에만 쓴다. */
  totalElapsed?: number | undefined;
  /** 오른쪽 조작 — 「나가기」. */
  children?: ReactNode;
}

/**
 * `.jobband` — 학습 화면 맨 위의 진행 띠 (D182).
 *
 * **띠는 문제가 아니다.** 그래서 화면에서 가장 조용한 자리이고, 하는 일 셋만 한다 —
 * 어디까지 왔나 · 얼마나 남았나 · 나가기. 전에는 여기에 로고 46px · 디스플레이 서체 제목 ·
 * 리포 이름 · 문제 이름표 줄이 있어 세로로 96px 을 먹었다. 지금은 한 줄 + 3px 막대다.
 *
 * 진행바는 여전히 **시간 비례**다 (정본 §3-5) — 30초짜리 고르기와 9분짜리 편집이 같은
 * 크기면 남은 양이 거짓말이 된다. 막대는 `shell/TimeQueue` 가 그리고 여기서는 높이만 준다.
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
    <header className="jobband" aria-label={t('band.label')}>
      <div className="jb-line">
        <p className="jb-where">
          <b className="jb-count">
            {done || at === undefined ? queue.length : pos + 1} / {queue.length}
          </b>
          <span className="jb-what">
            {done || at === undefined ? t('session.printDone') : at.label}
            {at?.sub === undefined ? '' : ` · ${at.sub}`}
          </span>
          <span className="jb-repo">{repo}</span>
          <span className="vh">{runNo}</span>
        </p>
        <span className="jb-time">
          {done || at === undefined
            ? t('band.today', { time: fmtMin((totalElapsed ?? elapsed) / 60) })
            : t('band.left', {
              n: String(Math.max(1, Math.round(left / 60))),
              time: fmtMin(at.mins),
            })}
        </span>
        <div className="jb-ctl">{children}</div>
      </div>

      {/* 칸마다 이름을 또 적지 않는다 — 지금 무엇을 푸는지는 위 줄이 이미 말했고,
          앞으로 올 것의 이름은 지금 이 문제를 푸는 데 쓸모가 없다 (정본 §6 「하나의 초점」). */}
      <TimeQueue items={queue} pos={pos} progress={progress} />
    </header>
  );
}
