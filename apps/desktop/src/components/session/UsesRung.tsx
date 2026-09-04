import { t } from '@chickadee/i18n';
import { CodePlate } from '../plate/CodePlate';
import './UsesRung.css';

/**
 * 같은 문법이 쓰인 다른 자리 한 줄.
 *
 * `CardPayload`(t0) 의 `uses` 는 `{ siteId, f, l }` 로 좌표만 들고 있다. 화면은 그 줄의
 * 코드 원문도 있어야 그리므로 `code` 를 더한 화면용 모형을 쓴다.
 */
export interface UseRow {
  siteId: number;
  /** 파일 이름. 디렉터리 경로는 담지 않는다 (정본 §3-1 ④). */
  f: string;
  /** 행 번호. */
  l: number;
  code: string;
}

export interface UsesRungProps {
  uses: readonly UseRow[];
}

/**
 * `.uses` — 사다리 ③단, 내 리포의 같은 문법 다른 자리 (05 §5 · 정본 §3-1).
 * 설명을 더 읽기보다 이쪽이 빠를 때가 많다.
 */
export function UsesRung({ uses }: UsesRungProps) {
  return (
    <>
      <h4>{t('uses.heading')}</h4>
      <p>{t('uses.note')}</p>
      {uses.length === 0 ? (
        <p className="uses-none">{t('uses.none')}</p>
      ) : (
        <div className="uses">
          {uses.map((use) => (
            <div key={use.siteId} className="use">
              <div className="src">
                <b>{use.f}</b>
                <span>{t('uses.line', { n: String(use.l) })}</span>
              </div>
              <CodePlate lines={[{ n: use.l, t: use.code }]} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
