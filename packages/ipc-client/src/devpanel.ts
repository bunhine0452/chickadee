/** `?dev=1` 개발 패널이 읽는 명령별 왕복 시간 (01 §8 — invoke 왕복 예산). */
export interface CallSample { cmd: string; ms: number; at: number }

const RING = 200;

class DevPanel {
  #samples: CallSample[] = [];
  enabled = false;

  record(cmd: string, ms: number): void {
    if (!this.enabled) return;
    this.#samples.push({ cmd, ms, at: Date.now() });
    if (this.#samples.length > RING) this.#samples.shift();
  }

  samples(): readonly CallSample[] {
    return this.#samples;
  }

  /** 명령별 p95. 예산(WKWebView 2ms)을 넘는 명령을 눈으로 찾기 위한 것. */
  p95(): Record<string, number> {
    const by = new Map<string, number[]>();
    for (const s of this.#samples) {
      const list = by.get(s.cmd);
      if (list) list.push(s.ms);
      else by.set(s.cmd, [s.ms]);
    }
    const out: Record<string, number> = {};
    for (const [cmd, xs] of by) {
      xs.sort((a, b) => a - b);
      out[cmd] = xs[Math.min(xs.length - 1, Math.floor(xs.length * 0.95))] ?? 0;
    }
    return out;
  }

  reset(): void {
    this.#samples = [];
  }
}

export const devPanel = new DevPanel();
