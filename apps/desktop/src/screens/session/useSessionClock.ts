/**
 * 세션 시계 (05 §3). 1초 tick 은 `session.elapsed[pos]` **하나만** 바꾼다 —
 * 구독자는 `TimeQueue` 와 남은 시간 텍스트 둘뿐이라 교정지는 리렌더되지 않는다.
 *
 * 창이 보이지 않으면 세지 않는다. 커피를 타러 간 20분이 「이 판에 20분 걸렸다」로
 * 기록되면 `est_min_ema` 가 오염되고 진행바가 거짓말한다.
 */
import { TICK_MS } from '@chickadee/scheduler';
import { useEffect, useRef } from 'react';

import { useUi } from '../../store.js';

const SECOND = 1_000;

/**
 * `pos` 가 바뀌면 그 판의 저장값에서 이어 센다. `onTick` 은 5초마다 한 번 불리고
 * (05 §3 의 저장 5시점 중 (d)), 그 안에서 `session_item.elapsed_s` 가 내려간다.
 */
export function useSessionClock(pos: number, startFrom: number, onTick: () => void): void {
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  }, [onTick]);

  useEffect(() => {
    let seconds = startFrom;
    useUi.getState().tick(pos, seconds);

    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      seconds += 1;
      useUi.getState().tick(pos, seconds);
      if (seconds % (TICK_MS / SECOND) === 0) tick.current();
    }, SECOND);

    return () => clearInterval(id);
  }, [pos, startFrom]);
}
