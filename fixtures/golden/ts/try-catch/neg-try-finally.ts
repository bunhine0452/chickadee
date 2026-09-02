// catch 절이 없는 try — 잡지 않고 정리만 한다.
export async function withLock(run: () => Promise<void>) {
  await lock.acquire();
  try {
    await run();
  } finally {
    lock.release();
  }
}
