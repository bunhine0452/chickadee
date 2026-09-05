// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Forecast } from './Forecast';

afterEach(cleanup);

describe('Forecast', () => {
  it('later 는 다음 대지 번호와 읽은 파일 수를 적는다', () => {
    render(<Forecast pending={41} variant="later" nextNo={5} />);
    expect(screen.getByText('5대 ~')).toBeTruthy();
    expect(screen.getByText(/아직 판이 짜이지 않았습니다/)).toBeTruthy();
    expect(screen.getByText('41개')).toBeTruthy();
    expect(screen.getByText('미조판')).toBeTruthy();
  });

  it('cannot 은 커밋이 필요한 종(책임 배치)만 못 짠다고 적는다 (D170 ⑤)', () => {
    render(<Forecast pending={2} variant="cannot" />);
    expect(screen.getByText(/책임 배치 판은 아직 짤 수 없습니다/)).toBeTruthy();
    expect(screen.getByText('2개')).toBeTruthy();
    expect(screen.getByText('불가')).toBeTruthy();
  });
});
