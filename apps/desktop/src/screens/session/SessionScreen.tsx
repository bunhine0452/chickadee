/**
 * 교정쇄 화면 (05 §2.3 · §3 · §5). 오버레이 · 작업 띠 · 지금 판 · 요약을 잇는다.
 *
 * **상태는 여기 있고 규칙은 없다.** 무엇을 쓸지는 `session-flow` 가, 무엇이 맞는지는
 * `@chickadee/grading` 이, 겹이 얼마나 오를지는 `@chickadee/scheduler` 가 정한다.
 */
import { FlatButton } from '@chickadee/ui';
import { useCallback, useEffect, useState } from 'react';

import { JobBand } from '../../components/session/JobBand.js';
import { SessionOverlay } from '../../components/session/SessionOverlay.js';
import { LiferVeil } from '../../components/session/LiferVeil.js';
import { Summary } from '../../components/session/Summary.js';
import type { RungNo } from '../../components/session/ReprintLadder.js';
import type { QueueItem } from '../../components/shell/TimeQueue.js';
import { baseName, loadLadder, type LadderData } from '../../data/ladder.js';
import type { Plate } from '../../data/session.js';
import type { Track } from '@chickadee/store-sql';
import { loadSettings } from '../../data/settings.js';
import { loadSummary, markLifersShown, type SummaryData } from '../../data/summary.js';
import {
  answerPlate, backFromPrereq, completeSession, jumpPrereq, openRung, pauseSession, pressDunno,
  returnToParent, savePlate,
} from '../../session-flow.js';
import { currentPlate, useUi } from '../../store.js';
import { T0Plate } from './T0Plate.js';
import { useSessionClock } from './useSessionClock.js';
import './SessionScreen.css';

const TRACK_LABEL = { t0: 'T0', t1: 'T1', t2: 'T2', t3: 'T3' } as const;

/**
 * 화면의 `Track`(`packages/ui`)은 t0~t2 뿐이고 스키마의 `Track`(02 §8.2)은 t3 를 포함한다 —
 * T3 은 「스키마 자리만」이라 그릴 것이 없다(정본 §2). 요약에 t3 행이 올 일은 없지만
 * 타입은 그것을 모르므로 여기서 한 번 좁힌다.
 */
const asViewTrack = (t: Track): 't0' | 't1' | 't2' => (t === 't3' ? 't0' : t);

/** LIFER 베일에 넘길 것. 시각은 부르는 쪽이 굳힌다 — 컴포넌트는 시계를 읽지 않는다. */
interface LiferView { concept: string; code: string; where: string; serial: string }

const toQueueItem = (p: Plate): QueueItem => ({
  kind: p.track,
  label: p.nameKo,
  mins: p.estMin,
  sub: p.token ?? TRACK_LABEL[p.track],
  review: p.role === 'review' || p.role === 'retry',
});

export interface SessionScreenProps {
  repoId: number;
  repoName: string;
}

export function SessionScreen({ repoId, repoName }: SessionScreenProps): React.JSX.Element | null {
  const session = useUi((s) => s.session);
  const plates = useUi((s) => s.plates);
  const pos = useUi((s) => s.pos);
  const results = useUi((s) => s.results);
  const carry = useUi((s) => s.carry);
  const done = useUi((s) => s.done);
  const plate = useUi(currentPlate);

  const [ladderOpen, setLadderOpen] = useState(false);
  const [rung, setRung] = useState<RungNo>(1);
  const [stuck, setStuck] = useState('');
  const [ladder, setLadder] = useState<LadderData | null>(null);
  const [dunnoId, setDunnoId] = useState(0);
  const [lifer, setLifer] = useState<LiferView | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const result = results[pos] ?? null;
  const elapsed = useUi((s) => s.elapsed[pos] ?? 0);

  useSessionClock(pos, plate?.elapsedS ?? 0, () => void savePlate());

  // 판이 바뀌면 사다리는 접힌다 — 앞 판의 4단 입력이 다음 판에 따라오면 안 된다.
  useEffect(() => {
    setLadderOpen(false);
    setRung(1);
    setStuck('');
    setLadder(null);
    setDunnoId(0);
  }, [plate?.id]);

  // 마지막 판을 마치면 요약을 읽는다 (05 §3 — 요약은 읽기 전용이다).
  useEffect(() => {
    if (!done || session === null) return;
    void (async () => {
      const settings = await loadSettings();
      const data = await loadSummary(repoId, session.id, session.startedAt, Date.now(), settings);
      setSummary(data);
      // 세션 중에 연출을 못 본 LIFER 는 여기서 처음 보인다 (D76).
      await markLifersShown(data.lifers.filter((l) => l.unseen).map((l) => l.serial), Date.now());
    })();
  }, [done, session, repoId]);

  const openLadder = useCallback(async () => {
    if (plate === null || plate.payload.track !== 't0') return;
    const next = !ladderOpen;
    setLadderOpen(next);
    if (!next) return;

    const id = await pressDunno(result !== null, result?.correct ?? null);
    setDunnoId(id);
    await openRung(id, 1);
    const settings = await loadSettings();
    setLadder(await loadLadder({
      repoId,
      payload: plate.payload,
      conceptId: plate.conceptId,
      concept: { name: plate.nameKo, token: plate.token ?? '' },
      siteId: plate.siteId,
      sel: result?.sel ?? null,
      answered: result !== null,
      correct: result?.correct ?? false,
      stuck: '',
      dueAt: null,
      now: Date.now(),
      settings,
    }));
  }, [plate, ladderOpen, result, repoId]);

  const goNext = useCallback(async () => {
    if (session === null || plate === null) return;
    // 아래층을 마쳤으면 부모로 돌아간다 — 「이어보기」가 그때 열린다 (02 §4).
    if (plate.role === 'prereq' && plate.parentItemId !== null) {
      await returnToParent(dunnoId);
      return;
    }
    const next = pos + 1;
    if (next >= plates.length) {
      await completeSession();
      return;
    }
    useUi.getState().setCarry(null);
    useUi.getState().goTo(next);
  }, [session, plate, pos, plates.length, dunnoId]);

  const submit = useCallback(async (sel: number) => {
    const answered = await answerPlate({
      sel,
      elapsedMs: elapsed * 1000,
      dunno: ladderOpen,
      rungsOpened: ladderOpen ? [rung] : [],
    });
    if (answered === null || plate === null) return;
    const shown = useUi.getState().liferShown;
    // 연출은 첫 성공이고 다시 찍기·아래층이 아닐 때만 (D76).
    if (answered.correct && answered.layer[1] > answered.layer[0] && answered.layer[0] === 0
      && plate.role !== 'retry' && plate.role !== 'prereq' && shown <= 3) {
      const payload = plate.payload.track === 't0' ? plate.payload : null;
      setLifer({
        concept: plate.nameKo,
        code: plate.token ?? '',
        where: `당신의 <b>${baseName(payload?.file ?? '')}:${payload?.focus ?? 0}</b> 에서 채집 · T0 문법`,
        serial: `#${String(shown).padStart(3, '0')}`,
      });
    }
  }, [elapsed, ladderOpen, rung, plate]);

  if (session === null) return null;

  const band = (
    <JobBand
      runNo={`Run ${session.seqInDay}`}
      repo={repoName}
      queue={plates.map(toQueueItem)}
      pos={done ? plates.length : pos}
      elapsed={elapsed}
      totalElapsed={session.elapsedS}
    >
      <FlatButton ghost onClick={() => void pauseSession()}>나가기</FlatButton>
    </JobBand>
  );

  return (
    <div className="session-screen">
      <SessionShell
        band={band}
        lifer={lifer}
        onCloseLifer={() => setLifer(null)}
        ladderOpen={ladderOpen}
        onCloseLadder={() => setLadderOpen(false)}
      >
        {done && summary !== null ? (
          <Summary
            runNo={`Run ${session.seqInDay}`}
            repo={repoName}
            date={session.dayKey}
            day={session.dayKey.slice(-2)}
            results={summary.shifts.map((s) => ({
              conceptId: s.conceptId, concept: s.nameKo, code: s.token ?? '',
              track: asViewTrack(s.track),
              lyFrom: s.from, lyTo: s.to, next: s.nextLabel,
              ...(s.lastRole === 'prereq' ? { extra: '아래층' } : {}),
            }))}
            printed={summary.plates}
            ok={summary.exact}
            mins={summary.minutes}
            streak={0}
            {...(summary.lifers[0]
              ? {
                  lifer: {
                    concept: summary.lifers[0].nameKo,
                    code: summary.lifers[0].token ?? '',
                    where: `#${String(summary.lifers[0].serial).padStart(3, '0')} · 당신의 `
                      + `<b>${baseName(summary.lifers[0].filePath)}`
                      + `:${summary.lifers[0].lineNo ?? 0}</b> 에서 채집`,
                  },
                }
              : {})}
            tomorrow={`내일은 <b>${summary.shifts.length}</b> 개념이 다시 올라옵니다.`}
            onHome={() => {
              useUi.getState().closeSession();
              useUi.getState().go('home');
            }}
          />
        ) : plate === null ? null : (
          <T0Plate
            plate={plate}
            no={pos + 1}
            result={result}
            payoff={carry !== null && carry.parentItemId === plate.id ? carry.payoff : null}
            ladder={ladder}
            ladderOpen={ladderOpen}
            rung={rung}
            stuck={stuck}
            onRung={(r) => {
              setRung(r);
              void openRung(dunnoId, r);
            }}
            onStuck={setStuck}
            onCopyPrompt={() => {
              if (ladder !== null) void navigator.clipboard?.writeText(ladder.prompt);
            }}
            onDunno={() => void openLadder()}
            onJumpPrereq={(conceptId) => void jumpPrereq(dunnoId, conceptId as Plate['conceptId'])}
            onBack={() => void backFromPrereq(dunnoId)}
            onSubmit={(sel) => void submit(sel)}
            onNext={() => void goNext()}
            onSelect={(sel) => useUi.getState().patchState(pos, { sel })}
          />
        )}
      </SessionShell>
    </div>
  );
}

/** 오버레이는 자기 밖의 DOM 을 모른다 — LIFER 를 실제 요소로 바꿔 넘기는 것은 여기 몫이다. */
function SessionShell(props: {
  band: React.ReactNode;
  lifer: LiferView | null;
  onCloseLifer: () => void;
  ladderOpen: boolean;
  onCloseLadder: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <SessionOverlay
      band={props.band}
      {...(props.lifer
        ? { lifer: <LiferVeil {...props.lifer} onClose={props.onCloseLifer} /> }
        : {})}
      onCloseLifer={props.onCloseLifer}
      ladderOpen={props.ladderOpen}
      onCloseLadder={props.onCloseLadder}
      onExit={() => void pauseSession()}
    >
      {props.children}
    </SessionOverlay>
  );
}
