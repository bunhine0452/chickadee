import { describe, expect, it } from 'vitest';

import { runners } from './index.js';
import { migrations } from '@chickadee/store-sql';

describe('T3 자리', () => {
  it('러너는 자바 하나다 (D175 — MVP 의 빈 배열을 대신한다)', () => {
    expect(runners.map((r) => r.id)).toEqual(['java']);
  });

  it('스키마가 track 열거형에 t3 를 예약해 둔다 (01 §9)', () => {
    const sql = migrations[0]?.sql ?? '';
    expect(sql).toMatch(/track\s+TEXT\s+NOT NULL CHECK \(track IN \('t0','t1','t2','t3'\)\)/);
    expect(sql).toMatch(/kind\s+TEXT\s+NOT NULL CHECK \(kind IN \([^)]*'repair','reimpl'\)\)/);
  });
});
