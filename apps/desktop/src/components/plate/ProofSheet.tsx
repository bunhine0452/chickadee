import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { cx, RichText } from '@chickadee/ui';
import type { InkLayer, Track } from '@chickadee/ui';

import { layerText } from '../home/labels';
import './ProofSheet.css';

/** 문제 판 폭 3단. 코드가 넓게 필요한 유형(경로·수정·재구현)이 `wide`·`xwide` 를 쓴다. */
export type ProofSheetWidth = 'normal' | 'wide' | 'xwide';

export interface ProofSheetProps {
  /** 「1번」. 진행 띠가 이미 자리를 말하므로 화면에는 안 찍고 낭독 이름표에만 남는다. */
  no: string;
  /** 데이터로는 남지만 **색을 고르지 않는다** — 트랙을 색으로 가르지 않는다 (정본 §6). */
  track: Track;
  /** 개념 이름. */
  concept: string;
  /** 개념의 코드 토큰 — `?.` 처럼. */
  code: string;
  /** 「의미형 · 새 문제」 같은 곁말. */
  kind: string;
  /** 출처 한 줄. 서식 글이다 — 「내 코드 <b>src/cart.ts:42</b>」. */
  source: string;
  /** [답하기 전 숙련도, 지금 숙련도]. 오른 것은 판정란이 말한다. */
  ly: readonly [InkLayer, InkLayer];
  width?: ProofSheetWidth | undefined;
  /** 마운트할 때 판으로 포커스를 옮긴다 (05 §7). 복귀 판은 `LinkPara` 에 양보하므로 끈다. */
  focusOnMount?: boolean | undefined;
  children?: ReactNode;
}

/**
 * `.ps` — 문제 판 한 장 (정본 §6 · D182).
 *
 * **테두리도 그림자도 기울기도 없다.** 전에는 종이 흉내였다 — 2.5px 겹테두리 · 6px 오프셋
 * 그림자 · 회전 · 왼쪽 레일 · 판 번호 어긋남 · 트랙 알약 · 겹 막대. 그것들이 화면에서
 * 코드보다 진했고, 학습자가 매 판마다 그 껍데기를 한 번씩 훑고 지나야 했다.
 *
 * 지금 이 판은 **글의 흐름 하나**다. 틀은 코드 창에만 남는다 — 화면에서 테두리가 하나뿐이면
 * 그 테두리가 「여기가 읽을 곳」이라는 뜻이 된다.
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
  focusOnMount,
  children,
}: ProofSheetProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [, to] = ly;
  void track;

  // 판이 걸리거나 **바뀔 때마다**. 앞 판의 판정란까지 내려간 스크롤이 남으면 새 판의
  // 머리가 진행 띠 밑에 숨는다 (D170 ②).
  useEffect(() => {
    if (focusOnMount === false) return;
    const el = ref.current;
    if (el === null) return;
    const bench = el.closest<HTMLElement>('.bench');
    if (bench !== null) bench.scrollTop = 0;
    el.focus({ preventScroll: true });
  }, [focusOnMount, no, concept]);

  return (
    <article
      ref={ref}
      className={cx('ps', width === 'wide' && 'wide', width === 'xwide' && 'xwide')}
      tabIndex={-1}
      aria-label={`${no} · ${concept} ${code}`}
    >
      <div className="ps-head">
        <h2 className="ps-h2">
          {concept} <code>{code}</code>
        </h2>
        <p className="ps-meta">
          <span className="ps-kind">{kind}</span>
          <span className="ps-src"><RichText html={source} /></span>
        </p>
        <p className="ps-ly" data-ly={to}>
          <RichText html={layerText(to)} />
        </p>
      </div>

      {children}
    </article>
  );
}
