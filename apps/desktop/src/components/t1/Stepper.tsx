import { t, type MessageKey } from '@chickadee/i18n';
import { cx } from '@chickadee/ui';

import './Stepper.css';

/** 필사 3단계. 1 → 3 으로 갈수록 지지대가 사라진다 (정본 §3-3). */
export type CloneStage = 1 | 2 | 3;

/**
 * 목업 `t1.js` 의 `STAGES` 그대로. 판 머리말의 「2단계 뼈대만」·`.ask` 문구도 같은 이름을
 * 쓰므로 부모가 이 표를 다시 적지 않게 내보낸다.
 */
export const CLONE_STAGES = [
  { name: 'clone.stage1Name', sub: 'clone.stage1Sub' },
  { name: 'clone.stage2Name', sub: 'clone.skeletonOnly' },
  { name: 'clone.stage3Name', sub: 'clone.stage3Sub' },
] as const satisfies readonly { name: MessageKey; sub: MessageKey }[];

export interface StepperProps {
  stage: CloneStage;
}

/**
 * `.stepper` — 지금 몇 단계인지 (05 §5).
 *
 * 지난 단은 `done`, 지금 단은 `cur`. 색과 굵기만으로는 「지금」이 전달되지 않으므로
 * 현재 단에 `aria-current="step"` 을 붙였다 — 05 §5 표에는 `role=list` 까지만 있다.
 */
export function Stepper({ stage }: StepperProps) {
  return (
    <div className="stepper" role="list">
      {CLONE_STAGES.map((s, i) => {
        const n = i + 1;
        return (
          <div
            key={s.name}
            className={cx('step', n < stage && 'done', n === stage && 'cur')}
            role="listitem"
            {...(n === stage ? { 'aria-current': 'step' as const } : {})}
          >
            <b>{n}</b>
            <span>{t(s.name)}</span>
            <small>{t(s.sub)}</small>
          </div>
        );
      })}
    </div>
  );
}
