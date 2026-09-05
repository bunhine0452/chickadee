import type { CSSProperties } from 'react';
import { t } from '@chickadee/i18n';
import { RichText } from '@chickadee/ui';

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
  if (pct === 100) return t('map.verdictPerfect');
  return pct >= 66 ? t('map.verdictClose') : t('map.verdictAgain');
}

/**
 * `.verdict` + `.meter` — 채점 결과의 머리 (05 §5).
 *
 * 큰 숫자는 그냥 숫자다 — 판 어긋남 효과는 D182 로 없앴다.
 *
 * 막대는 `role="img"` 다. 두 칸의 길이 비가 곧 정보라서 장식이 아니고, 그렇다고 눈금을 읽는
 * 물건도 아니다 — 바로 위 문장이 같은 수를 이미 낱말로 낸다 (05 §9).
 */
export function Verdict({ pct, core, found, missed, wrong, bonus }: VerdictProps) {
  return (
    <div className="verdict">
      <div className="big">{`${pct}%`}</div>
      <div>
        <h4>{verdictTitle(pct)}</h4>
        <RichText
          as="p"
          html={t('map.verdictLine', {
            core: String(core),
            found: String(found),
            missed: String(missed),
            wrong: String(wrong),
            bonus: String(bonus),
          })}
        />
        <div
          className="meter"
          role="img"
          aria-label={t('map.meterLabel', {
            core: String(core),
            found: String(found),
            missed: String(missed),
          })}
        >
          <i className="f" style={{ '--w': found } as CSSProperties} />
          <i className="m" style={{ '--w': missed } as CSSProperties} />
        </div>
      </div>
    </div>
  );
}
