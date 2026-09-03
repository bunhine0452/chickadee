import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { cx } from '../cx';
import type { InkLayer } from '../types';
import { deeImageUrl } from './deeImage';
import { SYMBOL_ID } from './symbols';
import type { DeeSymbol } from './symbols';
import { useDeeMotion } from './useDeeMotion';
import type { DeeMotion } from './useDeeMotion';
import './dee.css';

export type { DeeSymbol };

/** 이 크기 아래로는 전신이 판독되지 않는다 — 자동으로 머리 심볼로 바꾼다 (05 §6). */
export const DEE_HEAD_SIZE_LIMIT = 24;

export interface DeeProps {
  /** 잉크 겹 0~4. `data-ly` 속성 하나만 바뀌고 DOM 은 그대로다. */
  ly: InkLayer;
  symbol?: DeeSymbol | undefined;
  /** px. `DEE_HEAD_SIZE_LIMIT` 미만이면 심볼이 `head` 로 바뀐다. */
  size?: number | undefined;
  motion?: DeeMotion | null | undefined;
  /** 크림 원판 위에 얹은 스티커로 감싼다 (`.dee-sticker`). */
  sticker?: boolean | undefined;
  /** 타이핑 중이면 모션 0 (05 §6). */
  typing?: boolean | undefined;
  /** 감축 모드 — 클래스는 붙고 최종 포즈만 남는다. */
  reducedMotion?: boolean | undefined;
  /** 같은 모션을 다시 재생시키려면 올린다. */
  motionNonce?: number | undefined;
  className?: string | undefined;
}

/**
 * `.dee` — 판(plate)이 겹으로 켜지는 박새. 표정은 없다 (05 §6).
 * 장식이므로 접근성 트리에서 뺀다 — 겹은 `Passes` 와 글자가 나른다.
 */
export function Dee({
  ly,
  symbol = 'badge',
  size,
  motion,
  sticker,
  typing,
  reducedMotion,
  motionNonce,
  className,
}: DeeProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  useDeeMotion(ref, motion, { typing, reducedMotion, nonce: motionNonce });

  const resolved: DeeSymbol = size !== undefined && size < DEE_HEAD_SIZE_LIMIT ? 'head' : symbol;
  const box: CSSProperties | undefined = size === undefined ? undefined : { width: size, height: size };

  /**
   * 움직이지 않는 스티커는 **그림 한 장**으로 그린다 (D115). 홈은 개념 줄마다 하나를 놓아
   * 그 수가 수백이 되는데, `<use>` 는 인스턴스마다 6 경로를 다시 래스터한다(05 §10).
   *
   * 첫 커밋에는 스프라이트가 아직 문서에 없을 수 있어 `<use>` 로 그리고, 레이아웃 단계에서
   * 그림으로 바꾼다 — 판당 한 번만 굽고 나머지는 캐시가 답한다.
   */
  const bakeable = sticker === true && (motion === undefined || motion === null);
  const [image, setImage] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (!bakeable) return;
    setImage(deeImageUrl(resolved, ly));
  }, [bakeable, resolved, ly]);

  if (bakeable && image !== null) {
    return (
      <span
        className={cx('dee-sticker', 'dee-baked', className)}
        style={{ ...box, backgroundImage: image }}
        data-ly={ly}
      />
    );
  }

  const svg = (
    <svg
      ref={ref}
      className={cx('dee', className)}
      data-ly={ly}
      // 목업의 모든 `.dee` 가 이 뷰박스를 달고 있다. 빠뜨리면 `<use>` 가 심볼의 430 좌표계를
      // 그대로 써 배지가 제 칸 밖으로 흘러 아래 글자를 덮는다 (D116 — 잉크 겹 척도에서 실측).
      viewBox="0 0 100 100"
      style={sticker === true ? undefined : box}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${SYMBOL_ID[resolved]}`} />
    </svg>
  );

  if (sticker !== true) return svg;
  return (
    <span className="dee-sticker" style={box}>
      {svg}
    </span>
  );
}

export interface DeeLogoProps {
  size?: number | undefined;
  className?: string | undefined;
}

/** `#logo` — 고정색 브랜드 마크 (마스트헤드 66px · 작업 띠 46px · 요약 84px). */
export function DeeLogo({ size, className }: DeeLogoProps) {
  const box: CSSProperties | undefined = size === undefined ? undefined : { width: size, height: size };
  return (
    <svg className={cx('brand-logo', className)} style={box} aria-hidden="true" focusable="false">
      <use href="#logo" />
    </svg>
  );
}
