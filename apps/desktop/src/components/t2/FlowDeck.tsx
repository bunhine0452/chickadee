import { useEffect, useRef, useState } from 'react';
import { t } from '@chickadee/i18n';
import { fileBaseName } from '@chickadee/grading';

import {
  flowDeckEmpty, flowDeckLabel, flowEmpty, flowPathLabel,
  flowAddLabel, flowDropLabel, flowMoveLabel,
} from '../../screens/session/t2Copy.js';

import './FlowDeck.css';

export interface FlowDeckProps {
  /** 덱 전체 — 정답 경로 + 함정 카드가 섞여 온다 (`payload.flow.deck` · 04 §8.3). */
  deck: readonly string[];
  /** 세운 경로. **위에서 아래가 지나가는 순서**이고 그대로 `gradeFlow` 의 `ordered` 다. */
  ordered: readonly string[];
  /** 없으면 읽기 전용이다. */
  onOrder?: ((next: readonly string[]) => void) | undefined;
}

/**
 * `.fdeck` — 흐름 추적의 입력 (04 §8.3 · D107).
 *
 * **마우스 0 주행이 게이트다**(정본 §3-8 · 05 §7). 그래서 드래그 앤 드롭을 주 조작으로 삼지
 * 않는다 — 자리를 옮기는 것은 `↑`·`↓` **버튼**이고, 포인터는 같은 버튼을 누를 뿐이라
 * 마우스가 없어도 판이 완결된다. 드래그는 없다.
 *
 * 두 자리로 나눈 이유: 덱에는 경로 밖 파일이 섞여 있고(`FLOW_DECOYS` 2장) `gradeFlow` 는
 * **세운 것만** `ordered` 로 본다. 한 목록에 다 두고 순서만 세우게 하면 함정 카드가 언제나
 * `wrong` 으로 남아 만점이 나올 수 없다 — 빼는 자리가 있어야 함정이 함정이 된다.
 */
export function FlowDeck({ deck, ordered, onOrder }: FlowDeckProps) {
  const listRef = useRef<HTMLOListElement | null>(null);
  /**
   * 자리를 옮긴 뒤 포커스를 따라가게 한다. 끝자리로 가면 그 방향 버튼이 잠기므로 반대쪽
   * 버튼으로 옮긴다 — 안 그러면 키보드만 쓰는 사람이 `body` 로 튕겨 목록 밖으로 나간다.
   */
  const [refocus, setRefocus] = useState<{ seat: number; dir: 'up' | 'down' } | null>(null);

  useEffect(() => {
    if (refocus === null) return;
    const row = listRef.current?.querySelector(`.fcard[data-seat="${refocus.seat}"]`);
    const same = row?.querySelector<HTMLButtonElement>(`.mv-${refocus.dir}:not([disabled])`);
    (same ?? row?.querySelector<HTMLButtonElement>('.mv:not([disabled])'))?.focus();
    setRefocus(null);
  }, [refocus]);

  const placed = new Set(ordered);
  const rest = deck.filter((p) => !placed.has(p));
  const locked = onOrder === undefined;

  const move = (i: number, dir: 'up' | 'down'): void => {
    const j = dir === 'up' ? i - 1 : i + 1;
    const from = ordered[i];
    const to = ordered[j];
    if (onOrder === undefined || from === undefined || to === undefined) return;
    const next = [...ordered];
    next[i] = to;
    next[j] = from;
    onOrder(next);
    setRefocus({ seat: j + 1, dir });
  };

  return (
    <div className="fdeck">
      <ol className="fpath" ref={listRef} aria-label={flowPathLabel()}>
        {ordered.map((path, i) => {
          const name = fileBaseName(path);
          return (
            <li className="fcard" key={path} data-seat={i + 1}>
              <span className="seat" aria-hidden="true">{i + 1}</span>
              <span className="nm">{name}</span>
              <span className="mvs">
                <button
                  type="button"
                  className="mv mv-up"
                  disabled={locked || i === 0}
                  aria-label={flowMoveLabel(name, 'up', i + 1, ordered.length)}
                  onClick={() => move(i, 'up')}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="mv mv-down"
                  disabled={locked || i === ordered.length - 1}
                  aria-label={flowMoveLabel(name, 'down', i + 1, ordered.length)}
                  onClick={() => move(i, 'down')}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="drop"
                  disabled={locked}
                  aria-label={flowDropLabel(name)}
                  onClick={() => onOrder?.(ordered.filter((p) => p !== path))}
                >
                  {t('map.flowRemove')}
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      {ordered.length === 0 ? <p className="none">{flowEmpty()}</p> : null}

      <ul className="frest" aria-label={flowDeckLabel()}>
        {rest.map((path) => (
          <li key={path}>
            <button
              type="button"
              className="add"
              disabled={locked}
              aria-label={flowAddLabel(fileBaseName(path), ordered.length + 1)}
              onClick={() => onOrder?.([...ordered, path])}
            >
              {fileBaseName(path)}
            </button>
          </li>
        ))}
      </ul>
      {rest.length === 0 ? <p className="none">{flowDeckEmpty()}</p> : null}
    </div>
  );
}
