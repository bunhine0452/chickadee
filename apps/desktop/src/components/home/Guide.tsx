import { Dee, Say } from '@chickadee/ui';

import './Guide.css';

/** 길잡이 Dee 의 키. 목업 `.guide .dee{width:56px}`. */
const GUIDE_SIZE = 56;

export interface GuideProps {
  /** 말풍선 한 줄. 같은 문구는 `LiveRegion` 이 따로 읽는다 (05 §5). */
  msg: string;
}

/** `.guide` — 현재 대지 가장자리에 앉아 다음 판을 가리키는 박새. 전부 장식이다. */
export function Guide({ msg }: GuideProps) {
  return (
    <div className="guide" aria-hidden="true">
      <Say>{msg}</Say>
      <Dee ly={4} symbol="bird" size={GUIDE_SIZE} />
    </div>
  );
}
