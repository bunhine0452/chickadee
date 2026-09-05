/**
 * T1 교정지 한 장 (05 §5·§7·§8 · 04 §4~§6). 세 화면이 한 판 안에 있다:
 * **필사 → 채점 결과 → 왜 게이트**. 목업 `t1.js` 의 `render`·`renderResult`·`renderWhy` 다.
 *
 * 규칙은 하나도 여기 없다 — 판정은 `session-flow.gradeT1Plate`, 원장은 `finishT1Plate` 가
 * 한다. 이 파일이 하는 일은 세 화면을 잇고 키를 받는 것뿐이다.
 */
import { FlatButton, Kbd, PressButton } from '@chickadee/ui';
import { canAppeal, checkWhy, type AssistCount, type Question, type T1Result } from '@chickadee/grading';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t, type MessageKey } from '@chickadee/i18n';

import { Acts } from '../../components/plate/Acts.js';
import { Ask } from '../../components/plate/Ask.js';
import { ProofSheet } from '../../components/plate/ProofSheet.js';
import { DiffFilter, type DiffFilterValue } from '../../components/t1/DiffFilter.js';
import { DiffRows, type DiffRow } from '../../components/t1/DiffRows.js';
import { EdStatus } from '../../components/t1/EdStatus.js';
import { RefPlate } from '../../components/t1/RefPlate.js';
import { ScoreCard } from '../../components/t1/ScoreCard.js';
import { SplitPane } from '../../components/t1/SplitPane.js';
import { Stepper } from '../../components/t1/Stepper.js';
import { WhyGate } from '../../components/t1/WhyGate.js';
import { useEditorAssist } from '../../data/settings.js';
import type { Plate } from '../../data/session.js';
import type { PlateResult } from '../../store.js';
import { askHint, askText, tagOf, whyOf, wrongCount } from './t1Copy.js';

/**
 * Monaco 는 T1 판을 걸 때만 내려온다 (05 §1.3 · §8). 1.2 MB 짜리 청크라 홈과 T0 은
 * 이것을 한 바이트도 싣지 않는다.
 */
const ClonePad = lazy(async () => {
  const mod = await import('../../components/t1/ClonePad.js');
  return { default: mod.ClonePad };
});

const ROLE_KEY = {
  review: 'session.roleReview', new: 'session.roleNew', retry: 'session.roleRetry',
  prereq: 'session.rolePrereq', manual: 'session.roleManual', gap: 'session.roleGap',
} as const satisfies Record<string, MessageKey>;

/** 판 머리의 역할 이름. 세 판이 같은 표를 쓴다. */
const roleName = (role: keyof typeof ROLE_KEY): string => t(ROLE_KEY[role]);

/** 지금 보고 있는 화면. 한 판 안에서만 움직이고 큐와는 무관하다. */
export type T1View = 'edit' | 'result' | 'why';

export interface T1PlateProps {
  plate: Plate;
  no: number;
  result: PlateResult | null;
  theme: 'light' | 'dark';
  /** 채점 결과와 왜 문항. 아직 채점 전이면 `null`. */
  graded: { result: T1Result; question: Question } | null;
  view: T1View;
  onView: (view: T1View) => void;
  stage: 1 | 2 | 3;
  draft: string;
  onDraft: (draft: string) => void;
  peeks: number;
  onPeek: (on: boolean) => void;
  peeking: boolean;
  /**
   * 이 판의 글자가 어디서 왔나 (D143). `peeks` 와 같은 규칙 — **감점 없음, 기록만.**
   *
   * 둘 다 선택이다. 값이 없으면 이 판이 자기 안에서만 세고(화면에는 그대로 보인다),
   * 있으면 `ItemState.assist` 로 이어진다 — 그 저장·복원 배선은 `data/session.ts` 의 몫이다.
   */
  assist?: AssistCount | undefined;
  onAssist?: ((next: AssistCount) => void) | undefined;
  ticks: Readonly<Record<number, '' | 'exact' | 'equiv' | 'differ'>>;
  onLeaveLine: (index: number, text: string) => void;
  onGrade: () => void;
  onDowngrade: () => void;
  savedAt: number | null;
  appealed: readonly number[];
  onAppeal: (oi: number) => void;
  why: { text: string; pick: number | null };
  onWhyText: (text: string) => void;
  onWhyPick: (index: number) => void;
  onFinish: () => void;
}

export function T1Plate(props: T1PlateProps): React.JSX.Element | null {
  const { plate, graded } = props;
  const payload = plate.payload.track === 't1' ? plate.payload : null;
  const [filter, setFilter] = useState<DiffFilterValue>('ne');
  const [revealed, setRevealed] = useState(false);
  const [assist, setAssist] = useState<AssistCount | undefined>(props.assist);
  const editorAssist = useEditorAssist();
  const curLine = useRef(0);

  const original = useMemo(() => payload?.original ?? [], [payload]);
  const whyLine = graded === null ? 0 : graded.question.line;
  const whyOrig = (original[whyLine] ?? '').trim();
  const check = useMemo(
    () => checkWhy(props.why.text, whyOrig),
    [props.why.text, whyOrig],
  );

  const rows: DiffRow[] = useMemo(() => {
    if (graded === null) return [];
    const user = props.draft.split('\n');
    return graded.result.rows.map((row) => ({
      oi: row.oi,
      ui: row.ui,
      status: row.status,
      original: row.oi >= 0 ? (original[row.oi] ?? '') : null,
      user: row.ui >= 0 ? (user[row.ui] ?? '') : null,
      tag: tagOf(row),
      why: whyOf(row),
      canAppeal: canAppeal(row),
      appealed: row.oi >= 0 && props.appealed.includes(row.oi),
    }));
  }, [graded, props.draft, props.appealed, original]);

  // 05 §7 — 결과에서 `Enter` 는 「왜」로, 왜에서 `Enter`(10자 이상)는 저장하고 마치기.
  // 편집 중의 `⌘↵`·`⌘.`·`` ` `` 는 에디터가 받는다(05 §8) — 여기서 또 받으면 두 번 돈다.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.isComposing || e.altKey) return;
      // 판을 걸면 포커스가 `article.ps` 에 있고, 아무것도 잡지 않았으면 `e.target` 이
      // `document` 다 — `Element` 가 아니라 `closest` 가 없다.
      const target = e.target instanceof Element ? e.target : null;
      const inText = target?.closest('textarea, input, .monaco-editor') != null;

      if (props.view === 'result' && e.code === 'Enter' && !inText) {
        e.preventDefault();
        props.onView('why');
        return;
      }
      if (props.view === 'why' && e.code === 'Enter' && !e.shiftKey && check.ok) {
        e.preventDefault();
        props.onFinish();
        return;
      }
      // 05 §7 — 에디터 밖에서 `Enter` 는 에디터로 들어간다.
      if (props.view === 'edit' && e.code === 'Enter' && !inText) {
        e.preventDefault();
        document.querySelector<HTMLElement>('.editor textarea, .monaco-editor textarea')?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [props, check.ok]);

  const leaveLine = useCallback((index: number, text: string) => {
    curLine.current = index;
    props.onLeaveLine(index, text);
  }, [props]);

  if (payload === null) return null;

  const lines = props.draft.split('\n').filter((l) => l.trim() !== '').length;
  const ly = props.result === null ? [plate.layer, plate.layer] as const : props.result.layer;

  return (
    <ProofSheet
      no={t('session.plateNo', { n: String(props.no) })}
      track="t1"
      concept={t('session.conceptTranscribe', { name: plate.nameKo })}
      code={plate.token ?? payload.fn}
      kind={t('session.stageAndRole', {
        stage: String(props.stage),
        role: roleName(plate.role),
      })}
      source={t('session.sourceT1', {
        file: payload.file,
        fn: payload.fn,
        lines: String(original.length),
      })}
      ly={ly}
      width="wide"
    >
      <Stepper stage={props.stage} />

      {props.view === 'edit' ? (
        <>
          <Ask q={askText(props.stage)} hint={askHint()} />
          <SplitPane
            left={(
              <RefPlate
                original={original}
                stage={props.stage}
                show={payload.show2}
                peek={props.peeking}
                curLine={curLine.current}
              />
            )}
            right={(
              <>
                <Suspense fallback={<div className="editor" aria-busy="true" />}>
                  <ClonePad
                    /*
                     * 1단계는 textarea 다 (05 §8 마지막 문단 · D93). WKWebView 실측
                     * `t1:monaco` **314 ms**(n=2)가 예산 250 ms 를 넘겼고, 05 §8 이 그 경우에
                     * 밟으라고 미리 적어 둔 단이 이것이다. 「보고 치기」는 원본이 바로 옆에
                     * 있어 구문 색이 할 일이 가장 적은 단계이기도 하다.
                     */
                    fallback={props.stage === 1}
                    value={props.draft}
                    stage={props.stage}
                    grammar={grammarOf(payload.file)}
                    theme={props.theme}
                    ticks={props.ticks}
                    onChange={props.onDraft}
                    onLeaveLine={leaveLine}
                    onPeek={props.onPeek}
                    onGrade={props.onGrade}
                    onDown={props.onDowngrade}
                    editorAssist={editorAssist}
                    assistSeed={props.assist}
                    onAssist={(next) => {
                      setAssist(next);
                      props.onAssist?.(next);
                    }}
                  />
                </Suspense>
                <EdStatus
                  lines={lines}
                  savedAt={props.savedAt}
                  peeks={props.peeks}
                  assist={assist}
                />
              </>
            )}
          />
          <Acts
            left={(
              <FlatButton variant="dunno" on={props.peeking} onHold={props.onPeek}>
                {t('session.dunnoPeek')} <Kbd keys="`" />
              </FlatButton>
            )}
            hint={t('clone.editHint')}
            right={(
              <PressButton tone="pink" onClick={props.onGrade}>
                {t('session.grade')} <Kbd keys="⌘↵" />
              </PressButton>
            )}
          />
        </>
      ) : null}

      {props.view === 'result' && graded !== null ? (
        <>
          <ScoreCard
            total={graded.result.total}
            meaning={graded.result.meaning}
            exact={graded.result.n.exact}
            equiv={graded.result.n.equiv}
            wrong={wrongCount(graded.result.n)}
            verdict={graded.result.verdict}
          />
          <DiffFilter value={filter} onChange={setFilter} />
          <DiffRows
            rows={rows}
            filter={filter}
            onAppeal={(index) => {
              const row = rows[index];
              if (row !== undefined && row.oi >= 0) props.onAppeal(row.oi);
            }}
          />
          <Acts
            left={(
              <FlatButton ghost onClick={() => props.onView('edit')}>
                {t('clone.backToEditor')}
              </FlatButton>
            )}
            hint={props.appealed.length > 0
              ? t('clone.appealHeld', { n: String(props.appealed.length) })
              : t('clone.peekHint', { n: String(props.peeks) })}
            right={(
              <PressButton tone="blue" onClick={() => props.onView('why')}>
                {t('clone.nextWhy')} <Kbd keys="Enter" />
              </PressButton>
            )}
          />
        </>
      ) : null}

      {props.view === 'why' && graded !== null ? (
        <>
          <WhyGate
            q={graded.question.q}
            help={graded.question.help}
            orig={whyOrig}
            text={props.why.text}
            onText={props.onWhyText}
            count={check}
            choices={graded.question.choices}
            pick={props.why.pick}
            onPick={props.onWhyPick}
            onReveal={() => setRevealed(true)}
            revealed={revealed || props.why.pick !== null}
          />
          <Acts
            left={(
              <FlatButton ghost onClick={() => props.onView('result')}>
                {t('clone.backToResult')}
              </FlatButton>
            )}
            hint={t('clone.whyHint')}
            right={(
              <PressButton tone="pink" disabled={!check.ok} onClick={props.onFinish}>
                {t('clone.saveAndFinish')} <Kbd keys="Enter" />
              </PressButton>
            )}
          />
        </>
      ) : null}
    </ProofSheet>
  );
}

/**
 * 경로 확장자 → **Monaco 언어 id**.
 *
 * `session-flow.grammarOf` 와 **같은 표가 아니다.** 저쪽은 tree-sitter 문법 키(D19)라
 * `.tsx` 에 `'tsx'` 를 주는 것이 맞지만, Monaco 0.52 에는 `'tsx'` 라는 언어 id 가 없다 —
 * `basic-languages/typescript` 가 등록하는 것은 `'typescript'` 하나다. 등록 안 된 id 로
 * `setModelLanguage` 를 부르면 모델이 plaintext 가 되어 **React 파일 필사의 2·3단계
 * 구문 색이 통째로 죽는다.** 두 표를 「같다」고 적어 두었던 것이 이 버그의 출처다.
 *
 * 낼 수 있는 id 는 `ClonePad.tsx` 가 싣는 `basic-languages` 여섯뿐이다.
 */
export function grammarOf(path: string): string {
  const ext = path.slice(path.lastIndexOf('.'));
  if (ext === '.tsx' || ext === '.jsx') return 'typescript';
  if (ext === '.ts' || ext === '.mts' || ext === '.cts') return 'typescript';
  if (ext === '.js' || ext === '.mjs' || ext === '.cjs') return 'javascript';
  if (ext === '.py') return 'python';
  if (ext === '.go') return 'go';
  if (ext === '.rs') return 'rust';
  if (ext === '.sql') return 'sql';
  return 'typescript';
}
