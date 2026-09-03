// @vitest-environment jsdom
/**
 * 설정 「LLM 키」 칸 (06 §3.5 · D106).
 *
 * 재는 것은 셋이다: ① 세 상태가 각자의 말을 하나 ② **「보내기」가 어느 상태에도 없나**
 * (D106 — MVP 는 전송하지 않는다. 없는 기능을 그리면 여기서 빨개진다) ③ 넣은 키가
 * DOM 어디에도 안 남나(성공했을 때도, 실패했을 때도).
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { secret } = vi.hoisted(() => ({
  secret: { set: vi.fn(), delete: vi.fn(), has: vi.fn() },
}));

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    secret,
    store: {
      query: () => Promise.resolve([]),
      exec: () => Promise.resolve({}),
      batch: () => Promise.resolve([]),
    },
  },
  IpcError: class extends Error { code = 'X'; },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  on: () => Promise.resolve(() => undefined),
}));

const { KeyPanel } = await import('./KeyPanel.js');
const { forgetKeyStore } = await import('../../data/llmKey.js');
const { LLM_ACCOUNT } = await import('../../data/maintenance.js');

/** 미끼 키 — 화면 어디에도 이 글자가 보이면 샌 것이다. */
const CANARY = 'sk-test-CHICKADEE-LEAK-CANARY-0001';

const thrown = (code: string) =>
  Object.assign(new Error('비밀 저장소를 열지 못했습니다'), { code });

/** 지금 화면에 실제로 그려진 글자 전량. */
const shown = () => document.body.textContent ?? '';

beforeEach(() => {
  forgetKeyStore();
  secret.set.mockReset().mockResolvedValue(undefined);
  secret.delete.mockReset().mockResolvedValue(undefined);
  secret.has.mockReset().mockResolvedValue(false);
});

afterEach(cleanup);

describe('KeyPanel — 세 상태', () => {
  it('키 없음 — 키가 없어도 프롬프트 복사가 된다고 먼저 말한다', async () => {
    render(<KeyPanel />);

    expect(await screen.findByText(/아무것도 스스로 전송하지 않습니다/)).toBeTruthy();
    expect(screen.getByText(/키가 없어도 그대로 됩니다/)).toBeTruthy();
    expect(screen.getByText(/0\.2 에서 열립니다/)).toBeTruthy();
    expect(screen.getByLabelText('API 키')).toBeTruthy();
    expect(screen.getByRole('button', { name: '저장' })).toBeTruthy();
  });

  it('키 있음 — 「저장돼 있습니다」와 「0.2 에서 열립니다」, 그리고 지우기뿐이다', async () => {
    secret.has.mockResolvedValue(true);
    render(<KeyPanel />);

    expect(await screen.findByText(/이 컴퓨터의 키체인에 저장돼 있습니다/)).toBeTruthy();
    expect(screen.getByText(/보내기는 0\.2 에서 열립니다/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '지우기' })).toBeTruthy();
    // 값을 보여 주는 문은 없다.
    expect(screen.queryByLabelText('API 키')).toBeNull();
  });

  it('저장 불가 — Secret Service 가 없으면 그렇게 말하고 입력을 열지 않는다', async () => {
    secret.has.mockRejectedValue(thrown('SECRET_STORE'));
    render(<KeyPanel />);

    expect(await screen.findByText(/안전하게 저장할 수 없습니다\(Secret Service 없음\)/)).toBeTruthy();
    expect(screen.getByText(/프롬프트 복사는 그대로 됩니다/)).toBeTruthy();
    expect(screen.queryByLabelText('API 키')).toBeNull();
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  });

  it('어느 상태에도 「보내기」가 없다 (D106 — MVP 는 전송하지 않는다)', async () => {
    for (const has of [false, true]) {
      secret.has.mockResolvedValue(has);
      render(<KeyPanel />);
      await screen.findByText(has ? /저장돼 있습니다/ : /전송하지 않습니다/);
      for (const label of ['보내기', '전송', '물어보기', '대화']) {
        expect(screen.queryByRole('button', { name: label })).toBeNull();
      }
      cleanup();
    }
  });
});

describe('KeyPanel — 저장과 삭제', () => {
  it('저장하면 키체인으로 가고 화면은 「저장돼 있습니다」로 바뀐다', async () => {
    const user = userEvent.setup();
    render(<KeyPanel />);

    await user.type(await screen.findByLabelText('API 키'), CANARY);
    secret.has.mockResolvedValue(true);
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(secret.set).toHaveBeenCalledWith(LLM_ACCOUNT, CANARY);
    expect(await screen.findByText(/키를 저장했습니다/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '지우기' })).toBeTruthy();
    expect(screen.queryByLabelText('API 키')).toBeNull();
  });

  it('빈 칸이면 「저장」이 잠긴다 — 빈 키를 키체인에 넣지 않는다', async () => {
    render(<KeyPanel />);
    const save = await screen.findByRole('button', { name: '저장' });
    expect(save.hasAttribute('disabled')).toBe(true);
  });

  it('지우면 키체인에서 빠지고 화면은 「키 없음」으로 돌아온다', async () => {
    const user = userEvent.setup();
    secret.has.mockResolvedValue(true);
    render(<KeyPanel />);

    await screen.findByRole('button', { name: '지우기' });
    secret.has.mockResolvedValue(false);
    await user.click(screen.getByRole('button', { name: '지우기' }));

    expect(secret.delete).toHaveBeenCalledWith(LLM_ACCOUNT);
    expect(await screen.findByText(/키를 지웠습니다/)).toBeTruthy();
    expect(screen.getByLabelText('API 키')).toBeTruthy();
  });

  it('저장이 실패하면 「저장 불가」로 바뀌고 값을 되돌려 보여 주지 않는다', async () => {
    const user = userEvent.setup();
    secret.set.mockRejectedValue(thrown('SECRET_STORE'));
    render(<KeyPanel />);

    await user.type(await screen.findByLabelText('API 키'), CANARY);
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText(/안전하게 저장할 수 없습니다/)).toBeTruthy();
    expect(shown()).not.toContain(CANARY);
    expect(document.body.innerHTML).not.toContain(CANARY);
  });
});

describe('KeyPanel — 키 값은 화면에 남지 않는다 (06 §3.5)', () => {
  it('입력은 password 이고 자동완성을 끄며 붙여넣기를 막지 않는다', async () => {
    const user = userEvent.setup();
    render(<KeyPanel />);
    const input = (await screen.findByLabelText('API 키')) as HTMLInputElement;

    expect(input.type).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('off');

    await user.click(input);
    await user.paste(CANARY);
    expect(input.value).toBe(CANARY);
  });

  it('저장한 뒤에는 DOM 어디에도 키가 없다', async () => {
    const user = userEvent.setup();
    render(<KeyPanel />);

    await user.type(await screen.findByLabelText('API 키'), CANARY);
    secret.has.mockResolvedValue(true);
    await user.click(screen.getByRole('button', { name: '저장' }));
    await screen.findByText(/키를 저장했습니다/);

    expect(shown()).not.toContain(CANARY);
    expect(document.body.innerHTML).not.toContain(CANARY);
  });
});
