import { t } from '@chickadee/i18n';
import { cx, FlatButton, RichText } from '@chickadee/ui';
import type { CodeLine } from '@chickadee/store-sql';

import { Choices } from '../plate/Choices';
import type { ChoiceOption } from '../plate/Choices';
import { CodePlate } from '../plate/CodePlate';
import './WhyGate.css';

/** 3지선다 하나. `fb` 는 고른 뒤에만 보인다. */
export interface WhyChoice {
  /** 보기 글. 서식 글이다. */
  t: string;
  ok: boolean;
  /** 왜 맞는지 / 왜 아닌지. 서식 글이다. */
  fb: string;
}

/** 검증 결과. **4조건은 부모가 판정한다** — 이 컴포넌트는 세지 않는다 (04 왜 게이트). */
export interface WhyCount {
  ok: boolean;
  /** 「12 / 10자」 · 「코드를 그대로 옮기지 말고 말로 써 주세요」 같은 안내. */
  message: string;
}

const PLACEHOLDER = (): string => t('clone.whyPlaceholder');
const AFTER_PICK = (): string => t('clone.whyAfterPick');

export interface WhyGateProps {
  /** 문항. 서식 글이다. */
  q: string;
  /** 왜 채점하지 않는지 · 왜 건너뛸 수 없는지. 서식 글이다. */
  help: string;
  /** 문항이 가리키는 원본 한 줄. */
  orig: string;
  text: string;
  onText: (value: string) => void;
  count: WhyCount;
  choices: readonly WhyChoice[];
  /** 고른 보기 색인(**0부터**). 아직 안 골랐으면 `null`. */
  pick: number | null;
  onPick: (index: number) => void;
  /** 「모르겠어요 · 보기 보기」. */
  onReveal: () => void;
  revealed: boolean;
  placeholder?: string | undefined;
}

/**
 * `.whybox` — 왜 게이트 (05 §5 · 정본 §3-3).
 *
 * 채점하지 않지만 건너뛸 수 없다. 여기서 뇌가 안 켜지면 앞의 필사는 타자 연습이 된다.
 * 그래서 보기를 보고 정답을 읽은 **뒤에도 자기 말 한 줄이 남는다** — 옮겨 적는 그 순간이
 * 목적이라서 답을 보고 써도 된다고 문구가 먼저 말한다.
 *
 * 완료 버튼(`저장하고 마치기`)은 이 상자 밖 `.acts` 에 있다. `count.ok` 로 그 버튼의
 * `disabled` 를 정하는 것은 부모의 몫이다.
 */
export function WhyGate({
  q,
  help,
  orig,
  text,
  onText,
  count,
  choices,
  pick,
  onPick,
  onReveal,
  revealed,
  placeholder = PLACEHOLDER(),
}: WhyGateProps) {
  const lines: CodeLine[] = [{ n: 1, t: orig }];
  const okAt = choices.findIndex((c) => c.ok);

  // 고른 뒤에는 정답과 내가 고른 것에만 사유가 붙는다 (목업 `whyChoicesHTML`).
  // `<small>` 이 RichText 허용 태그 6개에 없어 `<i>` 로 옮겼다 — CSS 가 기울임을 되돌린다.
  const options: ChoiceOption[] = choices.map((c, i) => ({
    t: pick !== null && (c.ok || pick === i) ? `${c.t}<br><i>${c.fb}</i>` : c.t,
  }));

  return (
    <div className="whybox">
      <h4>
        <RichText html={q} />
      </h4>
      <RichText as="p" html={help} />
      <CodePlate lines={lines} />
      <textarea
        aria-label={t('clone.whyField')}
        placeholder={placeholder}
        value={text}
        spellCheck={false}
        onChange={(e) => onText(e.target.value)}
      />
      <div className="row">
        <span className={cx('cnt', count.ok && 'ok')}>{count.message}</span>
        <FlatButton ghost onClick={onReveal}>
          {t('clone.whyReveal')}
        </FlatButton>
      </div>
      <div>
        {revealed || pick !== null ? (
          <Choices
            options={options}
            selected={pick === null ? null : pick + 1}
            answer={pick === null || okAt < 0 ? null : okAt + 1}
            one
            onSelect={(k) => onPick(k - 1)}
          />
        ) : null}
        {pick === null ? null : <RichText as="p" className="after-pick" html={AFTER_PICK()} />}
      </div>
    </div>
  );
}
