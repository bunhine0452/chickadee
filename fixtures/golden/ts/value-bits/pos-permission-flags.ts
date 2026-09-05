// 권한을 한 수에 담아 두고 자리마다 켜고 끈다.
const READ = 1 << 0;
const WRITE = 1 << 1;
const ADMIN = 1 << 2;

export function grant(current: number, ...added: number[]) {
  let next = current;
  for (const flag of added) next = next | flag;
  return next;
}

export const can = (bits: number, flag: number) => (bits & flag) !== 0;
