import type { ReactNode } from 'react';
import { cx } from './cx';
import './Card.css';

export type CardTone = 'surface' | 'inset' | 'plain';
export type CardPad = 'none' | 'sm' | 'md' | 'lg';
export type CardLift = 'flat' | 'raised' | 'float';

export interface CardProps {
  tone?: CardTone | undefined;
  pad?: CardPad | undefined;
  /**
   * 그림자는 「떠 있다」를 말할 때만 한 겹이다 (정본 §6 성능·장식 규칙).
   * 목록·패널은 `flat` 이고, `float` 는 모달·팝오버처럼 진짜로 위에 뜬 것만 쓴다.
   */
  lift?: CardLift | undefined;
  /** 제목 줄. 오른쪽에 `aside` 가 붙는다. */
  title?: ReactNode | undefined;
  aside?: ReactNode | undefined;
  /** 제목의 헤딩 층위. 화면의 개요 구조를 깨지 않도록 부르는 쪽이 정한다. */
  titleAs?: 'h2' | 'h3' | undefined;
  /** 누르면 반응하는 카드 — `<button>` 으로 그린다. */
  onClick?: (() => void) | undefined;
  children: ReactNode;
}

const PAD = { none: false, sm: 'pad-sm', md: 'pad', lg: 'pad-lg' } as const;

/** `.card` — 내용을 담는 면. */
export function Card({
  tone = 'surface', pad = 'md', lift = 'flat', title, aside, titleAs = 'h2', onClick, children,
}: CardProps) {
  const className = cx(
    'card',
    tone !== 'surface' && tone,
    PAD[pad],
    lift !== 'flat' && lift,
    onClick !== undefined && 'tap',
  );
  const Head = titleAs;
  const body = (
    <>
      {title === undefined ? null : (
        <div className="card-head">
          <Head>{title}</Head>
          {aside === undefined ? null : <div>{aside}</div>}
        </div>
      )}
      {children}
    </>
  );

  if (onClick !== undefined) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}
