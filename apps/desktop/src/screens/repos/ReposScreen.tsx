import { t } from '@chickadee/i18n';
import { IpcError } from '@chickadee/ipc-client';
import { FlatButton, PressButton } from '@chickadee/ui';
import { useEffect, useState } from 'react';

import { refreshRepos, report } from '../../flow.js';
import { useUi } from '../../store.js';
import { loadShelf, pickFolder, probeMissing, relocate, remove, type RepoCard } from './data.js';
import './ReposScreen.css';

/** 배지 문구. 키를 리터럴로 적어 둔다 — 카탈로그 린트가 「쓰이는 키」를 문자열로 센다. */
const STATUS_LABEL = {
  ok: 'repos.statusOk',
  missing: 'repos.statusMissing',
  detached: 'repos.statusDetached',
} as const;

/** 지금 확인을 기다리는 삭제. 2단 확인이라 「무엇을」과 「어느 갈래로」가 같이 있어야 한다. */
interface Ask {
  id: number;
  purge: boolean;
}

export interface ReposScreenProps {
  onBack: () => void;
}

/**
 * 서가 = 등록한 리포 전부 (D119 · 05 §2.1 `repos`).
 *
 * 데이터 층(`@chickadee/concepts` 의 `repos.ts`)은 M1 에 다 들어왔는데 그것을 부르는 화면이
 * 없었다 — 첫 리포를 넣고 나면 `FirstRun` 이 다시 뜨지 않으므로 **둘째를 추가할 문**도,
 * 옮긴 리포를 다시 붙일 문도 UI 에 없었다. 이 화면이 그 문이다.
 *
 * 목록은 `repo.overview` 한 번으로 긷는다. 폴더가 아직 있는지는 그린 **뒤에** 확인한다 —
 * 리포 수에 비례하는 일을 첫 그리기 앞에 두지 않는다.
 */
export function ReposScreen({ onBack }: ReposScreenProps) {
  const activeId = useUi((s) => s.activeId);
  const [cards, setCards] = useState<RepoCard[] | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const rows = await loadShelf(Date.now());
        if (!live) return;
        setCards(rows);
        const gone = await probeMissing(rows);
        if (!live || gone.length === 0) return;
        setCards(rows.map((r) => (gone.includes(r.id) ? { ...r, status: 'missing' as const } : r)));
      } catch (e) {
        report(e, '서가');
        if (live) setCards([]);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const reload = async (): Promise<void> => {
    await refreshRepos();
    setCards(await loadShelf(Date.now()));
  };

  const onOpen = (id: number): void => {
    if (useUi.getState().setActive(id)) onBack();
    else useUi.getState().say(t('repos.inSession'));
  };

  /**
   * 코스로 들어가는 문 (D120 · `clone-screen-entry`). 서가에서 여는 것은 **리포 전체**
   * 코스다 — 대지 하나짜리 코스는 홈의 대지 카드가 연다.
   *
   * 보던 리포가 아니면 먼저 옮긴다. `setActive` 가 홈으로 보내지만 그 다음 줄이 바로
   * 코스로 덮으므로 홈은 한 프레임도 그려지지 않는다.
   */
  const onCourse = (id: number): void => {
    const ui = useUi.getState();
    if (ui.session !== null) {
      ui.say(t('course.inSession'));
      return;
    }
    if (ui.activeId !== id) ui.setActive(id);
    ui.openClone({ kind: 'repo' });
  };

  const onLocate = (card: RepoCard): void => {
    void (async () => {
      try {
        if (!(await relocate(card.id))) return;
        useUi.getState().say(t('repos.relocated', { name: card.name }));
        await reload();
      } catch (e) {
        // 첫 커밋이 다르면 남의 리포다. 그 한 줄은 사용자가 고칠 수 있는 말이라 토스트로 낸다.
        if (e instanceof IpcError && e.code === 'REPO_FINGERPRINT_MISMATCH') {
          useUi.getState().say(t('repos.mismatch'));
          return;
        }
        report(e, '리포 위치 옮기기');
      }
    })();
  };

  const onConfirm = (card: RepoCard, purge: boolean): void => {
    void (async () => {
      setAsk(null);
      try {
        await remove(card.id, purge, Date.now());
        useUi.getState().say(t(purge ? 'repos.purged' : 'repos.removed', { name: card.name }));
        await reload();
      } catch (e) {
        report(e, '리포 지우기');
      }
    })();
  };

  return (
    <main className="shelf" tabIndex={-1}>
      <header className="shelf-head">
        <h1>
          {t('repos.title')}
          <span className="pl">{t('repos.plain')}</span>
        </h1>
        <div className="shelf-head-act">
          <PressButton onClick={() => void pickFolder()}>{t('repos.add')}</PressButton>
          <FlatButton onClick={onBack} ghost>
            {t('repos.back')}
          </FlatButton>
        </div>
      </header>

      <p className="shelf-lede">{t('repos.note')}</p>

      {cards === null ? (
        // 아직 못 읽은 한 프레임. 스피너를 두지 않는다 (정본 §3-7).
        <div className="shelf-list" aria-busy="true" />
      ) : cards.length === 0 ? (
        <p className="shelf-empty">{t('repos.empty')}</p>
      ) : (
        <ul className="shelf-list" aria-label={t('repos.title')}>
          {cards.map((card) => (
            <li key={card.id} className="shelf-card" data-status={card.status}>
              <div className="shelf-top">
                <b className="shelf-name">{card.name}</b>
                <span className="shelf-badge">{t(STATUS_LABEL[card.status])}</span>
                {card.id === activeId ? <span className="shelf-now">{t('repos.active')}</span> : null}
              </div>
              <code className="shelf-path">{card.rootPath}</code>

              <dl className="shelf-figs">
                <div>
                  <dt>{t('repos.concepts')}</dt>
                  <dd>{card.concepts}</dd>
                </div>
                <div>
                  <dt>{t('repos.avgLayer')}</dt>
                  <dd>{card.avgLayer === null ? '—' : card.avgLayer.toFixed(1)}</dd>
                </div>
                <div>
                  <dt>{t('repos.due')}</dt>
                  <dd>{card.dueN}</dd>
                </div>
                <div>
                  <dt>{t('repos.lastIngest')}</dt>
                  <dd>
                    {card.lastIngestAt === null
                      ? t('repos.never')
                      : new Date(card.lastIngestAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>

              {card.status === 'missing' ? <p className="shelf-note">{t('repos.missingNote')}</p> : null}
              {card.status === 'detached' ? <p className="shelf-note">{t('repos.detachedNote')}</p> : null}

              <div className="shelf-act">
                <FlatButton onClick={() => onOpen(card.id)} disabled={card.id === activeId}>
                  {t('repos.open', { name: card.name })}
                </FlatButton>
                {card.status === 'missing' ? (
                  <FlatButton onClick={() => onLocate(card)}>{t('repos.locate')}</FlatButton>
                ) : (
                  <FlatButton onClick={() => onCourse(card.id)} aria-label={t('course.openOn', { name: card.name })}>
                    {t('course.open')}
                  </FlatButton>
                )}
                <FlatButton onClick={() => setAsk({ id: card.id, purge: false })} ghost>
                  {t('repos.remove')}
                </FlatButton>
                <FlatButton onClick={() => setAsk({ id: card.id, purge: true })} ghost>
                  {t('repos.purge')}
                </FlatButton>
              </div>

              {/* 2단 확인. 모달을 열지 않는다 — Esc 의 주인이 둘이 되고(05 §2.3) 무엇을
                  지우는지가 화면에서 사라진다. 카드 안에서 묻고 그 자리에서 끝낸다. */}
              {ask !== null && ask.id === card.id ? (
                <div className="shelf-ask" role="group" aria-labelledby={`ask-${card.id}`}>
                  <p id={`ask-${card.id}`}>
                    {t(ask.purge ? 'repos.purgeAsk' : 'repos.removeAsk', { name: card.name })}
                  </p>
                  <div className="shelf-act">
                    <FlatButton onClick={() => onConfirm(card, ask.purge)}>
                      {t(ask.purge ? 'repos.confirmPurge' : 'repos.confirmRemove')}
                    </FlatButton>
                    <FlatButton onClick={() => setAsk(null)} ghost>
                      {t('repos.cancel')}
                    </FlatButton>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
