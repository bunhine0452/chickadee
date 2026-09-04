/**
 * 코스의 교정지 한 장 (`clone-screen-plate`).
 *
 * **판 내부를 다시 짓지 않는다** — `components/t1` 의 `ClonePad`·`RefPlate`·`Stepper`·
 * `SplitPane`·`EdStatus`·`ScoreCard`·`DiffFilter`·`DiffRows` 와 `components/plate` 의
 * `ProofSheet`·`Ask`·`Acts` 를 세션 화면과 **같은 방식으로** 조립한다. `CoursePlate.payload`
 * 가 `T1Payload` 그대로인 것이 그 재사용의 근거다.
 *
 * 세션의 `T1Plate` 를 그대로 쓰지 않는 이유는 하나다: 저 판은 **왜 게이트**를 지나야 끝나고
 * (`result` → `why` → `onFinish`), 코스에는 왜 게이트가 없다(04 §6 은 큐의 것이고
 * `gradeCourseStep` 은 왜 답안을 받지 않는다). 판을 두 걸음(필사 → 결과)으로 줄인 자리가
 * 여기이고, 그 밖의 모든 조각은 세션이 쓰는 그 컴포넌트다.
 */
import { t } from '@chickadee/i18n';
import type { AssistCount, T1Result } from '@chickadee/grading';
import { FlatButton, Kbd, PressButton, RichText } from '@chickadee/ui';
import { Suspense, lazy, useMemo, useRef, useState } from 'react';

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
import { useEditorAssist } from '../../data/settings.js';
import { askHint, askText, tagOf, whyOf, wrongCount } from '../session/t1Copy.js';
import type { CoursePlate } from './data.js';

/** Monaco 는 판을 걸 때만 내려온다 (05 §1.3) — 목차만 보는 프레임은 1.2 MB 를 안 싣는다. */
const ClonePad = lazy(async () => {
  const mod = await import('../../components/t1/ClonePad.js');
  return { default: mod.ClonePad };
});

/**
 * 경로 확장자 → **Monaco 언어 id**. `T1Plate.grammarOf` 와 같은 표다.
 *
 * tree-sitter 문법 키(`session-flow.grammarOf`)와는 다른 표다 — Monaco 0.52 에 `'tsx'`
 * 언어 id 는 없다. 자세한 근거는 `T1Plate.grammarOf` 의 주석.
 */
export function monacoLang(path: string): string {
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

export type CourseView = 'edit' | 'result';

export interface CoursePlateViewProps {
  plate: CoursePlate;
  /** 대표 개념 이름. 사전이 아는 문법이 조각에 없으면 `null`. */
  conceptName: string | null;
  /** [걸 때의 겹, 지금 겹]. 채점 전에는 둘이 같다. */
  ly: readonly [0 | 1 | 2 | 3 | 4, 0 | 1 | 2 | 3 | 4];
  theme: 'light' | 'dark';
  view: CourseView;
  onView: (view: CourseView) => void;
  graded: T1Result | null;
  draft: string;
  onDraft: (draft: string) => void;
  ticks: Readonly<Record<number, '' | 'exact' | 'equiv' | 'differ'>>;
  onLeaveLine: (index: number, text: string) => void;
  peeks: number;
  peeking: boolean;
  onPeek: (on: boolean) => void;
  /** 이 조각의 글자가 어디서 왔나 (D143). 감점 없음 — `T1Plate` 와 같은 계약이다. */
  assist?: AssistCount | undefined;
  onAssist?: ((next: AssistCount) => void) | undefined;
  savedAt: number | null;
  onGrade: () => void;
  onDowngrade: () => void;
  /** 목차에 남은 조각이 없으면 오른쪽 단추가 「코스 마치기」가 된다. */
  last: boolean;
  onNext: () => void;
  /** 재인제스트로 이 파일을 다시 자른 직후인가 (`clone-resume-stale`). */
  recut: boolean;
}

export function CoursePlateView(props: CoursePlateViewProps): React.JSX.Element {
  const { plate } = props;
  const payload = plate.payload;
  const [filter, setFilter] = useState<DiffFilterValue>('ne');
  const [assist, setAssist] = useState<AssistCount | undefined>(props.assist);
  const editorAssist = useEditorAssist();
  const curLine = useRef(0);

  const rows: DiffRow[] = useMemo(() => {
    if (props.graded === null) return [];
    const user = props.draft.split('\n');
    return props.graded.rows.map((row) => ({
      oi: row.oi,
      ui: row.ui,
      status: row.status,
      original: row.oi >= 0 ? (payload.original[row.oi] ?? '') : null,
      user: row.ui >= 0 ? (user[row.ui] ?? '') : null,
      tag: tagOf(row),
      why: whyOf(row),
      // 코스에는 이의 루프가 없다 (04 §5 는 큐의 것이다). `gradeCourseStep` 이 이의를
      // 받지 않으므로 단추를 내면 눌러도 아무 데도 가지 않는 단추가 된다.
      canAppeal: false,
      appealed: false,
    }));
  }, [props.graded, props.draft, payload.original]);

  const lines = props.draft.split('\n').filter((l) => l.trim() !== '').length;

  return (
    <ProofSheet
      no={t('course.plateNo', {
        seq: String(plate.step.seq + 1), part: String(plate.step.part + 1),
      })}
      track="t1"
      concept={props.conceptName === null
        ? t('course.noConcept')
        : t('session.conceptTranscribe', { name: props.conceptName })}
      code={payload.fn}
      kind={t('course.plateKind', { stage: String(plate.stage) })}
      source={t('course.plateSource', {
        file: payload.file,
        from: String(plate.step.line_start),
        to: String(plate.step.line_end),
      })}
      ly={props.ly}
      width="wide"
      focusOnMount={false}
    >
      <Stepper stage={plate.stage} />

      {props.recut ? <p className="course-note">{t('course.recut')}</p> : null}
      {plate.conceptId === null ? (
        <p className="course-note">{t('course.noConceptNote')}</p>
      ) : null}

      {props.view === 'edit' ? (
        <>
          <Ask q={askText(plate.stage)} hint={askHint()} />
          <SplitPane
            left={(
              <RefPlate
                original={payload.original}
                stage={plate.stage}
                show={payload.show2}
                peek={props.peeking}
                curLine={curLine.current}
              />
            )}
            right={(
              <>
                <Suspense fallback={<div className="editor" aria-busy="true" />}>
                  <ClonePad
                    value={props.draft}
                    stage={plate.stage}
                    grammar={monacoLang(payload.file)}
                    theme={props.theme}
                    ticks={props.ticks}
                    onChange={props.onDraft}
                    onLeaveLine={(index, text) => {
                      curLine.current = index;
                      props.onLeaveLine(index, text);
                    }}
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

      {props.view === 'result' && props.graded !== null ? (
        <>
          <ScoreCard
            total={props.graded.total}
            meaning={props.graded.meaning}
            exact={props.graded.n.exact}
            equiv={props.graded.n.equiv}
            wrong={wrongCount(props.graded.n)}
            verdict={props.graded.verdict}
          />
          <DiffFilter value={filter} onChange={setFilter} />
          <DiffRows rows={rows} filter={filter} onAppeal={() => undefined} />
          <Acts
            left={(
              <FlatButton ghost onClick={() => props.onView('edit')}>
                {t('clone.backToEditor')}
              </FlatButton>
            )}
            hint={t('clone.peekHint', { n: String(props.peeks) })}
            right={(
              <PressButton tone="blue" onClick={props.onNext}>
                {props.last ? t('course.nextLast') : t('course.next')} <Kbd keys="Enter" />
              </PressButton>
            )}
          />
        </>
      ) : null}
    </ProofSheet>
  );
}

/** 코스를 끝까지 마쳤을 때. 요약은 두지 않는다 — 겹의 이동은 이미 원장에 남았다. */
export function CourseDone({ n, onBack }: { n: number; onBack: () => void }) {
  return (
    <div className="course-done">
      <h2>{t('course.doneTitle')}</h2>
      <RichText as="p" html={t('course.doneBody', { n: String(n) })} />
      <PressButton onClick={onBack}>{t('course.doneBack')}</PressButton>
    </div>
  );
}
