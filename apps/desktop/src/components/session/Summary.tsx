import { useEffect, useRef } from 'react';
import { cx, Dee, DeeLogo, FlatButton, Misreg, Pill, PressButton, Reg, RichText, Stamp } from '@chickadee/ui';
import type { InkLayer, Track } from '@chickadee/ui';

import { LAYER_NAMES } from '../../screens/home/data';
import { Acts } from '../plate/Acts';
// 요약도 교정지 한 장이다 — 껍데기(`.ps`·`.ps-rail`·`.ps-in`)를 plate 에서 그대로 쓴다.
import '../plate/ProofSheet.css';
import './Summary.css';

/** 요약 로고 크기(px). 05 §6 이 못박은 세 자리 중 하나. */
const LOGO_SIZE = 84;

/** 도장이 얹히는 각도(도). */
const STAMP_ROTATE = -7;
const LIFER_STAMP_ROTATE = 6;

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
  if (to > from) return `+${to - from}겹`;
  if (to < from) return `−${from - to}겹 · 다시 찍기`;
  return '제자리';
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

  const homeRefCb = useRef(onHome);
  useEffect(() => {
    homeRefCb.current = onHome;
  }, [onHome]);

  // 요약이 뜨면 포커스는 「홈으로」 버튼이다 (05 §7).
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('.acts .press-btn')?.focus();
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
    <article ref={ref} className="ps wide" tabIndex={-1} aria-label="인쇄 완료">
      <Reg hit />

      <div className="ps-rail" aria-hidden="true">
        <Dee ly={4} sticker />
        <span className="vt">{runNo} · 완료</span>
      </div>

      <div className="ps-in">
        <div className="done-head">
          <DeeLogo size={LOGO_SIZE} className="logo" />
          <div>
            <Misreg as="h2" text="인쇄 완료" />
            <p>
              <b>{runNo}</b> · {repo} · {printed}판을 걸었고 {mins}분 걸렸습니다. 이 정도가 딱 좋습니다.
            </p>
          </div>
          <Stamp text="인쇄 완료" sub={date} rotate={STAMP_ROTATE} />
        </div>

        <div className="tally">
          <div>
            <span className="k">찍은 판</span>
            <div className="v">
              {printed}
              <span className="u">판</span>
            </div>
          </div>
          <div>
            <span className="k">정합</span>
            <div className="v">
              {ok} / {printed}
            </div>
          </div>
          <div>
            <span className="k">걸린 시간</span>
            <div className="v">
              {mins}
              <span className="u">분</span>
            </div>
          </div>
          <div>
            <span className="k">연속 인쇄</span>
            <div className="v">
              {streak}
              <span className="u">일</span>
            </div>
          </div>
        </div>

        <div>
          <div className="pane-h">
            <b>오늘 움직인 잉크</b>
            <span>%가 아니라 겹으로 셉니다. 겹은 시간을 두고 다시 맞힐 때만 쌓입니다.</span>
          </div>
          <ul className="shifts">
            {results.map((row) => (
              <li key={row.conceptId} className="shift">
                <span className="pair" aria-hidden="true">
                  <Dee ly={row.lyFrom} sticker />
                  <span className="arr">→</span>
                  <Dee ly={row.lyTo} sticker />
                </span>
                <span className="nm">
                  {row.concept} <code>{row.code}</code>
                  <small>
                    <Pill track={row.track}>{row.track.toUpperCase()}</Pill> {LAYER_NAMES[row.lyFrom].k} →{' '}
                    {LAYER_NAMES[row.lyTo].k} · {moved(row.lyFrom, row.lyTo)}
                    {row.extra ?? ''}
                  </small>
                </span>
                <span className={cx('next', row.lyTo <= SOON_LAYER && 'soon')}>
                  다음 인쇄
                  <br />
                  <b>{row.next}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {lifer === undefined ? null : (
          <div className="lifer-box">
            <Dee ly={4} motion="hop" sticker />
            <div>
              <h4>
                처음 기록한 문법 — {lifer.concept} <code>{lifer.code}</code>
              </h4>
              <RichText as="p" html={lifer.where} />
            </div>
            <Stamp text="첫 관찰" sub="LIFER" rotate={LIFER_STAMP_ROTATE} />
          </div>
        )}

        <div className="streak-line">
          <span className="st" aria-hidden="true">
            {day}
          </span>
          <span>
            연속 <b>{streak}일</b>. 연속 기록은 진도를 열지 않습니다 — 진도는 잉크 겹으로만 열립니다. 하루
            쉬어도 다음 날 이어집니다.
          </span>
        </div>

        <div className="hintbox">
          <RichText html={tomorrow} />
        </div>

        <Acts
          left={
            onAgain === undefined ? null : (
              <FlatButton ghost onClick={onAgain}>
                오늘 판 다시 보기
              </FlatButton>
            )
          }
          hint="수고했습니다. 내일 같은 시간에 이어서."
          right={
            <PressButton kbd="Enter" onClick={onHome}>
              홈으로
            </PressButton>
          }
        />
      </div>
    </article>
  );
}
