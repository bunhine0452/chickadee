/**
 * `drill` — 작은 문제 한 판 (D186 ⑧ · D187 ①).
 *
 * 0부에서 **값을 적던** 사람이 여기서 **프로그램을 쓴다.** 지문 · 코드 창 · 케이스 표가
 * 한 화면에 있고, `⌘↵` 하나로 케이스마다 실제로 돌아간다.
 *
 * ## 다른 판과 다른 것 셋
 *
 * ① **답하고도 계속 고친다.** 다른 판은 한 번 채점하면 끝이고 판정란이 답을 편다. 여기서는
 *    틀린 뒤에 고쳐서 다시 돌리는 것이 **곧 학습**이라 코드 창이 안 잠긴다. 잠기는 것은
 *    전부 통과한 뒤 하나뿐이고, 그때부터 `Space` 가 다음 판으로 간다.
 * ② **판정이 표다.** 「몇 개 맞았다」가 아니라 **어느 입력에서 무엇이 나왔는지**가 결과다.
 *    그 표가 없으면 학습자가 다음에 무엇을 고칠지 모른다.
 * ③ **게이트가 없다.** 러너가 없으면 이 판은 채점에서 빠지고 화면이 **어느 언어가 이
 *    컴퓨터에 없는지** 말한다 — 설치를 권하지 않는다 (D186 ④ · 정본 §5 ①).
 *
 * 겹은 판 머리에 보이되 **이 판이 올리지 않는다.** 진도 축은 0부·1부의 개념이고 이 층은
 * 그 사이에 끼는 연습이다 — 보이는 값은 이 문제가 딛는 첫 개념의 겹이다.
 */
import type { BuildItem, DrillItem } from '@chickadee/cards';
import { t, type MessageKey } from '@chickadee/i18n';
import type { InkLayer } from '@chickadee/ui';
import { Kbd, PressButton, FlatButton, RichText } from '@chickadee/ui';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { Acts } from '../../components/plate/Acts.js';
import { FeedbackSlot, type FeedbackState } from '../../components/plate/FeedbackSlot.js';
import { ProofSheet } from '../../components/plate/ProofSheet.js';
import { Ask } from '../../components/plate/Ask.js';
import { MONACO_LANGUAGES } from '../../components/t1/monacoOptions.js';
import type { BuildVerdict, CaseOut } from '@chickadee/grading';
import type { DrillView } from '../../data/runner.js';
import { reasonKey } from '../../data/runner.js';
import { usePlateKeys } from './keys.js';
import './DrillPlate.css';

const ClonePad = lazy(async () => {
  const mod = await import('../../components/t1/ClonePad.js');
  return { default: mod.ClonePad };
});

/** 이 환경에 Monaco 를 내릴 수 없으면 textarea 판이다 (05 §8 마지막 문단). */
const FALLBACK =
  typeof window === 'undefined' ||
  typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === 'undefined';

const noop = (): void => undefined;

/** `ClonePad` 가 싣는 일곱 밖의 id 를 주면 모델이 조용히 plaintext 가 된다 (05 §8). */
function grammarOf(grammar: string): string {
  return (MONACO_LANGUAGES as readonly string[]).includes(grammar) ? grammar : 'typescript';
}

/** 표에 실을 수 있게 보이지 않는 글자를 보이게. 케이스 입력은 대개 개행으로 끝난다. */
export function showText(text: string): string {
  const s = text.replace(/\n/gu, '⏎').replace(/\t/gu, '⇥');
  return s === '' ? t('drill.blankOut') : s;
}

const MARK: Readonly<Record<CaseOut['status'], string>> = {
  passed: 'drill.markPass',
  failed: 'drill.markFail',
  timeout: 'drill.markTimeout',
  skipped: 'drill.markSkipped',
};

/** 판정란의 제목·본문. 상태마다 **한 문장**이고, 「왜」는 표가 말한다. */
export function verdictText(view: DrillView, total: number): { title: string; body: string } | null {
  switch (view.kind) {
    case 'passed':
      return { title: t('session.right'), body: t('drill.passed', { n: String(total) }) };
    case 'failed':
      return {
        title: t('session.wrong'),
        body: t('drill.failed', { failed: String(view.failed), passed: String(view.passed) }),
      };
    case 'timeout':
      return { title: t('session.wrong'), body: t('drill.timeout') };
    case 'compile-error':
      return { title: t('session.wrong'), body: t('drill.compileError') };
    case 'no-runner':
      return { title: t('drill.none'), body: t(reasonKey(view.reason)) };
    default:
      return null;
  }
}

/** 결과가 있는 상태면 케이스 줄을, 아니면 아직 안 돌린 빈 줄을. */
function rowsOf(item: DrillItem, view: DrillView): readonly CaseOut[] {
  if (view.kind === 'passed' || view.kind === 'failed' || view.kind === 'timeout') return view.cases;
  return item.cases.map((c) => ({
    name: c.name, stdin: c.stdin, expected: c.stdout, actual: '', stderr: '',
    status: 'skipped' as const, durationMs: 0,
  }));
}

export interface DrillPlateProps {
  item: DrillItem;
  no: number;
  /** 이 문제가 딛는 첫 개념의 겹. **이 판이 올리지 않는다.** */
  layer: InkLayer;
  theme: 'light' | 'dark';
  view: DrillView;
  stuckOpen: boolean;
  onRun: (source: string) => void;
  onNext: () => void;
  onDunno: () => void;
  after?: React.ReactNode;
}

export function DrillPlate(props: DrillPlateProps): React.JSX.Element {
  const { item, view } = props;
  const [draft, setDraft] = useState(item.starter);

  useEffect(() => {
    setDraft(item.starter);
  }, [item.id, item.starter]);

  // 전부 통과한 뒤에만 잠긴다 — 틀린 뒤에 고쳐서 다시 돌리는 것이 이 층의 학습이다.
  const done = view.kind === 'passed';
  const busy = view.kind === 'running';
  const run = useCallback(() => {
    if (done || busy) return;
    props.onRun(draft);
  }, [done, busy, draft, props]);

  usePlateKeys({
    answered: done,
    canSubmit: true,
    onSubmit: run,
    onGrade: run,
    onNext: props.onNext,
    onDunno: props.onDunno,
  });

  const said = verdictText(view, item.cases.length);
  const state: FeedbackState = said === null ? 'idle' : view.kind === 'passed' ? 'right' : 'wrong';
  const rows = rowsOf(item, view);
  const log = view.kind === 'failed' || view.kind === 'timeout' || view.kind === 'compile-error' ? view.log : '';

  return (
    <ProofSheet
      no={t('chapter.plateNo', { n: String(props.no) })}
      track="t0"
      concept={t('drill.title')}
      code={item.drillId}
      kind={t('drill.langNote', { lang: item.langName })}
      source={t('drill.source', { id: item.drillId })}
      ly={[props.layer, props.layer]}
      width="wide"
    >
      <Ask q={item.statement} hint={t('drill.needs', { ids: item.needs.join(' · ') })} />

      {done ? (
        <pre className="dr-mine"><code>{draft}</code></pre>
      ) : (
        <Suspense fallback={<div className="editor" aria-busy="true" />}>
          <ClonePad
            fallback={FALLBACK}
            value={draft}
            stage={3}
            grammar={grammarOf(item.grammar)}
            theme={props.theme}
            ticks={{}}
            onChange={setDraft}
            onLeaveLine={noop}
            onPeek={noop}
            onGrade={run}
            onDown={noop}
            editorAssist="off"
            ariaLabel={t('drill.editorLabel')}
            focusOnMount
          />
        </Suspense>
      )}

      <div className="dr-wrap">
        <table className="dr-cases">
          <caption className="dr-cap">{t('drill.caseTable')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('drill.colCase')}</th>
              <th scope="col">{t('drill.colIn')}</th>
              <th scope="col">{t('drill.colWant')}</th>
              <th scope="col">{t('drill.colGot')}</th>
              <th scope="col">{t('drill.colMark')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className={row.status === 'failed' ? 'miss' : undefined}>
                <th scope="row">{row.name}</th>
                <td><code>{showText(row.stdin)}</code></td>
                <td><code>{showText(row.expected)}</code></td>
                <td><code>{said === null ? '' : showText(row.actual)}</code></td>
                <td className={`dr-mark dr-${row.status}`}>
                  {said === null ? t('drill.markIdle') : t(MARK[row.status] as 'drill.markPass')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {log === '' ? null : (
        <details className="dr-log">
          <summary>{t('drill.logLabel')}</summary>
          <pre><code>{log}</code></pre>
        </details>
      )}

      <FeedbackSlot
        state={state}
        {...(said === null ? {} : { title: said.title, body: said.body })}
        {...(view.kind === 'no-runner' ? { rule: t('drill.noneHint') } : {})}
      />

      {props.after ?? null}

      <Acts
        left={(
          <FlatButton variant="dunno" on={props.stuckOpen} onClick={props.onDunno}>
            {t('chapter.dunno')}
          </FlatButton>
        )}
        hint={done ? t('drill.hintNext') : t('drill.hint')}
        right={done ? (
          <PressButton tone="blue" onClick={props.onNext}>
            {t('session.next')} <Kbd keys="Space" />
          </PressButton>
        ) : (
          <PressButton tone="pink" onClick={run} disabled={busy}>
            {busy ? t('drill.running') : said === null ? t('drill.run') : t('drill.again')}{' '}
            <Kbd keys="⌘↵" />
          </PressButton>
        )}
      />

      {view.kind === 'passed' || view.kind === 'failed' || view.kind === 'timeout' ? (
        <p className="note dr-took">
          <RichText html={t('drill.took', { ms: String(view.durationMs) })} />
        </p>
      ) : null}
    </ProofSheet>
  );
}

/**
 * `build` — 같은 껍데기, 칸 하나 (D187 ① · `fundamentals.md` §2.3).
 *
 * 작은 문제 판과 한 파일에 있는 이유는 **같은 러너를 탄다**는 것이 이 둘의 공통점이라서다.
 * 다른 것은 묻는 모양뿐 — 저쪽은 프로그램 한 장이고 이쪽은 식 한 줄이다. 그래서 코드 창
 * 대신 칸 하나이고, 케이스 표 대신 **나와야 하는 값 한 줄**이다.
 */
export type BuildView =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'done'; verdict: BuildVerdict };

/** 판정란의 제목·본문. 진단문은 채점기가 고른 키를 i18n 이 채운다. */
export function buildVerdictText(v: BuildVerdict, missing: readonly string[]): { title: string; body: string } {
  if (v.ok) return { title: t('session.right'), body: t('drill.buildPrinted', { printed: v.printed ?? '' }) };
  if (v.reason !== null) return { title: t('drill.none'), body: t(reasonKey(v.reason)) };
  const key = (v.diagKey ?? 'drill.buildMissValue') as MessageKey;
  return { title: t('session.wrong'), body: t(key, { ids: missing.join(', ') }) };
}

export interface BuildPlateProps {
  item: BuildItem;
  no: number;
  /** 이 과제가 굽히는 첫 개념의 겹. **이 판이 올리지 않는다.** */
  layer: InkLayer;
  view: BuildView;
  stuckOpen: boolean;
  onRun: (expr: string) => void;
  onNext: () => void;
  onDunno: () => void;
  after?: React.ReactNode;
}

export function BuildPlate(props: BuildPlateProps): React.JSX.Element {
  const { item, view } = props;
  const [expr, setExpr] = useState('');

  useEffect(() => {
    setExpr('');
  }, [item.id]);

  const done = view.kind === 'done' && view.verdict.ok;
  const busy = view.kind === 'running';
  const run = useCallback(() => {
    if (done || busy) return;
    props.onRun(expr);
  }, [done, busy, expr, props]);

  usePlateKeys({
    answered: done,
    canSubmit: expr.trim() !== '',
    onSubmit: run,
    onGrade: run,
    onNext: props.onNext,
    onDunno: props.onDunno,
  });

  const said = view.kind === 'done'
    ? buildVerdictText(view.verdict, view.verdict.missing)
    : null;
  const state: FeedbackState = said === null ? 'idle' : done ? 'right' : 'wrong';
  const log = view.kind === 'done' ? view.verdict.log : '';

  return (
    <ProofSheet
      no={t('chapter.plateNo', { n: String(props.no) })}
      track="t0"
      concept={t('drill.buildTitle')}
      code={item.taskId}
      kind={t('drill.langNote', { lang: item.langName })}
      source={t('drill.source', { id: item.taskId })}
      ly={[props.layer, props.layer]}
    >
      <Ask q={item.q} hint={item.hint} />

      <p className="dr-want">
        <RichText html={t('drill.buildWant', { want: item.want })} />
      </p>

      <input
        className="dr-expr"
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        aria-label={t('drill.exprLabel')}
        value={expr}
        disabled={done}
        onChange={(e) => setExpr(e.target.value)}
      />

      {view.kind === 'done' && view.verdict.printed !== null && !view.verdict.ok ? (
        <p className="note dr-printed">
          <RichText html={t('drill.buildPrinted', { printed: view.verdict.printed })} />
        </p>
      ) : null}

      {log === '' ? null : (
        <details className="dr-log">
          <summary>{t('drill.logLabel')}</summary>
          <pre><code>{log}</code></pre>
        </details>
      )}

      <FeedbackSlot
        state={state}
        {...(said === null ? {} : { title: said.title, body: said.body })}
        {...(view.kind === 'done' && view.verdict.reason !== null ? { rule: t('drill.noneHint') } : {})}
      />

      {props.after ?? null}

      <Acts
        left={(
          <FlatButton variant="dunno" on={props.stuckOpen} onClick={props.onDunno}>
            {t('chapter.dunno')}
          </FlatButton>
        )}
        hint={done ? t('drill.hintNext') : t('drill.hint')}
        right={done ? (
          <PressButton tone="blue" onClick={props.onNext}>
            {t('session.next')} <Kbd keys="Space" />
          </PressButton>
        ) : (
          <PressButton tone="pink" onClick={run} disabled={busy}>
            {busy ? t('drill.running') : said === null ? t('drill.run') : t('drill.again')}{' '}
            <Kbd keys="⌘↵" />
          </PressButton>
        )}
      />
    </ProofSheet>
  );
}
