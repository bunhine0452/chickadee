import { RichText, Switch } from '@chickadee/ui';
import type { SwitchOption } from '@chickadee/ui';

import './DiffFilter.css';

/** 보기 필터 3택. `ne` = 어긋남 + 동등만(기본), `all` = 전체, `d` = 어긋남만. */
export type DiffFilterValue = 'ne' | 'all' | 'd';

/** 목업 `renderResult()` 의 `.dfilter` 세 칸 그대로. */
export const DIFF_FILTERS: ReadonlyArray<SwitchOption<DiffFilterValue>> = [
  { v: 'ne', label: '어긋남 + 동등만' },
  { v: 'all', label: '전체' },
  { v: 'd', label: '어긋남만' },
];

const APPEAL_NOTE =
  '판정이 억울하면 각 줄의 <b>「같은 뜻인데요」</b>로 이의를 남길 수 있습니다. ' +
  '점수는 그대로 두고 규칙 쪽을 고칩니다.';

export interface DiffFilterProps {
  value: DiffFilterValue;
  onChange: (value: DiffFilterValue) => void;
}

/**
 * `.dfilter` — 줄별 결과의 보기 필터 (05 §5).
 *
 * 3개이므로 `Switch` 가 `role=radiogroup` 으로 그린다(2개면 `role=switch`). 기본값이
 * 「어긋남 + 동등만」인 이유: 정합한 줄은 볼 것이 없고, 동등은 **틀린 게 아니라는 것을
 * 봐야 하는** 줄이다.
 */
export function DiffFilter({ value, onChange }: DiffFilterProps) {
  return (
    <div className="dfilter">
      <span>보기</span>
      <Switch options={DIFF_FILTERS} value={value} label="보기" onChange={onChange} />
      <RichText html={APPEAL_NOTE} />
    </div>
  );
}
