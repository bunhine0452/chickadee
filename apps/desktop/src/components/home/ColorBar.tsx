import type { CSSProperties } from 'react';

import { COLOR_BAR_DAYS } from '../../screens/home/data';
import './ColorBar.css';

/** 칸 하나에 겹치는 잉크 줄 수. 목업 `.cb div i` 3줄. */
const INK_ROWS = 3;
/** 한 줄이 켜지는 분 단위 — 9분마다 한 도씩 진해진다 (목업 `Math.ceil(m/9)`). */
const MINUTES_PER_ROW = 9;
/** 꺼진 줄도 아주 옅게 남긴다 — 칸의 높이를 눈이 읽게. */
const DIM_OPACITY = '0.16';

export interface ColorBarProps {
  /** 14칸, 오래된 날이 앞. 값은 그날 인쇄한 분. */
  days: readonly number[];
}

function cellTitle(index: number, last: number, mins: number): string {
  const when = index === last ? '오늘' : `${last - index}일 전`;
  return `${when} · ${mins === 0 ? '쉼' : `${mins}분`}`;
}

/** `.colorbar` — 지난 14일 잉크 농도. 색이 아니라 문장과 `title` 이 정보를 나른다 (05 §9). */
export function ColorBar({ days }: ColorBarProps) {
  const cells = Array.from({ length: COLOR_BAR_DAYS }, (_, i) => days[i] ?? 0);
  const last = COLOR_BAR_DAYS - 1;
  const total = cells.reduce((a, b) => a + b, 0);
  const printed = cells.filter((m) => m > 0).length;

  return (
    <div className="colorbar">
      <div className="cb-h">
        <b>지난 14일 · 잉크 농도</b>
        <span>칸 하나가 하루. 색이 진할수록 오래 찍었습니다.</span>
      </div>
      <div
        className="cb"
        role="img"
        aria-label={`지난 14일 잉크 농도. 찍은 날 ${printed}일, 모두 ${total}분.`}
      >
        {cells.map((mins, i) => {
          const level = Math.min(INK_ROWS, Math.ceil(mins / MINUTES_PER_ROW));
          return (
            <div
              key={i}
              data-v={mins === 0 ? '0' : '1'}
              {...(i === last ? { 'data-today': '' } : {})}
              title={cellTitle(i, last, mins)}
            >
              {Array.from({ length: INK_ROWS }, (_, k) => (
                <i
                  key={k}
                  className={`i${k}`}
                  style={{ '--o': mins === 0 ? '0' : k < level ? '1' : DIM_OPACITY } as CSSProperties}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
