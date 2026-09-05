import { Fragment, type ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { withLabels, type DiagramLabels } from './labels';
import type { DiagramPhase, PermissionLineModel, PermState } from './types';
import './PermissionLine.css';

export interface PermissionLineProps {
  model: PermissionLineModel;
  /**
   * `predict` 는 권한 칸 전부를 가린다. 코드 줄·자리 경로·권한 이름·**요구(`expects`)** 는
   * 남는다 — 「이 줄이 무엇을 요구하나」가 물음이고 「그 권한이 있나」가 답이다
   * (`rs-learning.md` §11.6).
   */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/** 권한 셋의 순서. 표기·표 대체·낭독 문장이 전부 이 순서를 쓴다. */
const PERMS = ['r', 'w', 'o'] as const;
type PermKey = (typeof PERMS)[number];

/** 그 권한의 이름. 칸에 찍히는 한 글자는 이 이름의 **첫 글자**다(읽기 → 읽 · read → r). */
export function permName(key: PermKey, L: DiagramLabels): string {
  if (key === 'r') return L.permRead;
  if (key === 'w') return L.permWrite;
  return L.permOwn;
}

/** 상태의 이름. 표 대체와 낭독 문장은 **낱말**을 쓴다 — 표기는 화면의 것이다. */
export function permStateName(state: PermState, L: DiagramLabels): string {
  if (state === 'has') return L.permHas;
  if (state === 'gained') return L.permGained;
  if (state === 'lost') return L.permLost;
  if (state === 'missing') return L.permMissing;
  return L.permNone;
}

/** 칸에 찍히는 표기. 부호가 상태를, 면과 테두리가 나머지를 말한다 — 색은 거들 뿐이다. */
function mark(state: PermState, letter: string): string {
  if (state === 'gained') return `+${letter}`;
  if (state === 'lost') return `−${letter}`;
  if (state === 'none') return '·';
  return letter;
}

/**
 * 낭독기 한 문장. 격자를 칸칸이 읽어 주면 못 듣는다 — **어느 줄에서 어느 자리가 무엇을
 * 잃고 얻나**를 말한다. 권한이 모자라 거부되는 자리(`missing`)는 언제나 문장에 나온다.
 */
export function describePermissions(
  model: PermissionLineModel,
  phase: DiagramPhase = 'reveal',
  labels?: Partial<DiagramLabels> | undefined,
): string {
  const L = withLabels(labels);
  const paths = model.steps[0]?.places.map((p) => p.path).join(', ') ?? '';
  const head = `줄 ${model.steps.length}개, 자리 ${model.steps[0]?.places.length ?? 0}개 — ${paths}.`;
  const asks = model.steps
    .flatMap((s, i) =>
      (s.expects ?? []).map(
        (e) => `${i + 1}번째 줄은 ${e.path} 에 ${e.needs.map((n) => permName(n, L)).join(', ')} 를 요구합니다`,
      ),
    )
    .join('. ');
  if (phase === 'predict') return `${head} ${asks}. 권한은 아직 가려져 있습니다.`;
  const moves = model.steps
    .flatMap((s, i) =>
      s.places.flatMap((p) =>
        PERMS.filter((k) => p[k] === 'gained' || p[k] === 'lost' || p[k] === 'missing').map(
          (k) => `${i + 1}번째 줄에서 ${p.path} 가 ${permName(k, L)} 를 ${permStateName(p[k], L)}`,
        ),
      ),
    )
    .join(', ');
  return `${head} ${asks}${asks === '' ? '' : '. '}${moves}.`;
}

/**
 * `.pl` — 권한 줄. **「소유권 화살표」를 교체한 것**이다(D187 ⑲).
 *
 * 화살표는 이름(owner)에 붙었는데 권한은 **place** 에 붙는다 — `x` 와 `*x` 와 `v[0]` 이
 * 서로 다른 권한을 드는 것이 이 언어의 요점이라 이름 단위로는 그 구분이 사라진다.
 * 시간 축은 코드 줄이고, 값은 여기 없다(`rs-learning.md` §11.1 — 값은 별도 런타임 그림).
 *
 * **표기는 재구현이다.** Brown/Aquascope 의 `+`·`/`·채운 글자는 아이디어이지 지문이
 * 아니므로 우리 규약(면·파선·부호)으로 다시 만들었다. 「권한 표 대 화살표」를 직접 견준
 * 근거는 없다 — `design/system/diagrams.md` §7 에 적어 두었다.
 */
export function PermissionLine({ model, phase = 'reveal', caption, labels }: PermissionLineProps) {
  const L = withLabels(labels);
  const open = phase === 'reveal';
  const places = model.steps[0]?.places ?? [];
  const cols = `max-content minmax(6rem, max-content) repeat(${places.length * 3}, minmax(2.4em, max-content))`;

  return (
    <Diagram
      className="dgm-pl"
      label={describePermissions(model, phase, labels)}
      caption={caption}
      alt={
        <table>
          <caption>{`${L.altTable} — ${L.colPlace}`}</caption>
          <thead>
            <tr>
              <th scope="col">{L.colLine}</th>
              <th scope="col">{L.colCode}</th>
              <th scope="col">{L.colPlace}</th>
              <th scope="col">{L.colValue}</th>
            </tr>
          </thead>
          <tbody>
            {model.steps.map((s, i) => (
              <Fragment key={`s-${i}-${s.code}`}>
                {s.places.map((p) => (
                  <tr key={`${i}-${p.path}`}>
                    <th scope="row">{i + 1}</th>
                    <td>{s.code}</td>
                    <td>{p.path}</td>
                    <td>
                      {open
                        ? PERMS.map((k) => `${permName(k, L)} ${permStateName(p[k], L)}`).join(', ')
                        : L.hidden}
                    </td>
                  </tr>
                ))}
                {(s.expects ?? []).map((e) => (
                  <tr key={`${i}-need-${e.path}`}>
                    <th scope="row">{`${i + 1} · ${L.needs}`}</th>
                    <td colSpan={3}>{`${e.path} — ${e.needs.map((n) => permName(n, L)).join(', ')}`}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="pl" style={{ gridTemplateColumns: cols }}>
        <span className="pl-corner" style={{ gridRow: '1 / 3', gridColumn: '1 / 3' }} />
        {places.map((p, pi) => (
          <Fragment key={`h-${p.path}`}>
            <span className="pl-path" style={{ gridRow: 1, gridColumn: `${3 + pi * 3} / ${6 + pi * 3}` }}>
              {p.path}
            </span>
            {PERMS.map((k, ki) => (
              <span className="pl-perm" style={{ gridRow: 2, gridColumn: 3 + pi * 3 + ki }} key={`h-${p.path}-${k}`}>
                {permName(k, L)}
              </span>
            ))}
          </Fragment>
        ))}

        {model.steps.map((s, i) => (
          <Fragment key={`r-${i}-${s.code}`}>
            <span className="pl-no" style={{ gridRow: i + 3, gridColumn: 1 }}>
              {i + 1}
            </span>
            <span className="pl-code" style={{ gridRow: i + 3, gridColumn: 2 }}>
              {s.code}
              {(s.expects ?? []).map((e) => (
                <span className="pl-need" key={`n-${e.path}`}>
                  {`${e.path}: ${e.needs.map((n) => permName(n, L)).join('·')}`}
                </span>
              ))}
            </span>
            {s.places.map((p, pi) =>
              PERMS.map((k, ki) => (
                <span
                  key={`${i}-${p.path}-${k}`}
                  className={cx('pl-cell', open ? p[k] : 'veil')}
                  style={{ gridRow: i + 3, gridColumn: 3 + pi * 3 + ki }}
                >
                  {open ? mark(p[k], [...permName(k, L)][0] ?? '') : ''}
                </span>
              )),
            )}
          </Fragment>
        ))}
      </div>
      {/* 표기는 우리 것이라 그림 안에서 한 번 풀어 준다 — 배운 적 없는 규약이다. */}
      <p className="pl-key">
        {(['has', 'gained', 'lost', 'missing', 'none'] as const).map((st) => (
          <span className="pl-key-item" key={st}>
            <span className={cx('pl-cell', st)}>{mark(st, [...L.permRead][0] ?? '')}</span>
            {permStateName(st, L)}
          </span>
        ))}
      </p>
    </Diagram>
  );
}
