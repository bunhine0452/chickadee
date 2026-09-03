/**
 * LLM 키 상태 동사 셋 (06 §3.5 · D106).
 *
 * 재는 것은 둘이다: ① `none` · `stored` · `unavailable` 이 각각 언제 나오나
 * ② **키 값이 어디에도 안 남나**. ②가 이 파일의 절반인 이유는 06 §3.5 가 「키는 로그·
 * 크래시·내보내기에 절대 없다」를 테스트로 요구하기 때문이다 — 미끼 키 하나를 넣고
 * IPC 인자·로그·console·던져진 오류를 전부 훑는다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { secret, log } = vi.hoisted(() => ({
  secret: { set: vi.fn(), delete: vi.fn(), has: vi.fn() },
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
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
  log,
  on: () => Promise.resolve(() => undefined),
}));

const { dropKey, forgetKeyStore, keyState, storeKey } = await import('./llmKey.js');
const { LLM_ACCOUNT } = await import('./maintenance.js');

/**
 * 미끼 키. 이 글자가 IPC `secret.set` 의 두 번째 인자 **말고 어디에라도** 보이면 샌 것이다.
 * CI 게이트도 같은 글자를 찾는다 (보고 참조).
 */
const CANARY = 'sk-test-CHICKADEE-LEAK-CANARY-0001';

/** Rust 가 던지는 모양 그대로 — `{ code, message }`. */
const thrown = (code: string) =>
  Object.assign(new Error('비밀 저장소를 열지 못했습니다'), { code });

/** 모의로 나간 IPC 인자 전량. 「키가 여기 말고 또 있나」를 이걸로 훑는다. */
function ipcCallText(): string {
  return JSON.stringify([secret.set.mock.calls, secret.delete.mock.calls, secret.has.mock.calls]);
}

const consoleSpies: ReturnType<typeof vi.spyOn>[] = [];

beforeEach(() => {
  forgetKeyStore();
  secret.set.mockReset();
  secret.delete.mockReset();
  secret.has.mockReset();
  for (const fn of Object.values(log)) fn.mockReset();
  for (const name of ['log', 'warn', 'error', 'info', 'debug'] as const) {
    consoleSpies.push(vi.spyOn(console, name).mockImplementation(() => undefined));
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  consoleSpies.length = 0;
});

describe('keyState — 세 갈래', () => {
  it('키가 있으면 stored', async () => {
    secret.has.mockResolvedValue(true);
    await expect(keyState()).resolves.toBe('stored');
    expect(secret.has).toHaveBeenCalledWith(LLM_ACCOUNT);
  });

  it('키가 없으면 none', async () => {
    secret.has.mockResolvedValue(false);
    await expect(keyState()).resolves.toBe('none');
  });

  it('저장소가 없으면 unavailable — 그리고 다시 묻지 않는다', async () => {
    secret.has.mockRejectedValue(thrown('SECRET_STORE'));
    await expect(keyState()).resolves.toBe('unavailable');
    await expect(keyState()).resolves.toBe('unavailable');
    expect(secret.has).toHaveBeenCalledTimes(1);
  });

  it('저장소 실패는 SECRET_STORE 하나로만 판정한다 — UNKNOWN 을 끌어안지 않는다', async () => {
    // `IPC_ERROR_CODES` 가 SECRET_STORE 를 그대로 보존하므로 UNKNOWN 은 진짜 모르는 오류다.
    secret.has.mockRejectedValue(thrown('UNKNOWN'));
    await expect(keyState()).rejects.toThrow();
  });

  it('저장소 실패가 아닌 오류는 삼키지 않는다', async () => {
    secret.has.mockRejectedValue(thrown('STORE_BUSY'));
    await expect(keyState()).rejects.toThrow();
  });
});

describe('storeKey', () => {
  it('넣으면 stored 이고 계정 이름은 maintenance 의 것이다', async () => {
    secret.set.mockResolvedValue(undefined);
    await expect(storeKey(CANARY)).resolves.toBe('stored');
    expect(secret.set).toHaveBeenCalledWith(LLM_ACCOUNT, CANARY);
  });

  it('붙여넣기에 딸려 온 앞뒤 공백·줄바꿈은 자른다', async () => {
    secret.set.mockResolvedValue(undefined);
    await storeKey(`  ${CANARY}\n`);
    expect(secret.set).toHaveBeenCalledWith(LLM_ACCOUNT, CANARY);
  });

  it('빈 글자는 저장하지 않고 지금 상태를 그대로 돌려준다', async () => {
    secret.has.mockResolvedValue(false);
    await expect(storeKey('   ')).resolves.toBe('none');
    expect(secret.set).not.toHaveBeenCalled();
  });

  it('저장소가 없으면 unavailable 이고 그 사실을 기억한다', async () => {
    secret.set.mockRejectedValue(thrown('SECRET_STORE'));
    await expect(storeKey(CANARY)).resolves.toBe('unavailable');
    await expect(keyState()).resolves.toBe('unavailable');
    expect(secret.has).not.toHaveBeenCalled();
  });

  it('한 번 실패해도 다음에 성공하면 기억을 지운다', async () => {
    secret.set.mockRejectedValueOnce(thrown('SECRET_STORE'));
    await expect(storeKey(CANARY)).resolves.toBe('unavailable');
    secret.set.mockResolvedValue(undefined);
    await expect(storeKey(CANARY)).resolves.toBe('stored');
    secret.has.mockResolvedValue(true);
    await expect(keyState()).resolves.toBe('stored');
  });

  it('저장소 실패가 아닌 오류는 삼키지 않는다', async () => {
    secret.set.mockRejectedValue(thrown('BAD_INPUT'));
    await expect(storeKey(CANARY)).rejects.toThrow();
  });
});

describe('dropKey', () => {
  it('계정 하나를 지운다 — Rust 가 멱등하므로 상태를 먼저 묻지 않는다', async () => {
    secret.delete.mockResolvedValue(undefined);
    await dropKey();
    expect(secret.delete).toHaveBeenCalledWith(LLM_ACCOUNT);
    expect(secret.has).not.toHaveBeenCalled();
  });

  it('지우다 저장소가 없으면 그 사실을 기억한다', async () => {
    secret.delete.mockRejectedValue(thrown('SECRET_STORE'));
    await dropKey();
    await expect(keyState()).resolves.toBe('unavailable');
  });
});

describe('키 값은 어디에도 남지 않는다 (06 §3.5)', () => {
  it('성공한 저장에서 키가 보이는 곳은 secret.set 의 인자 하나뿐이다', async () => {
    secret.set.mockResolvedValue(undefined);
    secret.has.mockResolvedValue(true);
    await storeKey(CANARY);
    await keyState();
    await dropKey();

    // `set` 한 번을 빼면 IPC 인자 어디에도 없다.
    expect(JSON.stringify(secret.set.mock.calls)).toContain(CANARY);
    expect(JSON.stringify([secret.has.mock.calls, secret.delete.mock.calls])).not.toContain(CANARY);
    expect(ipcCallText().split(CANARY)).toHaveLength(2);

    // 로그·console 어디에도 없다.
    for (const fn of Object.values(log)) expect(fn).not.toHaveBeenCalled();
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  });

  it('저장에 실패해도 키가 오류·로그·console 로 새지 않는다', async () => {
    secret.set.mockRejectedValue(thrown('SECRET_STORE'));
    const state = await storeKey(CANARY);

    expect(state).toBe('unavailable');
    expect(JSON.stringify(state)).not.toContain(CANARY);
    for (const fn of Object.values(log)) expect(fn).not.toHaveBeenCalled();
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  });

  it('저장소 실패가 아닌 오류를 되던져도 그 오류에 키가 없다', async () => {
    secret.set.mockRejectedValue(thrown('BAD_INPUT'));
    const err = await storeKey(CANARY).catch((e: unknown) => e);
    expect(String(err)).not.toContain(CANARY);
    expect(JSON.stringify(err, Object.getOwnPropertyNames(err))).not.toContain(CANARY);
  });
});
