// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunPanel, type RunnerVersions } from './RunPanel';
import type { RunView } from '../../data/runner';

afterEach(cleanup);

const draw = (view: RunView, onRun?: () => void, found?: RunnerVersions) =>
  render(<RunPanel view={view} onRun={onRun} found={found} />).container;

describe('RunPanel', () => {
  it('실행 중에는 단추가 잠기고 시간이 걸릴 수 있다고 말한다', () => {
    const box = draw({ kind: 'running', first: false }, () => undefined);
    expect(box.querySelector('.run-panel')?.getAttribute('data-state')).toBe('running');
    expect(box.querySelector('.run-go')).toHaveProperty('disabled', true);
    expect(box.textContent).toContain('실행 중입니다');
  });

  it('통과는 개수와 걸린 시간을 낸다', () => {
    const box = draw({ kind: 'passed', passed: 7, durationMs: 4200, log: '', downloaded: false });
    expect(box.textContent).toContain('테스트 7개 전부 통과했습니다.');
    expect(box.textContent).toContain('4초');
  });

  it('실패는 실패한 테스트 이름과 메시지를 낸다', () => {
    const box = draw({
      kind: 'failed',
      passed: 1,
      failed: 1,
      failures: [{ test: 'x.AuthTest.rejects', message: 'expected 401 but was 200' }],
      durationMs: 3000,
      log: '> Task :test',
      downloaded: false,
    });
    expect(box.textContent).toContain('1개 실패, 1개 통과했습니다.');
    expect(box.querySelector('.run-fails code')?.textContent).toBe('x.AuthTest.rejects');
    expect(box.textContent).toContain('expected 401 but was 200');
    expect(box.querySelector('.run-log pre')?.textContent).toBe('> Task :test');
  });

  it('첫 실행은 무엇을 하는 중인지와 기다린 시간이 예산 밖임을 말한다', () => {
    const box = draw({ kind: 'running', first: true });
    expect(box.textContent).toContain('작업본을 만들고 처음부터 컴파일하고 있습니다');
    expect(box.textContent).toContain('오늘 학습 시간에 넣지 않습니다');
  });

  it('배포본을 받아도 되는지 묻고, 예·아니오를 그대로 넘긴다', () => {
    const said: boolean[] = [];
    const box = render(
      <RunPanel view={{ kind: 'ask-download', name: 'Gradle 8.7' }} onDownload={(y) => said.push(y)} />,
    ).container;
    expect(box.textContent).toContain('Gradle 8.7 배포본을 한 번 내려받아야 합니다.');
    expect(box.textContent).toContain('테스트 자체는 네트워크를 끄고 돌립니다');
    const [yes, no] = Array.from(box.querySelectorAll<HTMLButtonElement>('.run-ask .run-go'));
    yes?.click();
    no?.click();
    expect(said).toEqual([true, false]);
  });

  it('「아니오」 뒤에는 받지 않았다고 말한다 — 잘못했다고 하지 않는다', () => {
    const box = draw({ kind: 'no-runner', reason: 'not-detected' });
    expect(box.textContent).toContain('받지 않았습니다. 4·5단은 채점에서 뺍니다.');
    expect(box.textContent).not.toContain('설치');
  });

  it('러너가 없으면 이유를 말하되 설치를 권하지 않는다', () => {
    const box = draw({ kind: 'no-runner', reason: 'no-jdk' });
    expect(box.querySelector('.run-panel')?.getAttribute('data-state')).toBe('no-runner');
    expect(box.textContent).toContain('이 컴퓨터에서는 4·5단을 채점하지 않습니다.');
    expect(box.textContent).toContain('JDK 를 찾지 못했습니다.');
    expect(box.textContent).not.toContain('설치');
  });

  it('로그가 비면 접는 칸 자체를 그리지 않는다', () => {
    expect(draw({ kind: 'passed', passed: 1, durationMs: 900, log: '', downloaded: false }).querySelector('.run-log')).toBeNull();
  });

  it('단추를 안 주면 단추가 없다 — 결과만 보여 주는 자리', () => {
    expect(draw({ kind: 'idle' }).querySelector('.run-go')).toBeNull();
  });

  it('돌고 나면 오프라인이었다고 말한다 — 원본은 그대로다', () => {
    const box = draw({ kind: 'passed', passed: 1, durationMs: 900, log: '', downloaded: false });
    expect(box.textContent).toContain('네트워크를 끄고 임시 사본에서 돌렸습니다.');
  });

  it('배포본을 받았으면 그것도 말한다 — 유일한 예외를 감추지 않는다', () => {
    const box = draw({ kind: 'passed', passed: 1, durationMs: 900, log: '', downloaded: true });
    expect(box.textContent).toContain('Gradle 배포본을 내려받았습니다.');
    expect(box.textContent).not.toContain('네트워크를 끄고');
  });

  it('탐지가 읽은 버전을 곁들인다', () => {
    const box = draw({ kind: 'idle' }, undefined, { jdk: '21.0.4', gradle: '8.7' });
    expect(box.textContent).toContain('JDK 21.0.4 · Gradle 8.7');
  });

  it('Gradle 버전을 못 읽었으면 JDK 만 적는다', () => {
    const box = draw({ kind: 'idle' }, undefined, { jdk: '17' });
    expect(box.textContent).toContain('JDK 17');
    expect(box.textContent).not.toContain('Gradle');
  });

  it('누르면 부른다', () => {
    const hit = vi.fn();
    const box = draw({ kind: 'idle' }, hit);
    box.querySelector<HTMLButtonElement>('.run-go')?.click();
    expect(hit).toHaveBeenCalledOnce();
  });
});
