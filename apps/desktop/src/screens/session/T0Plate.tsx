/**
 * T0 교정지 한 장 (05 §5 · 04 §1~§2). 컴포넌트를 조립하고 키를 받는 곳이며,
 * 규칙은 하나도 여기 없다 — 판정은 `session-flow.answerPlate` 가 한다.
 *
 * 「고르기 → Enter → Space」 세 번이면 판 한 장이 끝난다(정본 §3-8). 키는 전부 `e.code` 다.
 */
import { FlatButton, Kbd, PressButton } from '@chickadee/ui';
import { useCallback, useEffect, useState } from 'react';
import { t, type MessageKey } from '@chickadee/i18n';

import { Acts } from '../../components/plate/Acts.js';
import { Ask } from '../../components/plate/Ask.js';
import { Choices } from '../../components/plate/Choices.js';
import { CoachBand, type CoachStep } from '../../components/plate/CoachBand.js';
import { CodePlate, type CodePlateProps } from '../../components/plate/CodePlate.js';
import type { HoleState } from '../../components/plate/Hole.js';
import { Crumb } from '../../components/plate/Crumb.js';
import { FeedbackSlot, type FeedbackState } from '../../components/plate/FeedbackSlot.js';
import type { LiferNoteProps } from '../../components/plate/LiferNote.js';
import { LinkPara } from '../../components/plate/LinkPara.js';
import { ProofSheet } from '../../components/plate/ProofSheet.js';
import { ReprintLadder, type RungNo } from '../../components/session/ReprintLadder.js';
import type { LadderData } from '../../data/ladder.js';
import { focusOrFallback } from '../../components/session/focus.js';
import type { Plate } from '../../data/session.js';
import type { PlateResult } from '../../store.js';

const KIND_KEY = {
  point: 'session.kindPoint', blank: 'session.kindBlank', meaning: 'session.kindMeaning',
} as const satisfies Record<string, MessageKey>;

const ROLE_KEY = {
  review: 'session.roleReview', new: 'session.roleNew', retry: 'session.roleRetry',
  prereq: 'session.rolePrereq', manual: 'session.roleManual', gap: 'session.roleGap',
} as const satisfies Record<string, MessageKey>;

/** 판 머리의 역할 이름. 세 판이 같은 표를 쓴다. */
const roleName = (role: keyof typeof ROLE_KEY): string => t(ROLE_KEY[role]);

export interface T0PlateProps {
  plate: Plate;
  no: number;
  result: PlateResult | null;
  /** 아래층에서 돌아온 직후면 「이어보기」 문단이 열린다 (02 §4). */
  payoff: string | null;
  /** 이 개념을 처음 기록한 판이면 판정란 안에 그 기록이 남는다 (D131). */
  lifer: LiferNoteProps | null;
  /** 첫 판을 함께 걷는 안내 띠 (D134). 이 리포의 첫 세션 첫 판에서만 참이다. */
  coach: boolean;
  /**
   * 0장 판 위에 미리 펴는 사전 한 줄 (D138). **0장 대지의 판에서만** 값이 있다 —
   * 전역으로 켜면 정본 §1 「가치는 설명이 아니라 강제된 능동 출력」과 부딪친다.
   * 정답을 누설하는 한 줄은 `readFirstText` 가 이미 걸러 `null` 로 온다.
   */
  readFirst: string | null;
  ladder: LadderData | null;
  ladderOpen: boolean;
  rung: RungNo;
  stuck: string;
  /** 4단이 내놓은 프롬프트. 「프롬프트 만들기」를 누르기 전에는 빈 문자열이다. */
  prompt: string;
  onRung: (rung: RungNo) => void;
  onStuck: (text: string) => void;
  onBuildPrompt: () => void;
  onCopyPrompt: () => void;
  onDunno: () => void;
  onJumpPrereq: (conceptId: string, previewSiteId: number | null) => void;
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
   * 깨진다). 그래서 다음 동작 버튼으로 옮긴다. 판정문은 오버레이의 `.vh#live` 가 읽으므로
   * 포커스가 옮겨져도 읽히는 것은 같다 (05 §7 · D114).
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
        // 사다리 안에서 `?` 로 접으면 포커스가 사라진 요소와 함께 `<body>` 로 떨어진다 —
        // `SessionOverlay` 의 Escape 갈래가 `.dunno` 로 돌려보내는 것과 대칭이 빠져 있었다
        // (D111). 05 §9 의 「포커스 유실」 게이트가 그 순간 깨진다.
        const inside = target?.closest('.reprint') != null;
        props.onDunno();
        if (inside) {
          requestAnimationFrame(() => {
            focusOrFallback(document.querySelector('.dunno'), '.proof');
          });
        }
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
      no={t('session.plateNo', { n: String(props.no) })}
      track="t0"
      concept={plate.nameKo}
      code={plate.token ?? ''}
      kind={t('session.kindAndRole', {
        kind: t(KIND_KEY[payload.kind]),
        role: roleName(plate.role),
      })}
      source={t('session.sourceT0', {
        file: payload.file,
        focus: String(payload.focus),
      })}
      ly={result === null ? [plate.layer, plate.layer] : result.layer}
      focusOnMount={props.payoff === null}
    >
      {plate.role === 'prereq' || plate.role === 'retry' ? (
        <Crumb
          depth={plate.role === 'prereq' ? 'prereq' : 'reprint'}
          {...(plate.role === 'prereq' ? { onBack: props.onBack } : {})}
        />
      ) : null}

      {props.payoff === null ? null : <LinkPara payoff={props.payoff} focusOnMount />}

      {/* 걸음은 사용자가 무엇을 했는지로만 정해진다 — 넘기기 버튼도 타이머도 없다 (D134). */}
      {!props.coach ? null : (
        <CoachBand step={(answered ? 3 : sel === null ? 1 : 2) satisfies CoachStep} />
      )}

      {/* 문제보다 먼저 읽는 한 줄 (D138). 이 언어가 처음이면 읽을 것을 얻으려고 먼저
          막혀야 하는데, 0장 대지의 판에서만 그 순서를 뒤집는다. */}
      {props.readFirst === null ? null : (
        <p className="note read-first">{props.readFirst}</p>
      )}

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
                ? { text: t('session.exact'), tone: 'pink' as const }
                : { text: t('session.differ'), tone: 'blue' as const },
              title: result.correct ? t('session.right') : t('session.wrong'),
              body: result.correct ? payload.ok : diag?.t,
              ...(diag?.edge ? { edge: diag.edge } : {}),
              rule: payload.rule,
              ...(payload.result ? { result: payload.result } : {}),
              gain: { from: result.layer[0], to: result.layer[1], text: result.gain },
              ...(props.lifer === null ? {} : { lifer: props.lifer }),
            })}
      />

      {ladderOpen && ladder !== null ? (
        <ReprintLadder
          rung={props.rung}
          onRung={props.onRung}
          lyFrom={result?.layer[0] ?? ladder.ly.from}
          lyTo={result?.layer[1] ?? ladder.ly.to}
          card={ladder.card}
          prereqDone={plate.state?.prereqDone ?? []}
          {...(ladder.nextWas === undefined ? {} : { nextWas: ladder.nextWas })}
          onJump={(row) => props.onJumpPrereq(row.conceptId, row.previewSiteId ?? null)}
          ask={{
            text: props.stuck,
            onText: props.onStuck,
            prompt: props.prompt,
            onBuild: props.onBuildPrompt,
            onCopy: props.onCopyPrompt,
          }}
        />
      ) : null}

      <Acts
        left={(
          <FlatButton variant="dunno" on={ladderOpen} onClick={props.onDunno}>
            {t('session.dunnoReprint')}
          </FlatButton>
        )}
        hint={answered ? t('session.hintNextPlate') : t('session.hintConfirm')}
        right={answered ? (
          <PressButton tone="blue" onClick={props.onNext}>
            {t('session.next')} <Kbd keys="Space" />
          </PressButton>
        ) : (
          <PressButton tone="pink" disabled={sel === null} onClick={() => sel !== null && props.onSubmit(sel)}>
            {t('session.confirm')} <Kbd keys="Enter" />
          </PressButton>
        )}
      />
    </ProofSheet>
  );
}
