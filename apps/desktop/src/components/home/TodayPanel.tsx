import { PressButton, Kbd, Stamp } from '@chickadee/ui';

import { TimeQueue, type QueueItem } from '../shell/TimeQueue.js';
import './TodayPanel.css';

export interface TodayPreview {
  /** 오늘 걸릴 판 미리보기. 실제 큐는 「인쇄 시작」이 짠다. */
  items: readonly QueueItem[];
  mins: number;
  /** 오늘 이어 찍을 세션이 있으면 몇 번째 판부터인가. 없으면 `null`. */
  resumeAt: number | null;
  streak: number;
  /** 지난 14일 인쇄 분. 도장 카드의 작은 격자. */
  days: readonly number[];
}

export interface TodayPanelProps {
  today: TodayPreview;
  /** 「인쇄 시작」 / 「이어 찍기」. */
  onStart: () => void;
  /** `YYYY-MM-DD`. 도장에 찍힌다. */
  date: string;
}

/**
 * `.today-n` · `.qlist` · `.stampcard` — 오늘의 인쇄 (05 §5 · 정본 §3-5).
 *
 * 진행바는 **시간 비례**다. 30초 판과 9분 판이 같은 크기면 「얼마나 남았나」가 거짓말이 된다.
 * 연속 인쇄는 숫자로만 적는다 — 스트릭은 진도를 열지 않고 끊겨도 연출이 없다 (정본 §3-7).
 */
export function TodayPanel({ today, onStart, date }: TodayPanelProps) {
  const empty = today.items.length === 0 && today.resumeAt === null;

  return (
    <section className="today" aria-labelledby="today-h">
      <h3 id="today-h">
        오늘의 인쇄 <span className="plain">= 오늘 할 판</span>
      </h3>

      {empty ? (
        <p className="note today-empty">
          오늘은 인쇄할 판이 없습니다. 리포를 더 파거나 내일 다시 오세요 — 없는 것을 억지로
          채우지 않습니다.
        </p>
      ) : (
        <>
          <p className="today-n">
            <b>{today.items.length}</b>판 · 약 <b>{Math.round(today.mins)}</b>분
          </p>
          <TimeQueue items={today.items} pos={today.resumeAt ?? 0} />
          <ul className="qlist" aria-label="오늘 걸릴 판">
            {today.items.map((item, i) => (
              <li key={`${item.label}-${i}`} data-kind={item.kind}>
                <span className="q-name">{item.label}</span>
                <span className="q-sub">{item.sub}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="stampcard">
        <Stamp text={String(today.streak)} sub="연속 인쇄" tone="blue" rotate={-3} />
        <div className="cb-mini" role="img" aria-label={`지난 ${today.days.length}일 인쇄 기록`}>
          {today.days.map((mins, i) => (
            <i key={i} className={mins > 0 ? 'on' : ''} title={`${Math.round(mins)}분`} />
          ))}
        </div>
        <span className="stamp-date">{date}</span>
      </div>

      <PressButton tone="pink" disabled={empty} onClick={onStart}>
        {today.resumeAt === null ? '인쇄 시작' : `이어 찍기 · ${today.resumeAt + 1}번째 판부터`}
        <Kbd keys="Enter" />
      </PressButton>
    </section>
  );
}
