import { useEffect, useRef } from 'react';
import { t } from '@chickadee/i18n';
import { cx, FlatButton, PressButton, RichText } from '@chickadee/ui';
import type { InkLayer, Track } from '@chickadee/ui';

import { layerNames } from '../../screens/home/data';
import { Acts } from '../plate/Acts';
// 요약도 문제 판과 같은 폭·같은 흐름을 쓴다 (`.ps`·`.ps.wide`).
import '../plate/ProofSheet.css';
import './Summary.css';

/** 「곧」으로 표시할 겹 — 1겹 이하는 다음 인쇄가 코앞이다. */
const SOON_LAYER = 1;

export interface SummaryShift {
  conceptId: string;
  concept: string;
  /** 개념의 코드 토큰. */
  code: string;
  track: Track;
  lyFrom: InkLayer;
  lyTo: InkLayer;
  /** 다음 인쇄 시점 — 「11일 뒤」. */
  next: string;
  /** 트랙별 덧말 — T1 줄 수 · T2 % · 아래층. */
  extra?: string | undefined;
}

export interface SummaryLifer {
  concept: string;
  code: string;
  /** 「당신의 <b>src/cart.ts:42</b> 에서 채집」 — 서식 글. */
  where: string;
}

export interface SummaryProps {
  runNo: string;
  repo: string;
  /** 도장에 찍히는 날짜 — 「2026-09-03」. */
  date: string;
  /** 연속 인쇄 원에 들어가는 날짜 두 자리 — 「03」. */
  day: string;
  /** 겹이 움직인 목록. 카드별로 묶은 것이라 건 판 수와 다르다. */
  results: readonly SummaryShift[];
  /** 오늘 건 판 수와 그중 정합 수. */
  printed: number;
  ok: number;
  mins: number;
  streak: number;
  lifer?: SummaryLifer | undefined;
  /** 내일 예고. 서식 글이다. */
  tomorrow: string;
  onHome: () => void;
  onAgain?: (() => void) | undefined;
}

/** 「+1겹」 / 「−1겹 · 다시 찍기」 / 「제자리」. */
function moved(from: InkLayer, to: InkLayer): string {
  if (to > from) return t('plate.layerPlus', { n: String(to - from) });
  if (to < from) return t('summary.layerMinusReprint', { n: String(from - to) });
  return t('summary.layerSame');
}

/**
 * `.done-head` … `.hintbox` — 인쇄 완료 (05 §5).
 *
 * %가 아니라 겹으로 센다. 연속 인쇄는 숫자로만 적는다 — 스트릭은 진도를 열지 않고,
 * 끊겨도 연출이 없다 (정본 §3-7).
 */
export function Summary({
  runNo,
  repo,
  date,
  day,
  results,
  printed,
  ok,
  mins,
  streak,
  lifer,
  tomorrow,
  onHome,
  onAgain,
}: SummaryProps) {
  const ref = useRef<HTMLElement | null>(null);
  // 겹 이름은 로케일을 타므로 렌더마다 푼다 — 모듈 상수로 두면 `setLocale()` 보다 먼저 굳는다.
  const names = layerNames();

  const homeRefCb = useRef(onHome);
  useEffect(() => {
    homeRefCb.current = onHome;
  }, [onHome]);

  // 요약이 뜨면 포커스는 「홈으로」 버튼이다 (05 §7).
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    // 마지막 판의 판정란까지 내려간 작업대를 되돌린다 — 안 그러면 요약의 머리가 띠 밑에 숨는다 (D170 ②).
    const bench = el.closest<HTMLElement>('.bench');
    if (bench !== null) bench.scrollTop = 0;
    el.querySelector<HTMLButtonElement>('.acts .press-btn')?.focus({ preventScroll: true });
  }, []);

  // Enter = 홈으로. 버튼 위에서는 네이티브 활성화에 맡긴다 — 두 번 부르지 않는다.
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.isComposing || (e.code !== 'Enter' && e.code !== 'NumpadEnter')) return;
      if (e.target instanceof HTMLElement && e.target.closest('button') !== null) return;
      e.preventDefault();
      homeRefCb.current();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  return (
    <article ref={ref} className="ps wide" tabIndex={-1} aria-label={t('session.printDone')}>
      <div className="ps-in">
        <div className="done-head">
          <h2>{t('session.printDone')}</h2>
          <p>
            <b>{runNo}</b> · {repo} ·{' '}
            {t('summary.line', { printed: String(printed), mins: String(mins) })}
          </p>
          <span className="done-date">{date}</span>
        </div>

        <div className="tally">
          <div>
            <span className="k">{t('summary.tallyPrinted')}</span>
            <div className="v">
              {printed}
              <span className="u">{t('summary.unitPlate')}</span>
            </div>
          </div>
          <div>
            <span className="k">{t('session.exact')}</span>
            <div className="v">
              {ok} / {printed}
            </div>
          </div>
          <div>
            <span className="k">{t('summary.tallyTime')}</span>
            <div className="v">
              {mins}
              <span className="u">{t('summary.unitMinute')}</span>
            </div>
          </div>
          <div>
            <span className="k">{t('summary.tallyStreak')}</span>
            <div className="v">
              {streak}
              <span className="u">{t('summary.unitDay')}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="pane-h">
            <b>{t('summary.inkMoved')}</b>
            <span>{t('summary.inkNote')}</span>
          </div>
          <ul className="shifts">
            {results.map((row) => (
              <li key={row.conceptId} className="shift">
                <span className="pair">
                  {row.lyFrom}
                  <span className="arr" aria-hidden="true">→</span>
                  {row.lyTo}
                </span>
                <span className="nm">
                  {row.concept} {row.code === '' ? null : <code>{row.code}</code>}
                  <small>
                    {names[row.lyFrom].k} → {names[row.lyTo].k} · {moved(row.lyFrom, row.lyTo)}
                    {row.extra ?? ''}
                  </small>
                </span>
                <span className={cx('next', row.lyTo <= SOON_LAYER && 'soon')}>
                  {t('summary.nextPrint')}
                  <br />
                  <b>{row.next}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {lifer === undefined ? null : (
          <div className="lifer-box">
            <div className="lifer-k">{t('lifer.kicker')}</div>
            <h4>
              {t('summary.liferHeading')} {lifer.concept} {lifer.code === '' ? null : <code>{lifer.code}</code>}
            </h4>
            <RichText as="p" html={lifer.where} />
          </div>
        )}

        <div className="streak-line">
          <span className="st" aria-hidden="true">
            {day}
          </span>
          <RichText html={t('summary.streakNote', { n: String(streak) })} />
        </div>

        <div className="hintbox">
          <RichText html={tomorrow} />
        </div>

        <Acts
          left={
            onAgain === undefined ? null : (
              <FlatButton ghost onClick={onAgain}>
                {t('summary.again')}
              </FlatButton>
            )
          }
          hint={t('summary.hint')}
          right={
            <PressButton kbd="Enter" onClick={onHome}>
              {t('summary.home')}
            </PressButton>
          }
        />
      </div>
    </article>
  );
}
