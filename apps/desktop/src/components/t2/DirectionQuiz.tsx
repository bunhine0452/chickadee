import { fileBaseName } from '@chickadee/grading';

import { Choices } from '../plate/Choices.js';
import { directionAsk, directionOptions } from '../../screens/session/t2Copy.js';

import './DirectionQuiz.css';

/** 04 §8.3 의 4지 — 0 `A→B` · 1 `B→A` · 2 양쪽 · 3 무관. `payload.pairs[].answer` 와 같다. */
export type DirectionPick = 0 | 1 | 2 | 3;

export interface DirectionQuizProps {
  /** `payload.pairs` 그대로. 정답(`answer`)은 여기서 읽지 않는다 — 화면은 문제만 안다. */
  pairs: readonly { readonly a: string; readonly b: string }[];
  /** 문항별 답. 아직 안 푼 문항은 **구멍**이라 `undefined` 다 (`gradeDirection` 이 그렇게 읽는다). */
  picks: readonly (DirectionPick | undefined)[];
  /** 없으면 읽기 전용이다. */
  onPick?: ((index: number, choice: DirectionPick) => void) | undefined;
}

/**
 * `.dquiz` — 의존성 방향 5문항 (04 §8.3 · D107).
 *
 * **한 화면에 다섯을 세로로 쌓는다.** 04 §8.3 이 「5문항 묶음」이라고만 적고 넘기는 방식을
 * 정하지 않아 여기서 정했다: ① 채점 단위가 묶음이라(`pct = 맞은 문항/5·100`) 「채점하기」가
 * 한 번뿐이고, 한 문항씩 넘기면 마지막 화면에서만 채점 버튼이 살아 앞 문항을 고칠 길이
 * 없다. ② 04 §8.3 의 힌트 ②가 「지도에서 두 상자에 마우스를 올리면…」이라 지도와 문항이
 * **같이** 보여야 하는데, 지도는 판 위쪽에 한 번 그려지므로 문항이 그 아래 다 있어야 한다.
 *
 * 보기는 T0 의 `Choices` 를 그대로 쓴다 — `1~4` 물리 키와 `↑↓` 로빙이 이미 05 §7 대로다.
 */
export function DirectionQuiz({ pairs, picks, onPick }: DirectionQuizProps) {
  return (
    <ol className="dquiz">
      {pairs.map((pair, i) => {
        const a = fileBaseName(pair.a);
        const b = fileBaseName(pair.b);
        const pick = picks[i];
        return (
          <li className="dq" key={`${pair.a} ${pair.b}`}>
            <p className="dq-q">
              <span className="n">{i + 1}</span>
              {directionAsk(a, b)}
            </p>
            <Choices
              options={directionOptions(a, b).map((t) => ({ t }))}
              selected={pick === undefined ? null : pick + 1}
              {...(onPick === undefined
                ? {}
                : { onSelect: (k: number) => onPick(i, (k - 1) as DirectionPick) })}
            />
          </li>
        );
      })}
    </ol>
  );
}
