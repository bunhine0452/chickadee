import { t } from '@chickadee/i18n';
import { Kbd, PressButton, RichText } from '@chickadee/ui';

import { TimeQueue, type QueueItem } from '../shell/TimeQueue.js';
import './TodayCard.css';

export interface TodayPreview {
  /** 오늘 나올 문제 미리보기. 실제 큐는 「학습 시작」이 짠다. */
  items: readonly QueueItem[];
  mins: number;
  /** 오늘 이어 풀 세션이 있으면 몇 번째 문제부터인가. 없으면 `null`. */
  resumeAt: number | null;
  streak: number;
  /** 지난 14일 학습 분. 지금은 쓰지 않지만 계약이 이미 이 값을 나른다. */
  days: readonly number[];
}

export interface TodayCardProps {
  today: TodayPreview;
  /** 「학습 시작」 / 「이어 풀기」. */
  onStart: () => void;
}

/**
 * `.today` — 홈의 **하나의 초점** (정본 §6).
 *
 * 홈에서 학습자가 할 일은 하나다: 오늘 학습을 시작한다. 그래서 이 카드가 화면에서 가장
 * 크고 가장 진하고 맨 위에 있으며, 나머지는 전부 이 아래에서 물러난다.
 *
 * 뺀 것 셋 — ① 도장 카드(연속 학습 도장 + 14칸 격자 + 날짜)는 그림이라 지웠고 연속 학습은
 * 아래 한 줄이 말한다 ② 「= 오늘 풀 문제」 병기는 제목이 이미 그 말이라 지웠다
 * ③ 트랙 색은 안 쓴다 — 문제 종류는 이름이 말한다 (정본 §6 「색은 뜻에만」).
 *
 * 진행바는 그대로 **시간 비례**다 (정본 §3-5). 30초 문제와 9분 문제가 같은 칸이면
 * 「얼마나 남았나」가 거짓말이 된다.
 */
export function TodayCard({ today, onStart }: TodayCardProps) {
  const empty = today.items.length === 0 && today.resumeAt === null;

  if (empty) {
    return (
      <section className="today today-off" aria-labelledby="today-h">
        <h2 id="today-h" className="today-k">{t('home.todayTitle')}</h2>
        <p className="today-empty">{t('home.todayEmpty')}</p>
      </section>
    );
  }

  return (
    <section className="today" aria-labelledby="today-h">
      <h2 id="today-h" className="today-k">{t('home.todayTitle')}</h2>

      <RichText
        as="p"
        className="today-n"
        html={t('home.todayCount', {
          plates: String(today.items.length),
          mins: String(Math.round(today.mins)),
        })}
      />

      <TimeQueue items={today.items} pos={today.resumeAt ?? 0} />

      <div className="today-go">
        <PressButton onClick={onStart}>
          {today.resumeAt === null
            ? t('home.todayStart')
            : t('home.todayResume', { n: String(today.resumeAt + 1) })}
          <Kbd keys="Enter" />
        </PressButton>
        {today.streak > 0
          ? <p className="today-streak">{t('home.todayStreak', { n: String(today.streak) })}</p>
          : null}
      </div>

      <ul className="today-list" aria-label={t('home.todayList')}>
        {today.items.map((item, i) => (
          <li key={`${item.label}-${i}`}>
            <span className="tl-n" aria-hidden="true">{i + 1}</span>
            <span className="tl-name">{item.label}</span>
            <span className="tl-sub">{item.sub}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
