import { LiveRegion } from '@chickadee/ui';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { t } from '@chickadee/i18n';

import { focusOrFallback } from './focus.js';
import './SessionOverlay.css';

/** 탭 순서에 드는 것들. 포커스 트랩이 이 목록의 처음과 끝을 잇는다. */
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Esc 가 먼저 빠져나와야 하는 입력 (05 §2.3 ①). */
function isTyping(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  // Monaco 는 안쪽에 textarea 를 두므로 태그 검사로 함께 걸린다.
  return tag === 'TEXTAREA' || tag === 'INPUT' || el.isContentEditable;
}

export interface SessionOverlayProps {
  /** 작업 띠 (`JobBand`). */
  band: ReactNode;
  /** 작업대에 놓이는 교정지. */
  children: ReactNode;
  /** LIFER 베일. 열려 있으면 Esc 는 이것부터 닫는다 (05 §2.3 ②). */
  lifer?: ReactNode;
  onCloseLifer?: (() => void) | undefined;
  /** 사다리가 펼쳐져 있나 (05 §2.3 ③). */
  ladderOpen?: boolean | undefined;
  onCloseLadder?: (() => void) | undefined;
  /**
   * 세션 나가기 (05 §2.3 ④). **확인 모달은 없다** — 진행 저장은 이 콜백이 한다.
   */
  onExit: () => void;
  /**
   * 낭독 한 줄 (05 §7 · D114). `announce()` 규약을 이미 지난 문장을 받는다.
   *
   * **세션의 낭독 지점은 여기다.** `.proof` 가 `aria-modal` 이라 홈의 `.vh#live` 는 세션 중
   * 보조 기술에서 가려진다 — 밖에 두면 판정이 읽히지 않는다.
   */
  live?: string | undefined;
}

/**
 * `.proof` — 전체화면 교정쇄 (05 §5 · 정본 §3-4).
 *
 * **Esc 의 유일한 주인이다.** 캡처 단계에서 한 번에 한 겹만 벗긴다 (05 §2.3):
 *   ① 입력 중이면 입력에서 빠져나오기 → ② LIFER 베일 닫기 →
 *   ③ 포커스가 사다리 안이면 사다리 접고 「모르겠어요」로 → ④ 세션 나가기.
 *
 * 포커스는 이 안에 갇힌다(첫/마지막 탭 가능 요소 순환). 홈 트리에 `inert` 를 거는 것은
 * 앱 셸의 몫이다 — 오버레이는 자기 밖의 DOM 을 모른다.
 */
export function SessionOverlay({
  band,
  children,
  lifer,
  onCloseLifer,
  ladderOpen,
  onCloseLadder,
  onExit,
  live,
}: SessionOverlayProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  // 리스너는 한 번만 걸고 콜백은 ref 로 읽는다 — 다시 걸면 캡처 순서가 바뀐다.
  const stateRef = useRef({ lifer, onCloseLifer, ladderOpen, onCloseLadder, onExit });
  useEffect(() => {
    stateRef.current = { lifer, onCloseLifer, ladderOpen, onCloseLadder, onExit };
  }, [lifer, onCloseLifer, ladderOpen, onCloseLadder, onExit]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      // 물리 키로 판정하고 조합 중인 글쇠는 무시한다 (05 §7).
      if (e.code !== 'Escape' || e.isComposing) return;
      const s = stateRef.current;
      const active = document.activeElement;

      // ① 입력에서 빠져나오기. **`blur()` 하지 않는다** — 포커스가 `<body>` 로 떨어지면
      // 05 §9 의 「포커스 유실」 게이트가 그 순간 깨지고, 다음 Esc 가 ③(사다리 접기)을
      // 건너뛰어 **두 번에 홈까지** 간다(`closest('.reprint')` 가 `body` 에서는 못 찾는다).
      // 오버라이 자체로 옮기면 문맥이 유지된 채 입력만 빠져나온다.
      if (isTyping(active)) {
        e.preventDefault();
        ref.current?.focus();
        return;
      }

      // ② LIFER 베일 — 아무 키나 닫힘의 일부다.
      if (s.lifer !== undefined && s.lifer !== null) {
        e.preventDefault();
        s.onCloseLifer?.();
        return;
      }

      // ③ 사다리 — 포커스가 사다리 안일 때만 접고, 「모르겠어요」로 돌려보낸다.
      if (s.ladderOpen === true && active instanceof HTMLElement && active.closest('.reprint') !== null) {
        e.preventDefault();
        s.onCloseLadder?.();
        focusOrFallback(ref.current?.querySelector('.dunno') ?? null, '.proof');
        return;
      }

      // ④ 세션 나가기. 확인 모달 없음 (정본 §3-4).
      e.preventDefault();
      s.onExit();
    };

    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  // 포커스 트랩 — 첫/마지막 탭 가능 요소에서 순환한다 (05 §7).
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.code !== 'Tab' || e.isComposing) return;
      const items = [...el.querySelectorAll<HTMLElement>(TABBABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (first === undefined || last === undefined) return;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !el.contains(active))) {
        e.preventDefault();
        last.focus();
        return;
      }
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={ref}
      className="proof"
      role="dialog"
      aria-modal="true"
      aria-label={t('band.title')}
      // Esc ① 이 입력에서 빠져나올 때 포커스가 갈 자리. 탭 순서에는 들어가지 않는다.
      tabIndex={-1}
    >
      {band}
      <main className="bench" aria-live="off">
        {children}
      </main>
      {lifer}
      <LiveRegion text={live ?? ''} />
    </div>
  );
}
