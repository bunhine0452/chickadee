import { Pill } from '@chickadee/ui';

import './ScoreCard.css';

/** 채점 뒤의 권고. 점수가 아니라 다음 행동이다 (정본 §3-3). */
export type CloneVerdict = 'advance' | 'repeat-soft' | 'repeat';

/** 목업 `renderResult()` 의 판정 알약 문구 3종 그대로. */
export const VERDICT_TEXT: Record<CloneVerdict, string> = {
  advance: '다음 단계로 가도 좋습니다',
  'repeat-soft': '한 번 더 같은 단계를 권합니다',
  repeat: '같은 단계를 한 번 더 하는 편이 빠릅니다',
};

export interface ScoreCardProps {
  /** 원본 줄 수 = 점수의 분모. */
  total: number;
  /** 의미가 맞은 줄 = 정합 + 동등. */
  meaning: number;
  exact: number;
  equiv: number;
  /** 어긋남 + 누락 + 추가. 셋을 합치는 것은 부모의 몫이다. */
  wrong: number;
  verdict: CloneVerdict;
}

/**
 * `.score` — 채점 결과의 머리 (05 §5).
 *
 * 「20분의 15」가 포스터 활자로 앉는다. 백분율을 크게 쓰지 않는 이유: 필사는 100% 일치가
 * 목적이 아니라서 「85%」는 합격선처럼 읽히고 「20분의 15」는 세어 본 숫자로 읽힌다.
 * 알약 4개(정합·동등·어긋남·권고)가 색과 낱말을 같이 낸다 (05 §9).
 */
export function ScoreCard({ total, meaning, exact, equiv, wrong, verdict }: ScoreCardProps) {
  return (
    <div className="score">
      <div className="big">
        {total}분의 {meaning}
        <small>의미가 맞은 줄</small>
      </div>
      <div>
        <p>
          이 중 글자까지 같은 줄은 <b>{exact}줄</b>. <b>동등</b>은 형태만 다르고 같은 뜻으로 인정한 줄 — 공백·들여쓰기,
          따옴표 종류, 세미콜론, 주석 문구, 지역 변수명 일관 치환.
        </p>
        <div className="pills">
          <Pill track="t1">정합 {exact}</Pill>
          <Pill track="t0">동등 {equiv}</Pill>
          <Pill track="t2">어긋남 {wrong}</Pill>
          <Pill ghost>{VERDICT_TEXT[verdict]}</Pill>
        </div>
      </div>
    </div>
  );
}
