import { Choices } from '../plate/Choices.js';
import { roleOptions } from '../../screens/session/t2Copy.js';

import './RoleQuiz.css';

export interface RoleQuizProps {
  /** 물어보는 폴더. `payload.role.folder` 그대로다 — 지도에는 없는 노드다. */
  folder: string;
  /** 지도의 층 넷. 라벨이 곧 보기다 (`payload.bands`). */
  bands: readonly { readonly l: string }[];
  /** 고른 보기의 색인(0~3). 아직 안 골랐으면 `null`. `payload.role.answer` 와 같은 축이다. */
  pick: number | null;
  /** 없으면 읽기 전용이다. */
  onPick?: ((choice: number) => void) | undefined;
}

/**
 * `.rquiz` — 「이 폴더는 왜 있나」 한 문항 4지 (04 §8.5 · D142).
 *
 * 보기는 지도의 밴드 행 라벨 넷 그대로다. 그래서 물어보는 폴더는 **지도에서 빠져 있다** —
 * 그려 두면 그 폴더가 앉은 행이 정답을 읽어 준다(생성기가 지도를 두 번 짓는 이유다).
 * 빠진 자리를 대신하는 것이 위의 상자 하나이고, 사용자가 할 일은 그것을 네 층 중 하나에
 * 놓는 것이다.
 *
 * 문항이 하나라 `DirectionQuiz` 처럼 번호를 매기지 않는다 — 정본 §3-9 「한 화면에 한 가지
 * 일」이고, 번호가 하나뿐인 목록은 번호가 뜻을 나르지 않는다.
 *
 * 보기는 T0 의 `Choices` 를 그대로 쓴다 — `1~4` 물리 키와 `↑↓` 로빙이 이미 05 §7 대로다.
 */
export function RoleQuiz({ folder, bands, pick, onPick }: RoleQuizProps) {
  return (
    <div className="rquiz">
      <p className="rq-f">{folder}</p>
      <Choices
        options={roleOptions(bands)}
        selected={pick === null ? null : pick + 1}
        {...(onPick === undefined ? {} : { onSelect: (k: number) => onPick(k - 1) })}
      />
    </div>
  );
}
