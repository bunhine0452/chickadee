import { IPC_ERROR_CODES } from '@chickadee/ipc-client';
import { describe, expect, test } from 'vitest';

import { actionLabel, errorCopy, isInternal } from './error-copy.js';
import { RICH_TEXT_ALLOWED_TAGS } from './RichText.js';

describe('오류 문구 표 (01 §6)', () => {
  test('오류 코드 전부에 문구가 있다', () => {
    for (const code of IPC_ERROR_CODES) {
      const copy = errorCopy(code);
      expect(copy, code).toBeDefined();
      if (!isInternal(code)) expect(copy.title.length, code).toBeGreaterThan(0);
    }
  });

  test('사용자에게 보이는 문구에 코드 이름이 새지 않는다', () => {
    for (const code of IPC_ERROR_CODES) {
      const copy = errorCopy(code);
      expect(`${copy.title} ${copy.detail ?? ''}`).not.toContain(code);
    }
  });

  test('문구의 태그는 허용 목록 안이다 (06 §4.2)', () => {
    for (const code of IPC_ERROR_CODES) {
      const copy = errorCopy(code);
      const tags = [...`${copy.title} ${copy.detail ?? ''}`.matchAll(/<\/?([a-z]+)/g)];
      for (const [, tag] of tags) {
        expect(RICH_TEXT_ALLOWED_TAGS as readonly string[]).toContain(tag);
      }
    }
  });

  test('다음 동작에는 버튼 라벨이 있다', () => {
    for (const code of IPC_ERROR_CODES) {
      const { action } = errorCopy(code);
      if (action !== null) expect(actionLabel(action)).toBeTruthy();
    }
  });

  test('옮긴 리포는 위치를 묻고, 바뀐 히스토리는 다시 읽는다', () => {
    expect(errorCopy('REPO_PATH_MISSING').action).toBe('relocate');
    expect(errorCopy('GIT_COMMIT_NOT_FOUND').action).toBe('reingest');
  });

  test('내부 오류는 화면에 나가지 않는다', () => {
    for (const code of ['STORE_BUSY', 'BAD_INPUT', 'STORE_CATALOG_MISSING'] as const) {
      expect(isInternal(code)).toBe(true);
    }
  });

  test('모르는 코드는 UNKNOWN 으로 떨어진다', () => {
    expect(errorCopy('NOPE' as never).title).toBe(errorCopy('UNKNOWN').title);
  });
});
