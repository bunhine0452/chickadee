import { useEffect, useRef } from 'react';
import { t } from '@chickadee/i18n';
import { RichText } from '@chickadee/ui';

import './LinkPara.css';

export interface LinkParaProps {
  /** 「방금 배운 것과 이어보기」 본문. 서식 글이다. */
  payoff: string;
  /** 아래층에서 돌아온 직후라면 여기로 포커스를 옮긴다 (05 §7 「복귀 → LinkPara」). */
  focusOnMount?: boolean | undefined;
}

/**
 * `.link-para` — 아래층을 마치고 돌아오면 새로 열리는 문단 (05 §5 · 정본 §3-1).
 *
 * 점프가 이득이 되는 장치다. 내려갔다 오면 위 판에 없던 문단이 하나 생기고, 그 문단이
 * 아까 막힌 자리와 방금 배운 것을 잇는다.
 */
export function LinkPara({ payoff, focusOnMount }: LinkParaProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (focusOnMount === true) ref.current?.focus();
  }, [focusOnMount]);

  return (
    <section ref={ref} className="link-para" aria-label={t('plate.linkPara')} tabIndex={-1}>
      <span className="tag-new">{t('plate.linkNew')}</span>
      <h4>{t('plate.linkHeading')}</h4>
      <RichText as="p" html={payoff} />
    </section>
  );
}
