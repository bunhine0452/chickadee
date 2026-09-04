import { t } from '@chickadee/i18n';
import './PickedChips.css';

export interface PickedChipsProps {
  /** 고른 파일 경로. 순서는 부모가 정한다 — 여기서 정렬하지 않는다. */
  picked: readonly string[];
}

/** 칩에 낼 글자. 목업 `base(p)` 그대로 마지막 한 칸. */
function base(path: string): string {
  return path.replace(/\/+$/, '').split('/').pop() ?? path;
}

/**
 * `.picked` — 고른 파일 칩 (05 §5).
 *
 * 지도에서 고른 것을 한 줄로 되비친다. 지도는 넓어서 위쪽 상자가 눈 밖으로 나가는데,
 * 「지금 몇 개를 골랐는지」는 채점 버튼을 누르기 전에 보여야 한다.
 */
export function PickedChips({ picked }: PickedChipsProps) {
  return (
    <div className="picked">
      {picked.length === 0 ? (
        <span className="none">{t('map.pickedNone')}</span>
      ) : (
        picked.map((p) => (
          <span className="chip" key={p}>
            {base(p)}
          </span>
        ))
      )}
    </div>
  );
}
