import { useEffect, useRef, useState } from 'react';
import { announce } from './announce';
import './LiveRegion.css';

/** 같은 문장을 다시 읽히려면 잠깐 비웠다 채운다 (목업 `live()`). */
export const REANNOUNCE_DELAY_MS = 30;

export interface LiveRegionProps {
  /** `ui.live`. 들어온 값은 `announce()` 규약으로 다시 정규화된다. */
  text: string;
  /** 같은 문장을 다시 읽히고 싶을 때 올리는 수 (05 §7). */
  nonce?: number | undefined;
}

/**
 * `.vh#live` — 앱에 하나뿐인 `polite` 낭독 지점 (05 §7).
 * 호버 설명·타이머 갱신·토스트 부제는 여기로 오지 않는다.
 */
export function LiveRegion({ text, nonce = 0 }: LiveRegionProps) {
  const safe = announce(text);
  const [shown, setShown] = useState(safe);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setShown('');
    const t = setTimeout(() => setShown(safe), REANNOUNCE_DELAY_MS);
    return () => clearTimeout(t);
  }, [safe, nonce]);

  return (
    <div className="vh" id="live" role="status" aria-live="polite">
      {shown}
    </div>
  );
}
