import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../Button';
import { Callout } from '../Callout';
import { Card } from '../Card';
import { BitField, EvalTree, ValueBox, bitsOf } from '../diagram';
import type { EvalTreeModel, FoldModel, ValueBoxModel } from '../diagram';
import { Field } from '../Field';
import { Progress } from '../Progress';
import { Tag } from '../Tag';
import { FlatButton } from '../FlatButton';
import { Kbd } from '../Kbd';
import { LiveRegion } from '../LiveRegion';
import { Passes } from '../Passes';
import { Pill } from '../Pill';
import { PressButton } from '../PressButton';
import { RichText } from '../RichText';
import { Switch } from '../Switch';
import { Toast } from '../Toast';
import type { InkLayer, Track } from '../types';
import './tokens.css';

/**
 * DEV 전용 진열대 — 목업(`design/ink-home.html`)과 나란히 놓고 눈으로 맞추는 자리다.
 * 05 §12 이전 순서 2번(「Storybook 없이 dev/Gallery.tsx 로 비교」).
 *
 * 프로덕션 번들에 실리지 않는다: `index.ts` 가 내보내지 않고, 아래 가드가
 * `import.meta.env.DEV` 가 아니면 아무것도 그리지 않는다. 부르는 쪽도
 * `import.meta.env.DEV && (await import('./dev/Gallery'))` 로만 들여온다.
 */

const TRACKS: readonly Track[] = ['t0', 't1', 't2'];

/** 색 견본 — 이 시스템이 쓰는 색은 이게 전부다(코드 구문 강조 여섯 제외). */
const SWATCHES: ReadonlyArray<readonly [string, string]> = [
  ['--bg', '바탕'],
  ['--surface', '면'],
  ['--surface-2', '면 2'],
  ['--surface-3', '면 3'],
  ['--border', '테두리'],
  ['--text', '글자'],
  ['--text-muted', '글자 2차'],
  ['--accent', '액센트'],
  ['--ok', '정답'],
  ['--bad', '오답'],
  ['--warn', '주의'],
  ['--info', '잠김'],
];
const LAYERS: readonly InkLayer[] = [0, 1, 2, 3, 4];

/* 그림은 값에서 나온다 — 아래 셋은 손으로 그린 것이 아니라 이 데이터의 결과다. */
const EXPR: EvalTreeModel = {
  expr: '2 + 3 * 4',
  root: {
    kind: 'op',
    op: '+',
    result: '14',
    kids: [
      { kind: 'leaf', text: '2' },
      {
        kind: 'op',
        op: '*',
        result: '12',
        kids: [
          { kind: 'leaf', text: '3' },
          { kind: 'leaf', text: '4' },
        ],
      },
    ],
  },
};

/* 문항 형식 `step` 의 payload(`fold: FoldStep[]`) 를 그대로 받는 낮은 해상도판. */
const FOLD: FoldModel = {
  expr: '7 / 2',
  steps: [
    { code: '7 / 2', type: 'int / int' },
    { code: '3', type: 'int' },
  ],
};

const VARS: ValueBoxModel = {
  steps: [
    { code: 'int x = 3;', cells: [{ name: 'x', type: 'int', value: '3', changed: true, from: '3' }] },
    {
      code: 'int y = x + 1;',
      cells: [
        { name: 'x', type: 'int', value: '3' },
        { name: 'y', type: 'int', value: '4', changed: true, from: 'x + 1' },
      ],
      note: '오른쪽을 먼저 셈하고 나서 이름표를 붙인다.',
    },
    {
      code: 'x = y * 2;',
      cells: [
        { name: 'x', type: 'int', value: '8', changed: true, from: 'y * 2' },
        { name: 'y', type: 'int', value: '4' },
      ],
      note: 'x 의 상자는 그대로이고 안의 값만 갈린다.',
    },
  ],
};

function Slot({ cap, children }: { cap: string; children: ReactNode }) {
  return (
    <div className="g-slot">
      <span className="g-cap">{cap}</span>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h2>{title}</h2>
      <div className="g-row">{children}</div>
    </>
  );
}

function GalleryBody() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [dunno, setDunno] = useState(false);
  const [toastOn, setToastOn] = useState(true);
  const [phase, setPhase] = useState<'predict' | 'reveal'>('reveal');
  const [fold, setFold] = useState(1);
  const [line, setLine] = useState(1);

  return (
    <div className="gallery" data-theme={theme}>
      <h1>UI 진열대</h1>

      <Section title="테마">
        <Switch
          options={[
            { v: 'light', label: '밝게' },
            { v: 'dark', label: '어둡게' },
          ]}
          value={theme}
          label="밝게 · 어둡게"
          onChange={setTheme}
        />
        <Switch
          options={[
            { v: 'all', label: '전부' },
            { v: 'differ', label: '어긋남' },
            { v: 'extra', label: '추가' },
          ]}
          value="all"
          label="판정 거르개"
          onChange={() => undefined}
        />
      </Section>

      <Section title="색 — 표면 · 글자 · 액센트 하나 · 상태 넷">
        {SWATCHES.map(([token, name]) => (
          <span key={token} className="g-swatch">
            <span className="g-chip" style={{ background: `var(${token})` }} />
            {name}
          </span>
        ))}
      </Section>

      <Section title="활자 — 7단 · 읽기용 하나 + 코드용 하나">
        {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => (
          <span key={n} className="g-type" style={{ fontSize: `var(--fs-${n})` }}>
            <span>다형성을 배운다 Aa 123</span>
          </span>
        ))}
        <div className="g-code">
          <span style={{ color: 'var(--syn-key)' }}>const</span>{' '}
          <span style={{ color: 'var(--syn-fn)' }}>find</span>{' = ('}
          <span style={{ color: 'var(--syn-type)' }}>User</span>
          {') => '}
          <span style={{ color: 'var(--syn-str)' }}>&quot;ok&quot;</span>
          {'; '}
          <span style={{ color: 'var(--syn-num)' }}>42</span>{' '}
          <span style={{ color: 'var(--syn-com)' }}>// 이 줄이 무엇인가</span>
        </div>
      </Section>

      <Section title="그림 — 학습 내용을 나르는 다이어그램 (장식이 아니라 본문)">
        <Switch
          options={[
            { v: 'predict', label: '예측' },
            { v: 'reveal', label: '공개' },
          ]}
          value={phase}
          label="예측 · 공개"
          onChange={setPhase}
        />
      </Section>

      <Section title="비트 배열 — 0.1 은 왜 안 떨어지나">
        <div style={{ flex: '1 1 100%', minWidth: 0 }}>
          <BitField
            model={bitsOf(0.1, 'f64')}
            phase={phase}
            caption="double 하나에 0.1 을 담으면 실제로 담기는 것은 0.1 이 아니다. 55자리가 그 차이다."
          />
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <BitField model={bitsOf(-1, 'i32')} phase={phase} caption="int -1 — 2의 보수는 전부 1 이다." />
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <BitField
            model={bitsOf(2_147_483_648, 'i32')}
            phase={phase}
            caption="int 의 폭을 한 칸 넘으면 값이 감긴다 — 에러가 아니라 값이다."
          />
        </div>
      </Section>

      <Section title="평가 트리 — 2 + 3 * 4 가 접히는 순서">
        <div style={{ flex: '1 1 100%', minWidth: 0 }}>
          <EvalTree
            model={EXPR}
            step={fold}
            onStep={setFold}
            phase={phase}
            caption="곱셈이 덧셈보다 먼저 접힌다. 우선순위는 규칙이 아니라 트리 모양이다."
          />
        </div>
      </Section>

      <Section title="걸음 사다리 — 트리를 못 실은 문항이 쓰는 같은 그림">
        <div style={{ flex: '1 1 100%', minWidth: 0 }}>
          <EvalTree
            fold={FOLD}
            step={fold}
            onStep={setFold}
            phase={phase}
            caption="자바의 7 / 2 는 3 이다. 나누기가 정수 둘을 만나면 결과도 정수다."
          />
        </div>
      </Section>

      <Section title="값 상자 — 변수는 이름표가 붙은 상자다">
        <div style={{ flex: '1 1 100%', minWidth: 0 }}>
          <ValueBox
            model={VARS}
            step={line}
            onStep={setLine}
            phase={phase}
            caption="대입은 상자로 내려오는 화살표 하나다. 상자는 그대로 있고 안의 값만 갈린다."
          />
        </div>
      </Section>

      <Section title="Button">
        <Slot cap="primary">
          <Button variant="primary" kbd="Enter">채점하기</Button>
        </Slot>
        <Slot cap="secondary">
          <Button>닫기</Button>
        </Slot>
        <Slot cap="ghost">
          <Button variant="ghost">건너뛰기</Button>
        </Slot>
        <Slot cap="danger">
          <Button variant="danger">리포 지우기</Button>
        </Slot>
        <Slot cap="pressed">
          <Button pressed={dunno} onClick={() => setDunno(!dunno)}>모르겠어요</Button>
        </Slot>
        <Slot cap="disabled">
          <Button variant="primary" disabled>채점하기</Button>
        </Slot>
        <Slot cap="lg">
          <Button variant="primary" size="lg">다음 단</Button>
        </Slot>
        <Slot cap="sm">
          <Button size="sm">되돌리기</Button>
        </Slot>
      </Section>

      <Section title="Tag">
        <Slot cap="neutral"><Tag>2단 추적</Tag></Slot>
        <Slot cap="accent"><Tag tone="accent">진행 중</Tag></Slot>
        <Slot cap="ok"><Tag tone="ok">통과</Tag></Slot>
        <Slot cap="bad"><Tag tone="bad">틀림</Tag></Slot>
        <Slot cap="warn"><Tag tone="warn">다시 풀기</Tag></Slot>
        <Slot cap="info"><Tag tone="info">잠김</Tag></Slot>
        <Slot cap="ghost"><Tag ghost>새 문제</Tag></Slot>
      </Section>

      <Section title="Progress">
        <Slot cap="0.35">
          <Progress value={35} label="오늘 학습 35% 진행" />
        </Slot>
        <Slot cap="steps 3/5">
          <Progress value={3} max={5} label="다섯 단 중 3단" steps />
        </Slot>
        <Slot cap="ok">
          <Progress value={100} tone="ok" label="챕터 통과" />
        </Slot>
      </Section>

      <Section title="Card">
        <Card title="로그인" aside={<Tag tone="ok">통과</Tag>}>
          <p>파일 스물둘 · 요청 한 줄기. 다음은 3단 예측입니다.</p>
        </Card>
        <Card tone="inset" pad="sm">
          <p>인셋 면 — 코드 아닌 보조 판.</p>
        </Card>
        <Card lift="float" pad="sm">
          <p>떠 있는 면 — 모달·팝오버에만.</p>
        </Card>
      </Section>

      <Section title="Callout">
        <Callout title="맞았습니다" tone="ok">
          <p>숙련도 3단계. Space 로 다음.</p>
        </Callout>
        <Callout title="당신이 고른 그것이 참이 되는 조건" tone="bad">
          <p>필드가 <code>static</code> 이라면 인스턴스마다 값이 갈리지 않습니다.</p>
        </Callout>
        <Callout title="러너가 없습니다" tone="warn">
          <p>JDK 를 못 찾아 5단은 게이트에서 빠집니다.</p>
        </Callout>
      </Section>

      <Section title="Field">
        <Field label="리포 주소" hint="로컬 경로도 됩니다.">
          {(a) => <input type="text" placeholder="/Users/me/project" {...a} />}
        </Field>
        <Field label="API 키" error="키를 읽을 수 없습니다." mono>
          {(a) => <input type="password" {...a} />}
        </Field>
      </Section>

      <Section title="Pill (→ Tag 로 옮기는 중)">
        {TRACKS.map((t) => (
          <Slot key={t} cap={t}>
            <Pill track={t}>{t.toUpperCase()}</Pill>
          </Slot>
        ))}
        <Slot cap="ghost">
          <Pill ghost>다시 찍기</Pill>
        </Slot>
        <Slot cap="plain">
          <Pill>새 판</Pill>
        </Slot>
      </Section>

      <Section title="Passes (→ Progress steps 로 옮기는 중)">
        {LAYERS.map((n) => (
          <Slot key={n} cap={`n=${n}`}>
            <Passes n={n} track="t0" label={`T0 · 잉크 ${n}겹`} />
          </Slot>
        ))}
        <Slot cap="compact">
          <Passes n={3} track="t2" label="T2 · 잉크 3겹" compact />
        </Slot>
      </Section>

      <Section title="Kbd">
        <Slot cap="Enter">
          <Kbd keys="Enter" />
        </Slot>
        <Slot cap="Esc">
          <Kbd keys="Esc" />
        </Slot>
        <Slot cap="hold">
          <Kbd keys="` 홀드" />
        </Slot>
      </Section>

      <Section title="PressButton (→ Button primary 로 옮기는 중)">
        <Slot cap="pink">
          <PressButton kbd="Enter">인쇄 시작</PressButton>
        </Slot>
        <Slot cap="blue">
          <PressButton tone="blue" kbd="Enter">
            이 판 찍기
          </PressButton>
        </Slot>
        <Slot cap="down">
          <PressButton down>제출</PressButton>
        </Slot>
        <Slot cap="disabled">
          <PressButton disabled>제출</PressButton>
        </Slot>
      </Section>

      <Section title="FlatButton (→ Button 으로 옮기는 중)">
        <Slot cap="기본">
          <FlatButton>닫기</FlatButton>
        </Slot>
        <Slot cap="ghost">
          <FlatButton ghost>건너뛰기</FlatButton>
        </Slot>
        <Slot cap="dunno">
          <FlatButton variant="dunno" on={dunno} onClick={() => setDunno(!dunno)}>
            모르겠어요
          </FlatButton>
        </Slot>
      </Section>

      <Section title="Toast · LiveRegion · RichText">
        <Slot cap="toast">
          <FlatButton onClick={() => setToastOn(!toastOn)}>토스트 {toastOn ? '끄기' : '켜기'}</FlatButton>
        </Slot>
        <Slot cap="live">
          <LiveRegion text="정답입니다. 숙련도 3단계. Space 로 다음." />
          <span>(화면에는 안 보인다)</span>
        </Slot>
        <Slot cap="rich">
          <RichText html="<b>const</b> 는 <code>재대입</code>만 막는다" />
        </Slot>
      </Section>

      <Toast msg="학습에서 나왔습니다." sub="진행은 저장됐습니다. 돌아오면 3번째 문제부터" on={toastOn} />
    </div>
  );
}

/** DEV 가 아니면 아무것도 그리지 않는다. */
export function Gallery() {
  if (!import.meta.env.DEV) return null;
  return <GalleryBody />;
}
