import type { RepoId, RepoInfo } from '@chickadee/ipc-client';

/**
 * T3(버그 수리·재구현) 자리 — 인터페이스만 예약한다 (01 §9, 정본 §2 「유보」).
 *
 * T0~T2 는 실행 없이 채점되므로 전 언어 지원이 실제로 가능하다. T3 만이 프로세스 실행을 요구하고,
 * 그것은 Tauri `shell` 스코프와 샌드박스 결정을 끌고 온다 — MVP 밖이다.
 * 지금 있는 것은 이 타입과, 언제나 `NOT_IMPLEMENTED` 를 돌려주는 `t3_run` 명령뿐이다.
 */
export interface RunnerAdapter {
  id: string;
  detect(repo: RepoInfo, files: string[]): Promise<boolean>;
  run(spec: { repoId: RepoId; cmd: string[]; timeoutMs: number }): Promise<{
    passed: number;
    failed: number;
    log: string;
  }>;
}

/** MVP 에서 비어 있다. 러너가 들어오면 여기에 등록한다. */
export const runners: RunnerAdapter[] = [];
