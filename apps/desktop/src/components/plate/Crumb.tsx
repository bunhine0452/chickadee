import { t, type MessageKey } from '@chickadee/i18n';
import { FlatButton, Kbd, RichText } from '@chickadee/ui';

import './Crumb.css';

/** 아래층으로 내려왔나, 다시 찍는 판인가. 목업의 `.depth` 두 글자 자리다. */
export type CrumbDepth = 'prereq' | 'reprint';

/** 표식에 찍히는 두 글자. 판 머리의 역할 이름과 같은 낱말이라 키를 나눠 쓴다. */
const DEPTH_LABEL: Readonly<Record<CrumbDepth, MessageKey>> = {
  prereq: 'session.rolePrereq',
  reprint: 'session.roleRetry',
};

/** 표식마다 기본으로 붙는 설명. 부르는 쪽이 `note` 로 덮어쓸 수 있다. */
const DEFAULT_NOTE: Readonly<Record<CrumbDepth, MessageKey>> = {
  prereq: 'plate.crumbPrereqNote',
  reprint: 'plate.crumbReprintNote',
};

export interface CrumbProps {
  depth: CrumbDepth;
  /** 위 판의 이름. 아래층일 때만 쓴다. */
  parent?: string | undefined;
  /** 오른쪽 설명. 서식 글이라 `RichText` 를 거친다. */
  note?: string | undefined;
  /** 「지금 위로 돌아가기」. 없으면 버튼을 내지 않는다. */
  onBack?: (() => void) | undefined;
}

/**
 * `.crumb` — 지금 어느 층에 있는지 알리는 표식 (05 §5).
 *
 * 아래층은 벌이 아니라 경로다. 답하지 않고 올라가는 길(`B`)이 항상 열려 있다 (05 §7).
 */
export function Crumb({ depth, parent, note, onBack }: CrumbProps) {
  const text = note ?? t(DEFAULT_NOTE[depth]);
  return (
    <div className="crumb">
      <span className="depth">{t(DEPTH_LABEL[depth])}</span>
      {parent === undefined ? null : (
        <>
          <b>{parent}</b>
          <span className="arr">›</span>
        </>
      )}
      <RichText html={text} />
      {onBack === undefined ? null : (
        <>
          <span className="sp" />
          <FlatButton ghost onClick={onBack}>
            {t('plate.crumbBack')} <Kbd keys="B" />
          </FlatButton>
        </>
      )}
    </div>
  );
}
