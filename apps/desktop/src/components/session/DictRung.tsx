import { t } from '@chickadee/i18n';
import { RichText } from '@chickadee/ui';
import type { DictLayer } from '@chickadee/store-sql';

import './DictRung.css';

export interface DictRungProps {
  /** 사전 3층 — 한 줄로 · 왜 필요한가 · 이 줄 안에서 (03 §4.4). */
  layers: readonly DictLayer[];
}

/**
 * `.dict` — 사다리 ①단, 문법 사전 3층 (05 §5 · 정본 §3-1).
 * 인터넷도 API 키도 없이 동작한다. 그게 1~3단이 4단보다 앞에 있는 이유다.
 */
export function DictRung({ layers }: DictRungProps) {
  return (
    <>
      <h4>{t('dict.heading')}</h4>
      <div className="dict">
        {layers.map((layer) => (
          <div key={layer.k}>
            <b>{layer.k}</b>
            <div>
              {'steps' in layer ? (
                <ol className="steps">
                  {layer.steps.map((s, i) => (
                    <li key={i}>
                      <p>
                        {i + 1}. <RichText html={s} />
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <RichText as="p" html={layer.t} />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="dict-note">{t('dict.note')}</p>
    </>
  );
}
