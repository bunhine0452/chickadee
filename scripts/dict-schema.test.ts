import { readFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

import { build, OUT } from './dict-schema.js';

describe('사전 JSON Schema (D69)', () => {
  test('체크인된 파일이 zod 와 어긋나지 않는다', () => {
    expect(readFileSync(OUT, 'utf8')).toBe(build());
  });
});
