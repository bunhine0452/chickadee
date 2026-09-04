import { useLayoutEffect } from 'react';
import { t } from '@chickadee/i18n';
import { Dee, RichText, Stamp } from '@chickadee/ui';

import { closeMark } from '../../devtools/audit.js';
import './LiferNote.css';

/** 첫 기록 Dee 의 키(px). 판정란 안이라 베일 시절(84px)보다 작다. */
const DEE_SIZE = 56;

/** 도장이 얹히는 각도(도). */
const STAMP_ROTATE = 6;

export interface LiferNoteProps {
  /** 개념 이름. */
  concept: string;
  /** 개념의 코드 토큰. */
  code: string;
  /** 「당신의 <b>src/cart.ts:42</b> 에서 채집 · T0 문법」 — 서식 글이다. */
  where: string;
  /** 「#047」. 부르는 쪽이 굳힌다 — 여기서 시계를 읽지 않는다. */
  serial: string;
}

/**
 * `.lifer-note` — 처음 기록하는 순간 (정본 §3-6 · D131).
 *
 * 전면 베일이 아니라 **판정란 안**이다. 판정문과 나란히 남으므로 덮을 배경도 닫을 것도 없고,
 * 도장이 찍히는 연출과 첫 기록이 한 화면에서 같이 읽힌다. 담는 것은 베일 시절 그대로다 —
 * 컨페티가 아니라 영구 기록(도장 · 일련번호 · 채집지).
 */
export function LiferNote({ concept, code, where, serial }: LiferNoteProps) {
  // 05 §10 `lifer:open` — 첫 성공을 알아챈 순간부터 기록이 실제로 놓일 때까지.
  useLayoutEffect(() => {
    closeMark('lifer:open');
  }, []);

  return (
    <div className="lifer-note" aria-label={t('lifer.label')}>
      <Dee ly={4} size={DEE_SIZE} motion="lifer" sticker />
      <div className="lifer-note-body">
        <div className="lifer-k">{t('lifer.kicker')}</div>
        <h5>
          {concept} <code>{code}</code>
        </h5>
        <RichText as="p" html={where} />
        <div className="lifer-serial">{serial}</div>
      </div>
      <Stamp text={t('lifer.stamp')} sub="LIFER" rotate={STAMP_ROTATE} hit />
    </div>
  );
}
