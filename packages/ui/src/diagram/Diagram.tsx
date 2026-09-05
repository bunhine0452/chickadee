import type { ReactNode } from 'react';
import { Button } from '../Button';
import { cx } from '../cx';
import './Diagram.css';

export interface DiagramNav {
  at: number;
  total: number;
  onStep: (next: number) => void;
  prev: string;
  next: string;
}

export interface DiagramProps {
  /**
   * 낭독기 한 문장. **무엇을 뜻하는지**를 말한다 — 비트가 「1 0 1 1…」로 읽히면
   * 쓸모없다(diagrams.md §5).
   */
  label: string;
  /** 그림 자체. `role="img"` 안이라 낭독기는 이 안을 읽지 않는다. */
  children: ReactNode;
  /**
   * 표 대체. 화면에서만 숨기고 낭독기는 읽는다 — 한 문장 요약이 못 나르는 칸 단위
   * 정보가 여기 있다. `<table>` 을 그대로 넘긴다.
   */
  alt: ReactNode;
  /** 화면에 보이는 캡션. 문항이 `t()` 로 준다. */
  caption?: ReactNode | undefined;
  /** 단계가 있는 그림만. 버튼은 `role="img"` **밖**에 있어야 초점이 잡힌다. */
  nav?: DiagramNav | undefined;
  className?: string | undefined;
}

/**
 * `.dgm` — 그림 하나의 틀. 프레임이 세 가지를 보장한다:
 * ① 한 문장 `aria-label` ② 표 대체 ③ 단계 컨트롤이 그림 밖에 있는 것.
 */
export function Diagram({ label, children, alt, caption, nav, className }: DiagramProps) {
  return (
    <figure className={cx('dgm', className)}>
      <div className="dgm-view" role="img" aria-label={label}>
        {children}
      </div>
      <div className="dgm-alt">{alt}</div>
      {/* 설명은 설명하는 것 **바로 옆**에 (근접성 · design/system/README.md §1). */}
      {caption === undefined ? null : <figcaption className="dgm-cap">{caption}</figcaption>}
      {nav === undefined ? null : (
        <div className="dgm-nav">
          <Button size="sm" variant="ghost" disabled={nav.at <= 0} onClick={() => nav.onStep(nav.at - 1)}>
            {nav.prev}
          </Button>
          <span className="dgm-at">{`${nav.at} / ${nav.total}`}</span>
          <Button size="sm" variant="ghost" disabled={nav.at >= nav.total} onClick={() => nav.onStep(nav.at + 1)}>
            {nav.next}
          </Button>
        </div>
      )}
    </figure>
  );
}
