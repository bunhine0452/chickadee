// 갈림 안의 갈림.
export function route(loggedIn: boolean, admin: boolean) {
  if (loggedIn) {
    if (admin) {
      return "admin";
    }
    return "user";
  }
  return "guest";
}
