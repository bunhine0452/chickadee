import { useState } from 'react';
import type { ReactNode } from 'react';
import { Dee } from '../dee/Dee';
import { DeeSprite } from '../dee/DeeSprite';
import { DEE_MOTIONS } from '../dee/useDeeMotion';
import type { DeeMotion } from '../dee/useDeeMotion';
import { FlatButton } from '../FlatButton';
import { Kbd } from '../Kbd';
import { LiveRegion } from '../LiveRegion';
import { Misreg } from '../Misreg';
import { Passes } from '../Passes';
import { Pill } from '../Pill';
import { PressButton } from '../PressButton';
import { Reg } from '../Reg';
import { RichText } from '../RichText';
import { Say } from '../Say';
import { Stamp } from '../Stamp';
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
const LAYERS: readonly InkLayer[] = [0, 1, 2, 3, 4];
const MOTIONS = Object.keys(DEE_MOTIONS) as readonly DeeMotion[];

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
  const [trim, setTrim] = useState<'off' | 'on'>('off');
  const [dunno, setDunno] = useState(false);
  const [toastOn, setToastOn] = useState(true);
  const [motion, setMotion] = useState<DeeMotion>('hop');
  const [nonce, setNonce] = useState(0);

  return (
    <div className="gallery" data-theme={theme} data-trim={trim}>
      <DeeSprite />
      <h1>UI 진열대</h1>

      <Section title="테마 · 부속">
        <Switch
          options={[
            { v: 'light', label: '주간반' },
            { v: 'dark', label: '야간반' },
          ]}
          value={theme}
          label="주간반 · 야간반"
          onChange={setTheme}
        />
        <Switch
          options={[
            { v: 'off', label: '부속 보임' },
            { v: 'on', label: '부속 숨김' },
          ]}
          value={trim}
          label="부속 보임 · 숨김"
          onChange={setTrim}
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

      <Section title="Pill">
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

      <Section title="Passes">
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

      <Section title="PressButton">
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

      <Section title="FlatButton">
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

      <Section title="Reg · Stamp · Misreg (인쇄 물리 — 본문 단 밖)">
        <Slot cap="reg">
          <Reg />
        </Slot>
        <Slot cap="reg.hit">
          <Reg hit />
        </Slot>
        <Slot cap="정합">
          <Stamp text="정합" sub="EXACT" hit />
        </Slot>
        <Slot cap="동등">
          <Stamp text="동등" sub="EQUIV" tone="blue" rotate={5} />
        </Slot>
        <Slot cap="어긋남">
          <Stamp text="어긋남" sub="DIFFER" tone="yellow" rotate={-9} />
        </Slot>
        <Slot cap="big">
          <Stamp text="인쇄 완료" big />
        </Slot>
        <Slot cap="misreg">
          <Misreg as="b" text="5판" />
        </Slot>
      </Section>

      <Section title="Say · Toast · LiveRegion · RichText">
        <Slot cap="say">
          <Say>다음은 이 판이에요</Say>
        </Slot>
        <Slot cap="toast">
          <FlatButton onClick={() => setToastOn(!toastOn)}>토스트 {toastOn ? '끄기' : '켜기'}</FlatButton>
        </Slot>
        <Slot cap="live">
          <LiveRegion text="정합 — 맞았습니다. 잉크 3겹. Space 로 다음." />
          <span>(화면에는 안 보인다)</span>
        </Slot>
        <Slot cap="rich">
          <RichText html="<b>const</b> 는 <code>재대입</code>만 막는다" />
        </Slot>
      </Section>

      <Section title="Dee — 겹 0~4">
        {LAYERS.map((ly) => (
          <Slot key={ly} cap={`ly=${ly}`}>
            <Dee ly={ly} size={64} sticker />
          </Slot>
        ))}
      </Section>

      <Section title="Dee — 심볼 · 크기">
        <Slot cap="badge 64">
          <Dee ly={4} size={64} />
        </Slot>
        <Slot cap="bird 56">
          <Dee ly={4} symbol="bird" size={56} />
        </Slot>
        <Slot cap="head 18">
          <Dee ly={4} symbol="badge" size={18} />
        </Slot>
      </Section>

      <Section title="Dee — 습성 동작">
        {MOTIONS.map((m) => (
          <Slot key={m} cap={`${m} ${DEE_MOTIONS[m].durationMs}ms`}>
            <Dee ly={4} size={56} motion={motion === m ? m : null} motionNonce={nonce} />
          </Slot>
        ))}
        <Slot cap="재생">
          <FlatButton
            onClick={() => {
              const at = MOTIONS.indexOf(motion);
              const next = MOTIONS[(at + 1) % MOTIONS.length];
              if (next !== undefined) setMotion(next);
              setNonce(nonce + 1);
            }}
          >
            다음 동작
          </FlatButton>
        </Slot>
        <Slot cap="타이핑 중">
          <Dee ly={4} size={56} motion="hop" typing />
        </Slot>
      </Section>

      <Toast msg="세션에서 나왔습니다." sub="진행은 저장됐습니다. 돌아오면 3번째 판부터" on={toastOn} />
    </div>
  );
}

/** DEV 가 아니면 아무것도 그리지 않는다. */
export function Gallery() {
  if (!import.meta.env.DEV) return null;
  return <GalleryBody />;
}
