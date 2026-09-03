import { cx } from '@chickadee/ui';

import { hl } from '../plate/hl';
import type { CloneStage } from './Stepper';
/* `.code` · `.ln` 의 조판은 CodePlate 가, `.pane-h` 는 SplitPane 이 들고 있다 —
   지지대는 그 위에 「가려진 줄」만 얹는다. */
import '../plate/CodePlate.css';
import './SplitPane.css';
import './RefPlate.css';

/** 가려진 줄의 자리표 폭 — 목업 `render()` 의 `min(30, max(4, trim길이 × 0.56))em`. */
export function placeholderEm(text: string): number {
  return Math.min(30, Math.max(4, text.trim().length * 0.56));
}

export interface RefPlateProps {
  /** 원본 한 줄씩. 줄 번호는 1부터 = 색인 + 1. */
  original: readonly string[];
  stage: CloneStage;
  /** 2·3단계에서 잉크로 남기는 줄의 **0부터** 세는 색인. */
  show: readonly number[];
  /** `` ` `` 홀드. `.peek` 이 붙어 CSS 가 잉크를 드러낸다 — 시각 전용이다. */
  peek: boolean;
  /** 에디터 캐럿이 있는 줄(0부터). 그 줄에 `data-cur` 가 붙는다. */
  curLine?: number | undefined;
  /** 머리말의 언어 이름. 없으면 줄 수만 적는다 (목업은 `TypeScript · 20줄`). */
  lang?: string | undefined;
}

/** 코드 한 줄을 강조 조각으로 그린다. 색은 글자에만 얹는다 (05 §5). */
function HlText({ text }: { text: string }) {
  return (
    <>
      {hl(text).map((tk, i) =>
        tk.cls === null ? (
          <span key={i}>{tk.t}</span>
        ) : (
          <i key={i} className={tk.cls}>
            {tk.t}
          </i>
        ),
      )}
    </>
  );
}

/**
 * `.ref` — 왼쪽 지지대 (05 §5).
 *
 * 1단계는 전부 잉크다. 2·3단계는 `show` 에 든 줄만 잉크로 남고 나머지는 **들여쓰기와
 * 줄 수를 보존한 하프톤 자리표**가 된다 — 골격은 고정, 잉크만 가변이라 세로 리듬이
 * 안 흔들린다.
 *
 * 가려진 줄에는 `aria-hidden` 이 붙는다. `peek` 은 **시각 전용**이라 그 `aria-hidden` 을
 * 풀지 않는다 (05 §5) — 낭독으로 원본을 다 받아 버리면 홀드가 힌트가 아니라 정답 낭독이
 * 된다. 원본을 소리로 받아야 하는 경우는 1단계다.
 */
export function RefPlate({ original, stage, show, peek, curLine, lang }: RefPlateProps) {
  const rows = original.map((text, i) => {
    const n = i + 1;
    const cur = curLine === i ? { 'data-cur': true } : {};

    if (stage === 1 || show.includes(i)) {
      return (
        <div key={n} className="ln" data-n={n} {...cur}>
          <i>{n}</i>
          {/* 빈 줄에도 공백 한 칸 — 없으면 그 줄만 높이가 무너진다 (목업 `hl(t)||' '`). */}
          <span>{text === '' ? ' ' : <HlText text={text} />}</span>
        </div>
      );
    }

    const indent = /^\s*/.exec(text)?.[0] ?? '';
    return (
      <div key={n} className="ln hidden" data-n={n} aria-hidden="true" {...cur}>
        <i>{n}</i>
        <span>
          {indent}
          <i className="ph" style={{ width: `${placeholderEm(text).toFixed(1)}em` }} />
          <span className="ink">
            <HlText text={text} />
          </span>
        </span>
      </div>
    );
  });

  const meta = stage === 1 ? (lang === undefined ? `${original.length}줄` : `${lang} · ${original.length}줄`) : '본문은 가려져 있습니다';

  return (
    <div className={cx('ref', peek && 'peek')}>
      <div className="pane-h">
        <b>{stage === 1 ? '원본 — 보면서 그대로 치세요' : '주석과 시그니처만'}</b>
        <span className="mono">{meta}</span>
      </div>
      <div className="code">{rows}</div>
    </div>
  );
}
