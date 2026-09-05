// else 가 붙은 갈림.
export function label(ready: boolean) {
  if (ready) {
    return "ready";
  } else {
    return "waiting";
  }
}
