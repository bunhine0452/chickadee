import type { CSSProperties } from 'react';
import { DEE_BIRD_CLIP_POINTS, DEE_BIRD_DIECUT_POINTS, DEE_PLATES } from './deePlates';

/**
 * `<svg><defs>` — 앱 루트에 **한 번만** 박는 Dee 스프라이트 (05 §6).
 *
 * 외부 파일 `<use href="mascot.svg#dee">` 는 WKWebView 에서 CSS 변수가 심볼 안으로
 * 상속되지 않아 판 변수가 죽는다 — 인라인이 유일한 방법이다.
 *
 * 00 D42 는 `dangerouslySetInnerHTML` 허용 파일로 `packages/ui/src/RichText.tsx` 와
 * `apps/desktop/src/components/dee/DeeSprite.tsx` 두 개를 적었다. 이 파일은 그 둘 중
 * 어느 쪽도 아니므로 **JSX 트리로 그린다** — 원본 마크업은 `<path d>` 6개와
 * `<polygon points>` 2개가 전부라 JSX 로 1:1 이 된다(`deePlates.ts`).
 */

/** `#logo` 는 판 변수를 고정색으로 덮는다 — 브랜드 마크는 겹에 반응하지 않는다. */
const LOGO_PLATES = {
  '--lk': '#1c1a17',
  '--lg': '#9ca7ad',
  '--lb': '#374fc4',
  '--lt': '#e4bd84',
  '--lp': '#ec4882',
  '--ly': '#f0c032',
} as CSSProperties;

function DeePlates() {
  return (
    <g id="deePlates">
      {DEE_PLATES.map((plate) => (
        <path key={plate.fill} style={{ fill: `var(${plate.fill})` }} fillRule="evenodd" d={plate.d} />
      ))}
    </g>
  );
}

export function DeeSprite() {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="htGray" width={4} height={4} patternUnits="userSpaceOnUse">
          <circle cx={2} cy={2} r={1.15} style={{ fill: 'var(--dee-gray)' }} />
        </pattern>
        <pattern id="htGrayL" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
          <circle cx={8} cy={8} r={4.4} style={{ fill: 'var(--dee-gray)' }} />
        </pattern>
        <clipPath id="deeBirdClip">
          <polygon points={DEE_BIRD_CLIP_POINTS} />
        </clipPath>

        <DeePlates />

        {/* 배지 : 링 + 새 + 가지 + 바닥 (스티커·레일·범례·요약) */}
        <symbol id="dee" viewBox="0 0 430 430" overflow="visible">
          <circle cx={215.5} cy={217} r={190} style={{ fill: 'var(--lpaper)' }} />
          <use href="#deePlates" />
        </symbol>

        {/* 새만 : 크림 다이컷 스티커 위의 새 + 가지 (길잡이·횃대) */}
        <symbol id="deeBird" viewBox="41 78 324 295" overflow="visible">
          <polygon points={DEE_BIRD_DIECUT_POINTS} style={{ fill: 'var(--lpaper)' }} />
          <g clipPath="url(#deeBirdClip)">
            <use href="#deePlates" />
          </g>
        </symbol>

        {/* 머리 : 16~20px 전용 크롭 (파비콘과 같은 창) */}
        <symbol id="deeHead" viewBox="190 80 180 180">
          <circle cx={215.5} cy={217} r={190} style={{ fill: 'var(--lpaper)' }} />
          <use href="#deePlates" />
        </symbol>

        {/* 브랜드 마크 : 같은 그림, 고정 색 */}
        <symbol id="logo" viewBox="0 0 430 430" style={LOGO_PLATES}>
          <circle cx={215.5} cy={217} r={190} fill="#f6efdc" />
          <use href="#deePlates" />
        </symbol>
      </defs>
    </svg>
  );
}
