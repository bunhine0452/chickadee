/**
 * `diagram.*` 키를 `DiagramLabels` 모양으로 묶는다 (D187 ⑳).
 *
 * **왜 함수인가.** 로케일은 모듈 상태이고 부팅이 한 번 정한다(D117). 상수로 만들면 이 파일이
 * 로드되는 시점의 로케일이 굳으므로, 부르는 쪽이 렌더마다 부른다 — 값 마흔아홉 개를 찍는
 * 일이라 비용이 없다.
 *
 * **왜 그림이 직접 `t()` 를 안 부르나.** 그림은 문항 화면 밖(단위 시험·문서 예제·그림만 떼어
 * 쓰는 자리)에서도 서야 하고, 그때 카탈로그를 끌고 오면 그림이 화면에 매인다. I2 가 그은
 * 선(「그림이 스스로 내는 것은 낱말뿐이고 화면이 `labels` 로 덮어쓴다」)을 그대로 지킨다.
 */
import { t } from '@chickadee/i18n';

import type { DiagramLabels } from './labels';

/** 지금 로케일의 그림 어휘. `<BitField labels={diagramLabels()} />` 로 넘긴다. */
export function diagramLabels(): DiagramLabels {
  return {
    prev: t('diagram.prev'),
    next: t('diagram.next'),
    hidden: t('diagram.hidden'),
    altTable: t('diagram.altTable'),

    bitUnit: t('diagram.bitUnit'),
    literal: t('diagram.literal'),
    stored: t('diagram.stored'),
    lossy: t('diagram.lossy'),
    wrapped: t('diagram.wrapped'),
    cut: t('diagram.cut'),
    kept: t('diagram.kept'),

    addr: t('diagram.addr'),
    offset: t('diagram.offset'),
    alias: t('diagram.alias'),
    windowLen: t('diagram.windowLen'),
    windowCap: t('diagram.windowCap'),

    args: t('diagram.args'),
    locals: t('diagram.locals'),
    unwind: t('diagram.unwind'),

    widen: t('diagram.widen'),
    narrow: t('diagram.narrow'),
    fallible: t('diagram.fallible'),

    permRead: t('diagram.permRead'),
    permWrite: t('diagram.permWrite'),
    permOwn: t('diagram.permOwn'),
    permHas: t('diagram.permHas'),
    permGained: t('diagram.permGained'),
    permLost: t('diagram.permLost'),
    permMissing: t('diagram.permMissing'),
    permNone: t('diagram.permNone'),
    needs: t('diagram.needs'),

    send: t('diagram.send'),
    recv: t('diagram.recv'),
    wait: t('diagram.wait'),
    lock: t('diagram.lock'),

    colField: t('diagram.colField'),
    colBits: t('diagram.colBits'),
    colMeaning: t('diagram.colMeaning'),
    colStep: t('diagram.colStep'),
    colName: t('diagram.colName'),
    colValue: t('diagram.colValue'),
    colAddr: t('diagram.colAddr'),
    colType: t('diagram.colType'),
    colEdge: t('diagram.colEdge'),
    colPlace: t('diagram.colPlace'),
    colLine: t('diagram.colLine'),
    colLane: t('diagram.colLane'),
    colCode: t('diagram.colCode'),
    colOrder: t('diagram.colOrder'),
  };
}
