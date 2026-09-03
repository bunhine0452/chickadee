import { useEffect, useLayoutEffect, useRef } from 'react';
import { Dee, RichText, Stamp } from '@chickadee/ui';

import { closeMark } from '../../devtools/audit.js';
import './LiferVeil.css';

/** LIFER Dee 의 키(px). 목업 `.lifer-card .dee-sticker{width:84px}`. */
const DEE_SIZE = 84;

/** 도장이 얹히는 각도(도). */
const STAMP_ROTATE = 6;

/**
 * 혼자 눌렸을 때는 아무 일도 하지 않는 키.
 * Shift 를 눌러 대문자를 만들려던 손짓으로 평생 한 번뿐인 기록이 닫히면 안 된다.
 */
const MODIFIER_CODES = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'ContextMenu',
]);

export interface LiferVeilProps {
  /** 개념 이름. */
  concept: string;
  /** 개념의 코드 토큰. */
  code: string;
  /** 「당신의 <b>src/cart.ts:42</b> 에서 채집 · T0 문법」 — 서식 글이다. */
  where: string;
  /** 「#047 · 2026-09-03 · 14:22」. 시각은 부르는 쪽이 굳힌다 — 여기서 시계를 읽지 않는다. */
  serial: string;
  onClose: () => void;
}

/**
 * `.lifer-veil` / `.lifer-card` — 처음 기록하는 순간 (05 §5 · 정본 §3-6).
 *
 * 컨페티가 아니라 **영구 기록**이다: 도장 · 일련번호 · 채집지. 배경은 흐려지되 지워지지 않는다 —
 * 검은 오버레이를 씌우면 맥락이 사라진다.
 *
 * 아무 키·클릭에 닫힌다(수식키 단독 제외). 키를 전부 `preventDefault` 하므로 Tab 도 밖으로
 * 나가지 못한다 — 그것이 여기서 말하는 포커스 트랩이다. 닫히면 포커스는 열기 전 자리로 돌아간다.
 */
export function LiferVeil({ concept, code, where, serial, onClose }: LiferVeilProps) {
  const veilRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // 05 §10 `lifer:open` — 첫 성공을 알아챈 순간부터 베일이 실제로 놓일 때까지.
  useLayoutEffect(() => {
    closeMark('lifer:open');
  }, []);

  useEffect(() => {
    const before = document.activeElement;
    cardRef.current?.focus();

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.isComposing || MODIFIER_CODES.has(e.code)) return;
      e.preventDefault();
      e.stopPropagation();
      closeRef.current();
    };
    const onClick = () => closeRef.current();
    const veil = veilRef.current;

    // 캡처 단계에 건다 — 세션 오버레이의 Esc 사다리보다 먼저 이 베일이 걷힌다 (05 §2.3 ②).
    document.addEventListener('keydown', onKey, true);
    veil?.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('keydown', onKey, true);
      veil?.removeEventListener('click', onClick);
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  return (
    <div ref={veilRef} className="lifer-veil">
      <div ref={cardRef} className="lifer-card grain" role="dialog" aria-label="처음 기록한 개념" tabIndex={-1}>
        <Dee ly={4} size={DEE_SIZE} motion="lifer" sticker />
        <div className="lifer-body">
          <div className="lifer-k">첫 기록 · LIFER</div>
          <h3>
            {concept} <code>{code}</code>
          </h3>
          <RichText as="p" html={where} />
          <div className="lifer-serial">{serial}</div>
        </div>
        <Stamp text="첫 관찰" sub="LIFER" rotate={STAMP_ROTATE} hit />
        <div className="lifer-any">아무 키나 누르면 닫힙니다</div>
      </div>
    </div>
  );
}
