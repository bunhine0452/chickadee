/**
 * 화면 뼈대 (D182 · 정본 §6 · `styles/layout.css`).
 *
 * 화면마다 `<main>` 을 따로 짜면 반응형 규칙이 화면 수만큼 흩어진다 — 그러면 「720 에서
 * 안 깨진다」를 화면마다 다시 증명해야 하고, 실제로 그 증명이 안 된 화면이 코스였다
 * (720 폭에서 `document.scrollWidth` 998). 그래서 규칙을 **한 군데**에 두고 화면은
 * 그 안에 내용만 넣는다.
 *
 * 이 컴포넌트가 화면에 강요하는 것은 셋뿐이다.
 *   ① 바깥 상자가 창을 넘지 않는다 (`.l-page`)
 *   ② 넓어지면 여백이 늘고 내용은 가운데에 선다 (`.l-wrap`)
 *   ③ 옆 패널은 900 미만에서 위아래로 쌓인다 (`.l-split`)
 *
 * 색·활자·간격은 하나도 정하지 않는다 — 그것은 `tokens.css` 와 화면 자신의 몫이다.
 */
import { useEffect, useRef, type ReactNode } from 'react';

export interface PageProps {
  /** `<main>` 에 붙는 화면 이름. 기존 화면의 선택자(`.board`·`.shelf` …)를 그대로 쓴다. */
  className?: string | undefined;
  /** 접근성 이름. 화면마다 다르므로 여기서 문구를 만들지 않는다. */
  label?: string | undefined;
  /** 머리말. 폭 전체를 쓰고 싶으면 `wide` 를 켠다. */
  head?: ReactNode;
  /**
   * 내용의 최대 폭.
   *   `read`(기본) — `--content-max`. 읽는 화면.
   *   `wide` — `--content-max-wide`. 카드·목록 격자처럼 행 길이 규칙이 안 걸리는 화면.
   *   `full` — 상한 없음. 편집기처럼 창을 다 쓰는 화면.
   */
  width?: 'read' | 'wide' | 'full' | undefined;
  busy?: boolean | undefined;
  /**
   * 화면이 뜰 때 포커스를 이 `<main>` 에 둔다 (정본 §3-8 · 05 §9).
   *
   * 홈 말고는 전부 켠다. 안 켜면 화면을 바꾼 직후 포커스가 `<body>` 로 떨어져 Tab 이
   * 브라우저 크로뮴부터 다시 돈다 — 실측으로 코스·설정·서가 셋이 그랬다. 홈은 App 이
   * 세션에서 나온 자리를 따로 잡으므로(D111) 여기서 손대지 않는다.
   */
  focusOnMount?: boolean | undefined;
  children: ReactNode;
}

const WRAP = { read: '', wide: ' l-wrap-wide', full: ' l-wrap-full' } as const;

export function Page({
  className, label, head, width = 'read', busy, focusOnMount, children,
}: PageProps): React.JSX.Element {
  const wrap = `l-wrap${WRAP[width]}`;
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusOnMount !== true) return;
    // `preventScroll` — 옮기는 것이 목적이고 스크롤은 목적이 아니다 (App.tsx 의 홈 복귀와 같다).
    main.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  return (
    <main
      ref={main}
      className={`l-page${className === undefined ? '' : ` ${className}`}`}
      tabIndex={-1}
      {...(label === undefined ? {} : { 'aria-label': label })}
      {...(busy === true ? { 'aria-busy': 'true' } : {})}
    >
      {head === undefined ? null : <div className={`${wrap} l-page-head`}>{head}</div>}
      <div className={`${wrap} l-page-body`}>{children}</div>
    </main>
  );
}

export interface SplitProps {
  /** 옆 패널. 목차·필터·요약처럼 본문을 돕는 것만 들어간다. */
  side: ReactNode;
  /** 옆 패널을 오른쪽에. 900 미만에서는 어차피 한 단이라 아무 차이가 없다. */
  sideEnd?: boolean | undefined;
  /** 900 미만에서 옆 패널을 본문 **아래**로 (문제가 목차보다 먼저인 화면). */
  stackLast?: boolean | undefined;
  /** 보통·넓음에서 옆 패널이 스크롤을 따라온다. 목록이 길 때만 켠다. */
  sticky?: boolean | undefined;
  sideLabel?: string | undefined;
  children: ReactNode;
}

/**
 * 옆 패널 + 본문.
 *
 * 900 미만에서 두 단을 고집하면 본문이 `--measure` 아래로 눌리거나 옆 패널이 창 밖으로
 * 나간다 — 720 폭 코스 화면에서 편집기가 `right 998 / 창 720` 이었던 자리가 그것이다.
 * 그래서 좁음에서는 무조건 쌓는다. 「접는다」가 아니라 「쌓는다」인 이유는 접힌 패널은
 * 한 번 더 눌러야 열리는데, 그 한 번이 학습 중에 늘 걸리기 때문이다.
 */
export function Split({
  side, sideEnd, stackLast, sticky, sideLabel, children,
}: SplitProps): React.JSX.Element {
  const cls = ['l-split'];
  if (sideEnd === true) cls.push('l-split-side-end');
  if (stackLast === true) cls.push('l-split-stack-last');
  return (
    <div className={cls.join(' ')}>
      <aside
        className={`l-side${sticky === true ? ' l-side-sticky' : ''}`}
        {...(sideLabel === undefined ? {} : { 'aria-label': sideLabel })}
      >
        {side}
      </aside>
      <div className="l-content u-minw0">{children}</div>
    </div>
  );
}
