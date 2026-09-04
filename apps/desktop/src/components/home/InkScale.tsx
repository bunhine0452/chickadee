import { t } from '@chickadee/i18n';
import { Dee } from '@chickadee/ui';
import type { InkLayer } from '@chickadee/ui';

import { layerNames } from '../../screens/home/data';
import './InkScale.css';

/** 겹은 0~4 다섯 칸. `counts` 도 그 길이로 온다. */
const STEPS: readonly InkLayer[] = [0, 1, 2, 3, 4];

export interface InkScaleProps {
  /** 겹마다 개념이 몇 개인지. 길이 5, 오래된 칸이 앞(0겹). */
  counts: readonly number[];
}

/** 개념이 가장 많이 모인 칸. 동수면 낮은 겹이 이긴다. */
function busiest(counts: readonly number[]): number {
  let at = 0;
  for (let i = 1; i < STEPS.length; i += 1) {
    if ((counts[i] ?? 0) > (counts[at] ?? 0)) at = i;
  }
  return at;
}

/** 「0겹 미인쇄 4개, 1겹 애벌 3개, …」 — 색면 대신 문장이 정보를 나른다 (05 §9). */
function sentence(counts: readonly number[]): string {
  const names = layerNames();
  const parts = STEPS.map((i) => {
    const it = names[i];
    return t('home.inkScalePart', { n: it.n, k: it.k, count: String(counts[i] ?? 0) });
  });
  return t('home.inkScaleSaid', { parts: parts.join(', ') });
}

/**
 * `.inkscale` — 잉크 겹 척도. 목업의 `#ladder` 이지만 세션의 다시 찍기 사다리와
 * 이름이 겹쳐 `.inkscale` 로 개명했다 (05 §5).
 */
export function InkScale({ counts }: InkScaleProps) {
  const hit = busiest(counts);
  const names = layerNames();
  return (
    <div className="inkscale" role="img" aria-label={sentence(counts)}>
      {STEPS.map((i) => {
        const it = names[i];
        return (
          <div key={i} className={i === hit ? 'ld hit' : 'ld'}>
            <Dee ly={i} sticker />
            <b>{it.n}</b>
            <span>{it.k}</span>
            <em>
              {/* 목업의 `.ld em b` 를 그대로 둔다 — 세는 말은 언어마다 달라 접미로 뺀다. */}
              <b>{counts[i] ?? 0}</b>
              {t('home.countUnit')}
            </em>
          </div>
        );
      })}
    </div>
  );
}
