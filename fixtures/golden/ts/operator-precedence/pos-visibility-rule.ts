// `그리고` 쪽이 `또는` 쪽보다 세다.
export function visible(pinned: boolean, ready: boolean, loaded: boolean) {
  return pinned || ready && loaded;
}
