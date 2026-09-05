/**
 * 코스 판의 키 (정본 §3-8 · 05 §7). 물리 키(`e.code`)로만 판정한다 — 한국어 IME 에서
 * `e.key` 는 믿을 수 없다. T0 판(`T0Plate`)과 같은 규칙이고 코스 판이 한 훅으로 나눠 쓴다.
 *
 * `1~4` 고르기 · `Enter` 확인(답한 뒤에는 다음) · `Space` 다음 · `?` 모르겠어요 ·
 * `⌘↵`(Ctrl+Enter) 채점 — 편집기 안에서도 받는다.
 */
import { useEffect } from 'react';

const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

export interface PlateKeys {
  answered: boolean;
  /** `Enter` 가 확인으로 갈 수 있나 — 고른 것이 있는가. */
  canSubmit: boolean;
  onDigit?: ((k: number) => void) | undefined;
  onSubmit: () => void;
  onNext: () => void;
  onDunno: () => void;
  /** `⌘↵`. 편집기·순서 판처럼 `Enter` 가 입력에 쓰이는 판만 준다. */
  onGrade?: (() => void) | undefined;
}

export function usePlateKeys(keys: PlateKeys): void {
  const { answered, canSubmit, onDigit, onSubmit, onNext, onDunno, onGrade } = keys;
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.isComposing) return;
      // `document` 에서 난 이벤트는 `closest` 가 없다 — 요소가 아니면 문맥 없음으로 본다.
      const target = e.target instanceof Element ? e.target : null;
      const typing = target !== null && target.closest('textarea, input') !== null;

      if ((e.metaKey || e.ctrlKey) && e.code === 'Enter') {
        if (onGrade === undefined || answered) return;
        e.preventDefault();
        onGrade();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing) return;

      const digit = DIGITS.indexOf(e.code);
      if (digit >= 0 && !answered && onDigit !== undefined && target?.closest('.reprint') == null) {
        e.preventDefault();
        onDigit(digit + 1);
        return;
      }
      if (e.code === 'Enter') {
        // 단추 위의 Enter 는 단추의 것이다 — 두 번 실행되면 판이 건너뛴다.
        if (target instanceof HTMLButtonElement) return;
        e.preventDefault();
        if (answered) onNext();
        else if (canSubmit) onSubmit();
        return;
      }
      if (e.code === 'Space' && answered) {
        if (target instanceof HTMLButtonElement) return;
        e.preventDefault();
        onNext();
        return;
      }
      if (e.code === 'Slash' && e.shiftKey) {
        e.preventDefault();
        onDunno();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [answered, canSubmit, onDigit, onSubmit, onNext, onDunno, onGrade]);
}
