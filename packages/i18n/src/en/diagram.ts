/**
 * `ko/diagram.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). 조사 필터는 쓰지 않는다.
 *
 * 격자 칸에 들어가는 낱말이라 **짧은 쪽을 고른다** — 권한 셋은 `read`·`write`·`own`,
 * 상태 다섯은 `has`·`gained`·`lost`·`required`·`none`. 「없는데 요구됨」을 `missing` 이
 * 아니라 `required, not held` 로 푼 이유는 `none`(없음)과 한 글자도 안 겹쳐야 해서다.
 */
export const diagram: Record<string, string> = {
  'diagram.prev': 'Back',
  'diagram.next': 'Next',
  'diagram.hidden': 'hidden',
  'diagram.altTable': 'The diagram as a table',

  /* 앞의 공백은 오타가 아니다 — 폭 표시가 `${수}${단위}` 로 붙는다(`52비트` · `52 bits`). */
  'diagram.bitUnit': ' bits',
  'diagram.literal': 'Written',
  'diagram.stored': 'Stored',
  'diagram.lossy': 'differs from what was written',
  'diagram.wrapped': 'did not fit the width and wrapped',
  'diagram.cut': 'cut',
  'diagram.kept': 'kept',

  'diagram.addr': 'Address',
  'diagram.offset': 'Distance',
  'diagram.alias': 'alias',
  'diagram.windowLen': 'len',
  'diagram.windowCap': 'cap',

  'diagram.args': 'Args',
  'diagram.locals': 'Locals',
  'diagram.unwind': 'Runs as the frame unwinds',

  'diagram.widen': 'widens',
  'diagram.narrow': 'truncates',
  'diagram.fallible': 'may fail',

  'diagram.permRead': 'read',
  'diagram.permWrite': 'write',
  'diagram.permOwn': 'own',
  'diagram.permHas': 'held',
  'diagram.permGained': 'gained',
  'diagram.permLost': 'lost',
  'diagram.permMissing': 'required, not held',
  'diagram.permNone': 'none',
  'diagram.needs': 'What this line requires',

  'diagram.send': 'send',
  'diagram.recv': 'receive',
  'diagram.wait': 'wait',
  'diagram.lock': 'lock',

  'diagram.colField': 'Field',
  'diagram.colBits': 'Bits',
  'diagram.colMeaning': 'Meaning',
  'diagram.colStep': 'Step',
  'diagram.colName': 'Name',
  'diagram.colValue': 'Value',
  'diagram.colAddr': 'Address',
  'diagram.colType': 'Type',
  'diagram.colEdge': 'Edge',
  'diagram.colPlace': 'Place',
  'diagram.colLine': 'Line',
  'diagram.colLane': 'Lane',
  'diagram.colCode': 'Code',
  'diagram.colOrder': 'Order',
};
