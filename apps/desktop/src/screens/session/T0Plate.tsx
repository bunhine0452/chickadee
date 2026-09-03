/**
 * T0 교정지 한 장 (05 §5 · 04 §1~§2). 컴포넌트를 조립하고 키를 받는 곳이며,
 * 규칙은 하나도 여기 없다 — 판정은 `session-flow.answerPlate` 가 한다.
 *
 * 「고르기 → Enter → Space」 세 번이면 판 한 장이 끝난다(정본 §3-8). 키는 전부 `e.code` 다.
 */
import { FlatButton, Kbd, PressButton } from '@chickadee/ui';
import { useCallback, useEffect, useState } from 'react';

import { Acts } from '../../components/plate/Acts.js';
import { Ask } from '../../components/plate/Ask.js';
import { Choices } from '../../components/plate/Choices.js';
import { CodePlate, type CodePlateProps } from '../../components/plate/CodePlate.js';
import type { HoleState } from '../../components/plate/Hole.js';
import { Crumb } from '../../components/plate/Crumb.js';
import { FeedbackSlot, type FeedbackState } from '../../components/plate/FeedbackSlot.js';
import { LinkPara } from '../../components/plate/LinkPara.js';
import { ProofSheet } from '../../components/plate/ProofSheet.js';
import { ReprintLadder, type RungNo } from '../../components/session/ReprintLadder.js';
import type { LadderData } from '../../data/ladder.js';
import type { Plate } from '../../data/session.js';
import type { PlateResult } from '../../store.js';

const KIND_NAME = { point: '지목형', blank: '빈칸형', meaning: '의미형' } as const;
const ROLE_NAME = {
  review: '복습', new: '새 판', retry: '다시 찍기', prereq: '아래층',
  manual: '이 판 찍기', gap: '판 만들기',
} as const;

export interface T0PlateProps {
  plate: Plate;
  no: number;
  result: PlateResult | null;
  /** 아래층에서 돌아온 직후면 「이어보기」 문단이 열린다 (02 §4). */
  payoff: string | null;
  ladder: LadderData | null;
  ladderOpen: boolean;
  rung: RungNo;
  stuck: string;
  onRung: (rung: RungNo) => void;
  onStuck: (text: string) => void;
  onCopyPrompt: () => void;
  onDunno: () => void;
  onJumpPrereq: (conceptId: string) => void;
  onBack: () => void;
  onSubmit: (sel: number) => void;
  onNext: () => void;
  onSelect: (sel: number) => void;
}

/**
 * 지목형은 판 안의 토큰이 곧 보기다 — `answer` 는 pick 번호(1부터)이고 보기 인덱스는
 * 0부터다. 이 한 칸 차이가 05 §7 의 `1~4` 와 04 §2.2 의 `sel` 을 갈라 놓는다.
 */
const isPick = (kind: string): boolean => kind === 'point';

/** 물리 키로만 판정한다 — 한국어 IME 에서 `e.key` 는 믿을 수 없다 (05 §7). */
const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];

/** 빈칸 한 자리. 아직 안 고르면 값이 없고, 채점되면 정오가 붙는다. */
function holeOf(
  result: PlateResult | null,
  value: string | undefined,
): NonNullable<CodePlateProps['hole']> {
  if (result !== null) {
    const state: HoleState = result.correct ? 'right' : 'wrong';
    return value === undefined ? { state } : { value, state };
  }
  // 아직 안 채운 빈칸은 `▢` 다. 고른 것이 있으면 그 글자가 자리에 들어간다.
  return value === undefined ? { state: 'empty' } : { value, state: 'filled' };
}

export function T0Plate(props: T0PlateProps): React.JSX.Element | null {
  const { plate, result, ladder, ladderOpen } = props;
  const payload = plate.payload.track === 't0' ? plate.payload : null;
  const [sel, setSel] = useState<number | null>(plate.state?.sel ?? null);

  useEffect(() => {
    setSel(plate.state?.sel ?? null);
  }, [plate.id, plate.state?.sel]);

  const answered = result !== null;
  const options = payload?.options ?? [];
  const pickable = payload !== null && isPick(payload.kind);

  const choose = useCallback((k: number) => {
    if (answered) return;
    const index = pickable ? k - 1 : k - 1;
    setSel(index);
    props.onSelect(index);
  }, [answered, pickable, props]);

  /*
   * 채점하면 고른 보기가 `disabled` 가 된다 — 포커스가 그 위에 있으면 그대로 죽는다
   * (브라우저는 `body` 로 떨어뜨리고, 그러면 06 §2 의 「매 단계 `activeElement !== body`」가
   * 깨진다). 그래서 다음 동작 버튼으로 옮긴다. 판정문은 `aria-live` 가 읽으므로 포커스가
   * 옮겨져도 읽히는 것은 같다 (05 §7).
   */
  useEffect(() => {
    if (!answered) return;
    document.querySelector<HTMLElement>('.acts .press-btn')?.focus();
  }, [answered]);

  // 05 §7 — `1~4` 고르기 / `Enter` 제출 / 답한 뒤 `Space` 다음 / `?` 모르겠어요.
  //
  // `1~4` 를 여기서 받는 이유: 판을 걸면 포커스가 `article.ps` 에 있어 `Choices`·`CodePlate` 의
  // 자체 핸들러까지 이벤트가 **내려가지 않는다**(버블은 위로만 간다). 05 §7 이 이 키를
  // 「T0 미답」 문맥에 준 것이라 문맥의 주인이 받는 것이 맞다. 사다리가 열려 포커스가 그 안이면
  // 단 선택이므로 건드리지 않는다(D11 — `ReprintLadder` 가 버블에서 멈춘다).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as Element | null;
      if (target?.closest('textarea, input') !== null && target !== null) return;

      const digit = DIGITS.indexOf(e.code);
      if (digit >= 0 && !answered && target?.closest('.reprint') == null) {
        e.preventDefault();
        choose(digit + 1);
        return;
      }

      if (e.code === 'Enter') {
        e.preventDefault();
        if (answered) props.onNext();
        else if (sel !== null) props.onSubmit(sel);
        return;
      }
      if (e.code === 'Space' && answered) {
        e.preventDefault();
        props.onNext();
        return;
      }
      if (e.code === 'Slash' && e.shiftKey) {
        e.preventDefault();
        props.onDunno();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [answered, sel, choose, props]);

  if (payload === null) return null;

  const state: FeedbackState = result === null ? 'idle' : result.correct ? 'right' : 'wrong';
  const diag = result === null ? null : payload.why[result.sel] ?? null;
  const selectedPick = sel === null ? null : sel + 1;

  return (
    <ProofSheet
      no={`${props.no}판`}
      track="t0"
      concept={plate.nameKo}
      code={plate.token ?? ''}
      kind={`${KIND_NAME[payload.kind]} · ${ROLE_NAME[plate.role]}`}
      source={`내 코드 <b>${payload.file}:${payload.focus}</b>`}
      ly={result === null ? [plate.layer, plate.layer] : result.layer}
      focusOnMount={props.payoff === null}
    >
      {plate.role === 'prereq' || plate.role === 'retry' ? (
        <Crumb
          depth={plate.role === 'prereq' ? '아래층' : '다시 찍기'}
          {...(plate.role === 'prereq' ? { onBack: props.onBack } : {})}
        />
      ) : null}

      {props.payoff === null ? null : <LinkPara payoff={props.payoff} focusOnMount />}

      <Ask q={payload.q} hint={payload.hint} />

      <CodePlate
        lines={payload.lines}
        pickable={pickable}
        selected={pickable ? selectedPick : null}
        answer={pickable && answered ? payload.answer + 1 : null}
        {...(payload.kind === 'blank' ? { hole: holeOf(result, options[sel ?? -1]?.t) } : {})}
        onPick={choose}
      />

      {pickable ? null : (
        <Choices
          options={options}
          selected={selectedPick}
          answer={answered ? payload.answer + 1 : null}
          onSelect={choose}
        />
      )}

      <FeedbackSlot
        state={state}
        {...(result === null
          ? {}
          : {
              stamp: result.correct
                ? { text: '정합', sub: 'in register', tone: 'pink' as const }
                : { text: '어긋남', sub: 'off register', tone: 'blue' as const },
              title: result.correct ? '맞았습니다' : '어긋났습니다',
              body: result.correct ? payload.ok : diag?.t,
              ...(diag?.edge ? { edge: diag.edge } : {}),
              rule: payload.rule,
              ...(payload.result ? { result: payload.result } : {}),
              gain: { from: result.layer[0], to: result.layer[1], text: result.gain },
            })}
      />

      {ladderOpen && ladder !== null ? (
        <ReprintLadder
          rung={props.rung}
          onRung={props.onRung}
          lyFrom={result?.layer[0] ?? plate.layer}
          lyTo={result?.layer[1] ?? plate.layer}
          card={ladder.card}
          prereqDone={plate.state?.prereqDone ?? []}
          nextWas={ladder.nextWas}
          onJump={(row) => props.onJumpPrereq(row.conceptId)}
          ask={{
            text: props.stuck,
            onText: props.onStuck,
            prompt: ladder.prompt,
            onBuild: () => props.onStuck(props.stuck),
            onCopy: props.onCopyPrompt,
          }}
        />
      ) : null}

      <Acts
        left={(
          <FlatButton variant="dunno" on={ladderOpen} onClick={props.onDunno}>
            모르겠어요 · 다시 찍기
          </FlatButton>
        )}
        hint={answered ? '<b>Space</b> 로 다음 판' : '<b>Enter</b> 로 확인'}
        right={answered ? (
          <PressButton tone="blue" onClick={props.onNext}>
            다음 <Kbd keys="Space" />
          </PressButton>
        ) : (
          <PressButton tone="pink" disabled={sel === null} onClick={() => sel !== null && props.onSubmit(sel)}>
            확인 <Kbd keys="Enter" />
          </PressButton>
        )}
      />
    </ProofSheet>
  );
}
