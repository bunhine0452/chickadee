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
}

/**
 * `.coach` — 첫 판을 함께 걷는 안내 띠 (D134).
 *
 * **별도 튜토리얼 화면이 아니다.** 이 리포의 첫 세션 첫 판 위에 얹혀 고르기 → `Enter` →
 * 판정 읽기 → `Space` 를 한 걸음씩 짚고, 걸음은 사용자의 동작으로만 넘어간다(넘기기 버튼도
 * 다음 버튼도 없다). 판은 진짜 판이라 채점도 겹도 그대로다 — 틀려도 다시 찍기 한 장이
 * 오늘 큐에 들어갈 뿐이다 (정본 §3-1).
 */
export function CoachBand({ step }: CoachBandProps) {
  return (
    <aside className="coach" aria-label={t('coach.label')}>
      <span className="coach-n" aria-hidden="true">{t('coach.step', { n: String(step) })}</span>
      <RichText as="p" html={t(STEP_KEY[step])} />
    </aside>
  );
}
