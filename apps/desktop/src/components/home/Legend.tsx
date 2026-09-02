import './Legend.css';

/** 트랙 색은 항상 라벨과 같이 나온다 — 색맹 규칙 (05 §9). */
const ENTRIES = [
  { track: 't0', code: 'T0', name: '문법' },
  { track: 't1', code: 'T1', name: '클론 코딩' },
  { track: 't2', code: 'T2', name: '구조' },
] as const;

/** `.legend` — 잉크 범례. */
export function Legend() {
  return (
    <ul className="legend" aria-label="잉크 범례">
      {ENTRIES.map((e) => (
        <li key={e.track} className="lg">
          <i className={`swatch ${e.track}`} aria-hidden="true" />
          <b>{e.code}</b>
          <span>{e.name}</span>
        </li>
      ))}
    </ul>
  );
}
