import { FlatButton, Kbd, RichText } from '@chickadee/ui';

import './Crumb.css';

/** 아래층으로 내려왔나, 다시 찍는 판인가. 목업의 `.depth` 두 글자 그대로. */
export type CrumbDepth = '아래층' | '다시 찍기';

/** 표식마다 기본으로 붙는 설명. 부르는 쪽이 `note` 로 덮어쓸 수 있다. */
const DEFAULT_NOTE: Readonly<Record<CrumbDepth, string>> = {
  '아래층': '1문제만 보고 같이 올라갑니다.',
  '다시 찍기': '지난번에 어긋난 판입니다. 진단은 그대로 두고 <b>다시 고릅니다</b>.',
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
  const text = note ?? DEFAULT_NOTE[depth];
  return (
    <div className="crumb">
      <span className="depth">{depth}</span>
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
            ↩ 지금 위로 돌아가기 <Kbd keys="B" />
          </FlatButton>
        </>
      )}
    </div>
  );
}
