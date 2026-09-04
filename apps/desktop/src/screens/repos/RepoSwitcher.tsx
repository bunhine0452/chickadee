import { t } from '@chickadee/i18n';
import { useEffect, useRef, useState } from 'react';

import { useUi } from '../../store.js';
import './RepoSwitcher.css';

/** 목록 끝의 「전부 보기」. 리포 id 와 섞이지 않게 자리 번호를 따로 둔다. */
const ALL = -1;

export interface RepoSwitcherProps {
  /** 지금 보고 있는 리포 이름. 마스트헤드가 이미 들고 있는 값이라 그대로 받는다. */
  repoName: string;
}

/**
 * 마스트헤드의 리포 칸 (05 §2.4 · D119).
 *
 * 05 §2.4 가 모양을 정해 뒀다 — `button[aria-haspopup=listbox]` + `ul[role=listbox]`.
 * 목업의 죽은 칸에 CSS 와 aria 가 이미 있었고, 여기서 `disabled` 를 떼고 목록을 붙인다.
 *
 * **세션 중에는 비활성**이다. 교정지 한 장이 어느 리포 것인지가 도중에 바뀌면 그 세션의
 * 채점이 어느 원장에 남는지가 흔들린다 — 작업 띠에는 리포명만 보인다.
 *
 * 목록은 store 에서 직접 읽는다. 홈이 이미 들고 있는 값을 화면 셋을 지나 다시 내려보내면
 * 리포와 아무 상관 없는 컴포넌트들이 props 를 하나씩 더 들게 된다.
 */
export function RepoSwitcher({ repoName }: RepoSwitcherProps) {
  const repos = useUi((s) => s.repos);
  const activeId = useUi((s) => s.activeId);
  const locked = useUi((s) => s.session !== null);
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  /** 리포들 + 마지막 한 줄(「전부 보기」). 방향키는 이 배열 위를 돈다. */
  const ids: number[] = [...repos.map((r) => r.id), ALL];

  useEffect(() => {
    if (open) list.current?.focus();
  }, [open]);

  const close = (toButton = true): void => {
    setOpen(false);
    if (toButton) button.current?.focus();
  };

  const choose = (id: number): void => {
    close();
    if (id === ALL) {
      useUi.getState().go('repos');
      return;
    }
    if (!useUi.getState().setActive(id)) useUi.getState().say(t('repos.inSession'));
  };

  const onKey = (e: React.KeyboardEvent): void => {
    const key = e.key;
    if (key === 'Escape' || key === 'Tab') {
      // Tab 은 막지 않는다 — 목록을 닫고 포커스는 다음 칸으로 흘러가는 것이 맞다.
      if (key === 'Escape') e.preventDefault();
      close(key === 'Escape');
      return;
    }
    const step = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
    if (step !== 0) {
      e.preventDefault();
      setAt((i) => (i + step + ids.length) % ids.length);
      return;
    }
    if (key === 'Home' || key === 'End') {
      e.preventDefault();
      setAt(key === 'Home' ? 0 : ids.length - 1);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      const id = ids[at];
      if (id !== undefined) choose(id);
    }
  };

  /** 마우스로 고르기. 항목마다 핸들러를 달지 않고 목록 하나가 받는다. */
  const onClickOption = (e: React.MouseEvent): void => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
    const id = li === null ? NaN : Number(li.dataset['id']);
    if (Number.isNaN(id)) return;
    choose(id);
  };

  const openAt = (): void => {
    const i = repos.findIndex((r) => r.id === activeId);
    setAt(i < 0 ? 0 : i);
    setOpen(true);
  };

  return (
    <div className="repo-switch-wrap">
      <button
        ref={button}
        type="button"
        id="tk-repo-v"
        className="tk-v mono repo-switch"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="repo-switch-list"
        aria-labelledby="tk-repo tk-repo-v"
        disabled={locked}
        onClick={() => (open ? close() : openAt())}
      >
        {repoName}
      </button>
      {open ? (
        <ul
          ref={list}
          id="repo-switch-list"
          className="repo-switch-list"
          role="listbox"
          tabIndex={-1}
          aria-label={t('repos.switch')}
          aria-activedescendant={`repo-opt-${ids[at] ?? ALL}`}
          onKeyDown={onKey}
          onClick={onClickOption}
          // 항목은 포커스를 받지 않는다 — 포커스는 listbox 하나에 있고 어느 줄인지는
          // `aria-activedescendant` 가 말한다. 눌러서 고르는 길은 여기서 한 번에 받는다.
          onMouseDown={(e) => e.preventDefault()}
          onBlur={() => setOpen(false)}
        >
          {repos.map((repo, i) => (
            <li
              key={repo.id}
              id={`repo-opt-${repo.id}`}
              role="option"
              className="repo-switch-opt"
              aria-selected={repo.id === activeId}
              data-at={i === at ? 'on' : undefined}
              data-id={repo.id}
            >
              {repo.name}
            </li>
          ))}
          <li
            id={`repo-opt-${ALL}`}
            role="option"
            className="repo-switch-opt repo-switch-all"
            aria-selected={false}
            data-at={at === ids.length - 1 ? 'on' : undefined}
            data-id={ALL}
          >
            {t('repos.all')}
          </li>
        </ul>
      ) : null}
    </div>
  );
}
