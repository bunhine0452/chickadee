import { cx } from './cx';
// 토큰은 앱의 `apps/desktop/src/styles/tokens.css` 가 단일 출처다(`pnpm design:sync` 가 생성).
// 이 컴포넌트가 쓰는 --verdict-* 도 거기 있다 — 여기서 다시 정의하면 두 출처가 갈라진다(D56).
import './Reg.css';

export interface RegProps {
  /** 정합(in register) — 완성된 판. 색이 정보를 나르지만 도장·텍스트가 따로 말한다. */
  hit?: boolean | undefined;
}

/** `.reg` — 등록 표시. 순수 장식이므로 접근성 트리에서 뺀다 (05 §5). */
export function Reg({ hit }: RegProps) {
  return (
    <svg className={cx('reg', hit && 'hit')} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 1v22M1 12h22" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
