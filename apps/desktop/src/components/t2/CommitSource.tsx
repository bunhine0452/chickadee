import { t } from '@chickadee/i18n';
import './CommitSource.css';

export interface Commit {
  /** 짧은 해시. */
  h: string;
  /** 날짜. */
  d: string;
  /** 커밋 메시지. */
  m: string;
  /** `7 files changed, +181 −23`. */
  n: string;
}

export interface CommitSourceProps {
  /** 커밋 없이 그래프만으로 만든 문제(04 §8.3·§8.4)에서는 넘어오지 않는다. */
  commit?: Commit | undefined;
}

/**
 * `.commit` — 정답의 출처 (05 §5).
 *
 * **`commit` 이 없으면 아무것도 그리지 않는다.** 그래프만으로 만든 문제와 커밋 부족 폴백은
 * 정답지가 커밋에서 오지 않았고, 안 온 출처를 적으면 그 문장이 거짓이 된다 (D100).
 */
export function CommitSource({ commit }: CommitSourceProps) {
  if (commit === undefined) return null;

  return (
    <div className="commit">
      <span className="h">{commit.h}</span>
      <div>
        <p>
          <b>{t('map.commitSource')}</b> {t('map.commitNote')}
        </p>
        <p className="msg">{commit.m}</p>
        <p>
          {commit.d} · {commit.n}
        </p>
      </div>
    </div>
  );
}
