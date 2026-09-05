/**
 * 코스 판의 껍데기 — `ProofSheet` + 판정란 + 동작 줄 (D171 ④).
 *
 * 판 머리는 「로그인 · 2단 추적 · 버튼을 누르면」이다(`docs/ux-audit.md` §3) — 트랙·유형이
 * 아니라 챕터·단·유형. 겹은 판 머리의 레일에 그대로 보이되 **오르내리지 않는다** — 코스의
 * 진도 축은 단이고 겹은 어휘 판정기로 내려갔다(D162 ④).
 */
import type { StageVerdict } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import type { InkLayer } from '@chickadee/ui';
import { FlatButton } from '@chickadee/ui';
import type { ReactNode } from 'react';

import { Acts } from '../../components/plate/Acts.js';
import { FeedbackSlot, type FeedbackState } from '../../components/plate/FeedbackSlot.js';
import { ProofSheet } from '../../components/plate/ProofSheet.js';
import { queueKindOf, stageKey, typeKey, type StageCardView } from './run.js';

export interface PlateFrameProps {
  card: StageCardView;
  no: number;
  unitName: string;
  conceptName: string;
  layer: InkLayer;
  verdict: StageVerdict | null;
  /** 출처 한 줄 — 서식 글. */
  source: string;
  hint: string;
  right: ReactNode;
  stuckOpen: boolean;
  onDunno: () => void;
  /** 판정란 위에 놓이는 것 — 물음·코드·보기. */
  children: ReactNode;
  /** 판정란 아래, 동작 줄 위 — 막힘 패널. */
  after?: ReactNode;
  focusOnMount?: boolean | undefined;
}

const baseName = (p: string): string => p.slice(p.lastIndexOf('/') + 1);

export const sourceOf = (file: string, line: number | null): string =>
  line === null
    ? t('chapter.sourceFile', { file: baseName(file) })
    : t('chapter.sourceLine', { file: baseName(file), line: String(line) });

export function PlateFrame(props: PlateFrameProps): React.JSX.Element {
  const { card, verdict } = props;
  const state: FeedbackState = verdict === null ? 'idle' : verdict.ok ? 'right' : 'wrong';
  const pct = verdict?.pct ?? null;
  return (
    <ProofSheet
      no={t('chapter.plateNo', { n: String(props.no) })}
      track={queueKindOf(card.type)}
      concept={props.unitName}
      code={props.conceptName}
      kind={t('chapter.kindAndStage', { kind: t(typeKey(card.type)), stage: t(stageKey(card.stageNo)) })}
      source={props.source}
      ly={[props.layer, props.layer]}
      width={card.type === 'hop' || card.type === 'caller' || card.stageNo >= 4 ? 'wide' : 'normal'}
      {...(props.focusOnMount === undefined ? {} : { focusOnMount: props.focusOnMount })}
    >
      {props.children}

      <FeedbackSlot
        state={state}
        {...(verdict === null
          ? {}
          : {
              stamp: verdict.ok
                ? { text: t('session.exact'), sub: 'in register', tone: 'pink' as const }
                : { text: t('session.differ'), sub: 'off register', tone: 'blue' as const },
              title: verdict.ok ? t('session.right') : t('session.wrong'),
              body: (verdict.ok ? verdict.okText : verdict.diagnosis) ?? verdict.rule ?? verdict.okText ?? '',
              ...(verdict.rule === null ? {} : { rule: verdict.rule }),
              ...(pct === null || card.type === 'exec' || card.stageNo === 1
                ? {}
                : { result: { label: t('chapter.grade'), value: t('chapter.pctOf', { n: String(pct) }), note: '' } }),
            })}
      />

      {props.after ?? null}

      <Acts
        left={(
          <FlatButton variant="dunno" on={props.stuckOpen} onClick={props.onDunno}>
            {t('chapter.dunno')}
          </FlatButton>
        )}
        hint={props.hint}
        right={props.right}
      />
    </ProofSheet>
  );
}
