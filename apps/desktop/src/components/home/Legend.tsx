import { t, type MessageKey } from '@chickadee/i18n';

import './Legend.css';

/**
 * 트랙 색은 항상 라벨과 같이 나온다 — 색맹 규칙 (05 §9).
 * 표가 문장이 아니라 **키**를 드는 이유는 로케일이다 (D117).
 */
const ENTRIES: readonly { track: string; code: string; nameKey: MessageKey }[] = [
  { track: 't0', code: 'T0', nameKey: 'home.legendT0' },
  { track: 't1', code: 'T1', nameKey: 'home.legendT1' },
  { track: 't2', code: 'T2', nameKey: 'home.legendT2' },
];

/** `.legend` — 잉크 범례. */
export function Legend() {
  return (
    <ul className="legend" aria-label={t('home.legend')}>
      {ENTRIES.map((e) => (
        <li key={e.track} className="lg">
          <i className={`swatch ${e.track}`} aria-hidden="true" />
          <b>{e.code}</b>
          <span>{t(e.nameKey)}</span>
        </li>
      ))}
    </ul>
  );
}
