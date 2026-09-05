/**
 * 비트 배열의 **결정론 빌더**. `bitsOf(0.1, 'f64')` 처럼 값에서 그림이 나온다 —
 * 손으로 적은 비트열을 두지 않는다(diagrams.md §2 원칙 1).
 *
 * `stored` 는 반올림 없는 정확한 십진 전개다. `0.1` 을 f64 로 담으면
 * `0.1000000000000000055511151231257827021181583404541015625` 가 나오고,
 * 그 55자리가 「왜 안 떨어지나」의 답이다 — 요약하면 수업이 사라진다.
 */
import type { BitsField, BitsFieldKind, BitsModel, NumType } from './types';

interface Layout {
  width: number;
  signed: boolean;
  /** 실수면 지수 비트 수, 정수면 0. */
  exp: number;
}

const LAYOUT: Readonly<Record<NumType, Layout>> = {
  i8: { width: 8, signed: true, exp: 0 },
  i16: { width: 16, signed: true, exp: 0 },
  i32: { width: 32, signed: true, exp: 0 },
  i64: { width: 64, signed: true, exp: 0 },
  u8: { width: 8, signed: false, exp: 0 },
  u16: { width: 16, signed: false, exp: 0 },
  u32: { width: 32, signed: false, exp: 0 },
  u64: { width: 64, signed: false, exp: 0 },
  f32: { width: 32, signed: true, exp: 8 },
  f64: { width: 64, signed: true, exp: 11 },
};

/**
 * 묶음 이름의 기본값. **한국어가 정본**이고, 화면이 `t()` 로 덮어쓸 수 있게 인자로 뚫어 뒀다
 * (`bitsOf(v, t, { labels })`). 사전 키가 생기면 이 상수는 폴백으로만 남는다.
 */
export const BITS_LABELS_KO: Readonly<Record<BitsFieldKind, string>> = {
  sign: '부호',
  exponent: '지수',
  mantissa: '가수',
  magnitude: '크기',
};

export interface BitsOptions {
  /** 소스에 적힌 대로의 글자. 없으면 값을 그대로 찍는다. */
  literal?: string | undefined;
  labels?: Partial<Record<BitsFieldKind, string>> | undefined;
}

/** 실수 하나의 **정확한** 십진 전개. 2진 분수는 유한하므로 언제나 끝이 있다. */
export function exactDecimal(x: number): string {
  if (!Number.isFinite(x)) return String(x);
  if (x === 0) return Object.is(x, -0) ? '-0' : '0';
  const neg = x < 0;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, Math.abs(x));
  const hi = view.getUint32(0);
  const lo = view.getUint32(4);
  const rawExp = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xf_ffff) << 32n) | BigInt(lo);
  let e: number;
  if (rawExp === 0) {
    e = -1074; // 비정규화 — 앞의 1 이 없다
  } else {
    mant |= 1n << 52n;
    e = rawExp - 1075;
  }
  let out: string;
  if (e >= 0) {
    out = (mant << BigInt(e)).toString();
  } else {
    // 값 = mant / 2^k = (mant · 5^k) / 10^k — 10 의 거듭제곱으로 나누는 것은 자리 옮기기다.
    const k = -e;
    const digits = (mant * 5n ** BigInt(k)).toString().padStart(k + 1, '0');
    const cut = digits.length - k;
    const frac = digits.slice(cut).replace(/0+$/, '');
    out = frac.length > 0 ? `${digits.slice(0, cut)}.${frac}` : digits.slice(0, cut);
  }
  return neg ? `-${out}` : out;
}

/** 실수를 IEEE 754 비트로. `f32` 는 한 번 좁혔다 넓히므로 그 자체가 손실을 보여 준다. */
function floatBits(value: number, width: number): { bits: string; stored: number } {
  const view = new DataView(new ArrayBuffer(8));
  if (width === 32) {
    view.setFloat32(0, value);
    return { bits: view.getUint32(0).toString(2).padStart(32, '0'), stored: view.getFloat32(0) };
  }
  view.setFloat64(0, value);
  const hi = BigInt(view.getUint32(0));
  const lo = BigInt(view.getUint32(4));
  return { bits: ((hi << 32n) | lo).toString(2).padStart(64, '0'), stored: view.getFloat64(0) };
}

function intFields(layout: Layout, label: (k: BitsFieldKind) => string, bits: string): BitsField[] {
  if (!layout.signed) {
    return [{ kind: 'magnitude', label: label('magnitude'), from: 0, to: layout.width, note: '부호 비트가 없다 — 음수를 담을 자리가 없다' }];
  }
  const negative = bits.startsWith('1');
  return [
    {
      kind: 'sign',
      label: label('sign'),
      from: 0,
      to: 1,
      note: negative ? '1 이라 음수다 (2의 보수)' : '0 이라 0 이거나 양수다 (2의 보수)',
    },
    { kind: 'magnitude', label: label('magnitude'), from: 1, to: layout.width },
  ];
}

function floatFields(layout: Layout, label: (k: BitsFieldKind) => string, bits: string): BitsField[] {
  const bias = (1 << (layout.exp - 1)) - 1;
  const raw = Number.parseInt(bits.slice(1, 1 + layout.exp), 2);
  const sub = raw === 0;
  return [
    { kind: 'sign', label: label('sign'), from: 0, to: 1, note: bits.startsWith('1') ? '1 이라 음수다' : '0 이라 양수다' },
    {
      kind: 'exponent',
      label: label('exponent'),
      from: 1,
      to: 1 + layout.exp,
      note: sub ? '전부 0 — 비정규화된 수다' : `편향 ${bias} 을 빼면 2^${raw - bias}`,
    },
    {
      kind: 'mantissa',
      label: label('mantissa'),
      from: 1 + layout.exp,
      to: layout.width,
      note: sub ? '앞이 0. 으로 읽힌다' : '앞의 1. 은 저장하지 않는다',
    },
  ];
}

/** 문항의 값은 **문자열**이다(`FundValue.v`) — `3` 과 `3.0` 을 number 로 들면 구별이 사라진다. */
function toNumber(value: number | bigint | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function toBigInt(value: number | bigint | string): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string') {
    // '3' 은 그대로, '3.0' 은 자릿수를 잃지 않는 길이 없으므로 잘라서 든다.
    try {
      return BigInt(value.trim());
    } catch {
      return BigInt(Math.trunc(Number(value)));
    }
  }
  return BigInt(Math.trunc(value));
}

/**
 * 값 하나를 비트 배열 모델로. 정수는 폭에 안 들어가면 감기고(`wrapped`),
 * 실수는 적은 값과 저장된 값이 다르면 `lossy` 가 참이 된다.
 *
 * `value` 에 **문자열**을 줄 수 있고 그쪽이 문항의 정본이다 — `FundValue` 가
 * `{t:'float', v:'3.0'}` 처럼 값을 문자열로 들기 때문이다. 그때 적힌 글자가 `literal` 이 되어
 * `3` 과 `3.0` 이 화면에서 갈린다.
 */
export function bitsOf(value: number | bigint | string, type: NumType, opts: BitsOptions = {}): BitsModel {
  const layout = LAYOUT[type];
  const label = (k: BitsFieldKind): string => opts.labels?.[k] ?? BITS_LABELS_KO[k];
  const literal = opts.literal ?? String(value);

  if (layout.exp > 0) {
    const asNumber = toNumber(value);
    const { bits, stored } = floatBits(asNumber, layout.width);
    const exact = exactDecimal(stored);
    return {
      type,
      width: layout.width,
      bits,
      fields: floatFields(layout, label, bits),
      literal,
      stored: exact,
      lossy: !sameDecimal(literal, exact),
      wrapped: false,
    };
  }

  const whole = toBigInt(value);
  const fitted = layout.signed ? BigInt.asIntN(layout.width, whole) : BigInt.asUintN(layout.width, whole);
  const bits = BigInt.asUintN(layout.width, whole).toString(2).padStart(layout.width, '0');
  return {
    type,
    width: layout.width,
    bits,
    fields: intFields(layout, label, bits),
    literal,
    stored: fitted.toString(),
    lossy: false,
    wrapped: fitted !== whole || !Number.isInteger(toNumber(value)),
  };
}

/** 적은 글자와 저장된 값이 같은 수인가 — `'0.50'` 과 `'0.5'` 는 같다. */
function sameDecimal(literal: string, stored: string): boolean {
  const norm = (s: string): string => {
    const t = s.trim().replace(/^\+/, '');
    if (!/^-?\d*\.?\d+$/.test(t)) return t;
    const [i = '', f = ''] = t.split('.');
    const int = i.replace(/^(-?)0+(?=\d)/, '$1') || '0';
    const frac = f.replace(/0+$/, '');
    return frac.length > 0 ? `${int}.${frac}` : int;
  };
  return norm(literal) === norm(stored);
}

/**
 * 낭독기 한 문장. 비트가 「1 0 1 1…」로 읽히면 쓸모없다 — **무엇을 뜻하는지**를 먼저 말한다
 * (diagrams.md §5).
 */
export function describeBits(model: BitsModel, phase: 'predict' | 'reveal' = 'reveal'): string {
  const head = `${model.width}비트 ${model.type} 로 담은 ${model.literal}`;
  const parts = model.fields.map((f) => `${f.label} ${f.to - f.from}비트`).join(', ');
  if (phase === 'predict') return `${head}. 묶음은 ${parts}. 비트는 아직 가려져 있습니다.`;
  const tail = model.lossy
    ? `실제로 저장된 값은 ${model.stored} 로 적은 값과 다릅니다.`
    : model.wrapped
      ? `폭에 다 들어가지 않아 ${model.stored} 로 감겼습니다.`
      : `적은 값과 저장된 값이 ${model.stored} 로 같습니다.`;
  return `${head}. 묶음은 ${parts}. ${tail}`;
}
