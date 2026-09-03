import type { CSSProperties } from 'react';
import { Misreg } from '@chickadee/ui';

import './Verdict.css';

export interface VerdictProps {
  /** 꼭 고쳐야 할 파일 중 찾은 비율(0~100). 이 숫자가 판 전체의 머리다. */
  pct: number;
  /** 꼭 고쳐야 할 파일 수 = 점수의 분모. */
  core: number;
  found: number;
  missed: number;
  /** 필요 없는데 고른 것. */
  wrong: number;
  /** 같이 바뀐 파일 중 고른 것. 감점하지 않는다. */
  bonus: number;
}

/** 목업 `resultHTML()` 의 제목 3종 그대로. 문턱은 100 과 66 이다. */
export function verdictTitle(pct: number): string {
  if (pct === 100) return '완벽합니다';
  return pct >= 66 ? '거의 맞았어요' : '다시 한 번 볼까요';
}

/**
 * `.verdict` + `.meter` — 채점 결과의 머리 (05 §5).
 *
 * 큰 숫자는 `Misreg`(`.big.mr`) 를 지난다 — 목업 `resultHTML()` 의 어긋남 효과이고, 유령 판은
 * `::before` 의 `content` 라 접근성 트리에 아예 없다(글자가 두 번 읽히지 않는다).
 *
 * 막대는 `role="img"` 다. 두 칸의 길이 비가 곧 정보라서 장식이 아니고, 그렇다고 눈금을 읽는
 * 물건도 아니다 — 바로 위 문장이 같은 수를 이미 낱말로 낸다 (05 §9).
 */
export function Verdict({ pct, core, found, missed, wrong, bonus }: VerdictProps) {
  return (
    <div className="verdict">
      <Misreg as="div" className="big" text={`${pct}%`} />
      <div>
        <h4>{verdictTitle(pct)}</h4>
        <p>
          꼭 고쳐야 할 {core}개 중 <b>{found}개 찾음</b> · <b>{missed}개 놓침</b> · 필요 없는데 고른 것{' '}
          <b>{wrong}개</b> · 보너스 <b>{bonus}개</b>
        </p>
        <div className="meter" role="img" aria-label={`${core}개 중 ${found}개 찾음, ${missed}개 놓침`}>
          <i className="f" style={{ '--w': found } as CSSProperties} />
          <i className="m" style={{ '--w': missed } as CSSProperties} />
        </div>
      </div>
    </div>
  );
}
