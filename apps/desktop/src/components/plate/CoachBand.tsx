import { t, type MessageKey } from '@chickadee/i18n';
import { RichText } from '@chickadee/ui';

import './CoachBand.css';

/** 걸음 셋. 화면에는 사용자가 무엇을 했는지로만 정해진다 — 「다음」 버튼이 없다. */
export type CoachStep = 1 | 2 | 3;

const STEP_KEY = {
  1: 'coach.pick', 2: 'coach.confirm', 3: 'coach.read',
} as const satisfies Record<CoachStep, MessageKey>;

export interface CoachBandProps {
  step: CoachStep;
  /**
   * 이 판이 사전 예제인가 (D137 · D186 ④). 첫 걸음의 문장이 「당신 리포에서 그대로 떠 온
   * 줄」이라 합성 판에서는 그 한 줄이 거짓이 된다 — 그때만 다른 문장을 쓴다.
   */
  synthetic?: boolean | undefined;
}

/**
 * `.coach` — 첫 판을 함께 걷는 안내 띠 (D134).
 *
 * **별도 튜토리얼 화면이 아니다.** 이 리포의 첫 세션 첫 판 위에 얹혀 고르기 → `Enter` →
 * 판정 읽기 → `Space` 를 한 걸음씩 짚고, 걸음은 사용자의 동작으로만 넘어간다(넘기기 버튼도
 * 다음 버튼도 없다). 판은 진짜 판이라 채점도 겹도 그대로다 — 틀려도 다시 찍기 한 장이
 * 오늘 큐에 들어갈 뿐이다 (정본 §3-1).
 */
export function CoachBand({ step, synthetic }: CoachBandProps) {
  const key = step === 1 && synthetic === true ? 'coach.pickSynthetic' : STEP_KEY[step];
  return (
    <aside className="coach" aria-label={t('coach.label')}>
      <span className="coach-n" aria-hidden="true">{t('coach.step', { n: String(step) })}</span>
      <RichText as="p" html={t(key)} />
    </aside>
  );
}
