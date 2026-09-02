import './Forecast.css';

export interface ForecastProps {
  /**
   * 이 변형이 세는 수. `later` 는 지금까지 읽은 파일 수, `cannot` 은 리포의 커밋 수다.
   * 「대기 중인 기능 N개」는 아직 셀 수 있는 데이터가 없어 쓰지 않는다.
   */
  pending: number;
  /**
   * `later` = 아직 판이 짜이지 않았다(커밋이 쌓이면 늘어난다).
   * `cannot` = 이 리포로는 T2 를 짤 수 없다 (05 §2.1 `first-run` 변형).
   */
  variant: 'later' | 'cannot';
  /** 다음 대지 번호. 목업의 `5대 ~`. */
  nextNo?: number | undefined;
}

/** `.forecast` — 「미조판 예고」. 빈 자리를 정직하게 적는다. */
export function Forecast({ pending, variant, nextNo }: ForecastProps) {
  const cannot = variant === 'cannot';
  return (
    <div className="forecast">
      <span className="fc-sig">{cannot || nextNo === undefined ? '—' : `${nextNo}대 ~`}</span>
      {cannot ? (
        <p>
          <b>이 리포로는 T2 를 짤 수 없습니다.</b> 구조를 물으려면 커밋이 더 필요합니다. 지금
          커밋은 <b>{pending}개</b>입니다.
        </p>
      ) : (
        <p>
          <b>아직 판이 짜이지 않았습니다.</b> 커밋이 쌓이면 소스를 다시 읽어 대지를 자동으로
          늘립니다. 지금 읽은 파일은 <b>{pending}개</b>입니다.
        </p>
      )}
      <span className="fc-mark">{cannot ? '불가' : '미조판'}</span>
    </div>
  );
}
