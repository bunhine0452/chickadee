import { t } from '@chickadee/i18n';
import { RichText, Switch } from '@chickadee/ui';
import type { SwitchOption } from '@chickadee/ui';

import './DiffFilter.css';

/** 보기 필터 3택. `ne` = 어긋남 + 동등만(기본), `all` = 전체, `d` = 어긋남만. */
export type DiffFilterValue = 'ne' | 'all' | 'd';

/** 목업 `renderResult()` 의 `.dfilter` 세 칸 그대로. 문장은 부를 때 푼다 (D117). */
export const diffFilters = (): ReadonlyArray<SwitchOption<DiffFilterValue>> => [
  { v: 'ne', label: t('clone.filterNotExact') },
  { v: 'all', label: t('clone.filterAll') },
  { v: 'd', label: t('clone.filterDiffer') },
];

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
      <span>{t('clone.filterLabel')}</span>
      <Switch
        options={diffFilters()}
        value={value}
        label={t('clone.filterLabel')}
        onChange={onChange}
      />
      <RichText html={t('clone.appealNote')} />
    </div>
  );
}
