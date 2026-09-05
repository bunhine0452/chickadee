import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { t } from '@chickadee/i18n';
import { cx, Misreg, Passes, Pill, Reg, RichText } from '@chickadee/ui';
import type { InkLayer, Track } from '@chickadee/ui';

import { layerNames } from '../../screens/home/data';
import { layerText } from '../home/labels';
import './ProofSheet.css';

/** 교정지 폭 3단. 목업 `.ps` / `.ps.wide` / `.ps.xwide`. */
export type ProofSheetWidth = 'normal' | 'wide' | 'xwide';

export interface ProofSheetProps {
  /** 판 번호 — 「3판」. 판 어긋남으로 크게 찍힌다. */
  no: string;
  track: Track;
  /** 개념 이름. */
  concept: string;
  /** 개념의 코드 토큰 — `?.` 처럼. */
  code: string;
  /** 「의미형 · 새 판」 같은 곁말. */
  kind: string;
  /** 출처 한 줄. 서식 글이다 — 「내 코드 <b>src/cart.ts:42</b>」. */
  source: string;
  /** [걸 때의 겹, 지금 겹]. 채점 전에는 둘이 같다. */
  ly: readonly [InkLayer, InkLayer];
  width?: ProofSheetWidth | undefined;
  /** 판이 대지에 얹힌 각도(도). 부속 숨김이면 CSS 가 0 으로 돌린다. */
  tilt?: number | undefined;
  /** 마운트할 때 판으로 포커스를 옮긴다 (05 §7). 복귀 판은 `LinkPara` 에 양보하므로 끈다. */
  focusOnMount?: boolean | undefined;
  children?: ReactNode;
}

/** 「+1겹」 / 「−1겹」 / 없음. 겹이 움직인 것을 이득으로 표시한다 (정본 §3-1). */
function plusLabel(from: InkLayer, to: InkLayer): string {
  if (to > from) return t('plate.layerPlus', { n: String(to - from) });
  if (to < from) return t('plate.layerMinus', { n: String(from - to) });
  return '';
}

/**
 * `.ps` — 교정지 한 장 (05 §5).
 *
 * 마운트하면 판 자체로 포커스가 온다(`tabIndex=-1`, 스크롤 0). 채점 뒤에는 포커스를
 * 옮기지 않는다 — 판정은 오버레이의 `.vh#live` 가 한 줄로 읽는다 (05 §7 · D114).
 */
export function ProofSheet({
  no,
  track,
  concept,
  code,
  kind,
  source,
  ly,
  width,
  tilt,
  focusOnMount,
  children,
}: ProofSheetProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [from, to] = ly;
  const plus = plusLabel(from, to);

  // 판이 걸리거나 **바뀔 때마다**. 앞 판의 판정란까지 내려간 작업대 스크롤이 남으면 새 판의
  // 머리가 작업 띠 밑에 숨고, `focus()` 가 문서까지 밀면 종이가 신호등 밑으로 들어간다 (D170 ②).
  useEffect(() => {
    if (focusOnMount === false) return;
    const el = ref.current;
    if (el === null) return;
    const bench = el.closest<HTMLElement>('.bench');
    if (bench !== null) bench.scrollTop = 0;
    el.focus({ preventScroll: true });
  }, [focusOnMount, no, concept]);

  const style: CSSProperties | undefined =
    tilt === undefined ? undefined : ({ '--tilt': `${tilt}deg` } as CSSProperties);

  return (
    <article
      ref={ref}
      className={cx('ps', width === 'wide' && 'wide', width === 'xwide' && 'xwide')}
      style={style}
      tabIndex={-1}
      aria-label={`${no} · ${concept} ${code}`}
    >
      <Reg />

      {/* 겹은 숫자다 — 문제 화면에 마스코트를 세우지 않는다 (D179 · 정본 §6·§7). */}
      <div className="ps-rail" aria-hidden="true">
        <b className="rail-ly">{to}</b>
        <span className={cx('plus', plus !== '' && 'on')}>{plus}</span>
        <span className="vt">
          {t('plate.railVertical', { no, n: String(to), name: layerNames()[to].k })}
        </span>
      </div>

      <div className="ps-in">
        <div className="ps-head">
          <Misreg className="sig" text={no} />
          <div>
            <h2 className="ps-h2">
              <Pill track={track}>{track.toUpperCase()}</Pill>
              {concept} <code>{code}</code>
              <span className="pl">{kind}</span>
            </h2>
            <div className="ps-src">
              <RichText html={source} />
            </div>
          </div>
          <div className="ps-ly">
            <Passes
              n={to}
              track={track}
              label={t('plate.inkLabel', { track: track.toUpperCase(), n: String(to) })}
            />
            <span className="lyn">{layerText(to)}</span>
          </div>
        </div>
        {children}
      </div>
    </article>
  );
}
