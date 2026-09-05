import type { RepoId } from '@chickadee/ipc-client';

import { detectJava, runJava } from './java-runner.js';
import type { RunResult, RunSpec, RunnerProbe } from './runner.js';

/** 러너가 필요한 것은 id 와 경로뿐이다 — 장부 행 전체(`RepoInfo`)는 `store-sql` 에 있고 01 §2 의 의존 방향상 여기서 볼 수 없다. */
export interface RunnerRepo { id: RepoId; rootPath: string }

/**
 * 언어 하나를 실제로 돌리는 법 (D175). MVP 에서 이 자리는 비어 있었고 `t3_run` 은
 * 언제나 `NOT_IMPLEMENTED` 였다 — 정본 §2·§5 개정으로 열렸다.
 *
 * 어댑터가 아는 것은 **탐지와 실행**뿐이다. 프로세스·작업본·상한은 Rust 이고, 언제
 * 부를지와 통과선은 `runner.ts` 와 `stage.ts` 다. 언어를 늘릴 때 여기 항목이 하나
 * 늘고 Rust 는 0 줄이다.
 */
export interface RunnerAdapter {
  id: string;
  /** 이 컴퓨터에서 이 리포를 돌릴 수 있는가. 없다고 답하는 것은 오류가 아니다. */
  detect(repo: RunnerRepo): Promise<RunnerProbe>;
  run(spec: RunSpec, rootPath: string): Promise<RunResult>;
}

export const javaRunner: RunnerAdapter = {
  id: 'java',
  detect: (repo) => detectJava(repo.rootPath),
  run: runJava,
};

/** 지금 하나. 다음 언어는 여기 한 줄이다. */
export const runners: RunnerAdapter[] = [javaRunner];
