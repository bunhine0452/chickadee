export function nameList(users: User[]) {
  const names = users.map((user) => user.name.trim());
  return names.join(', ');
}
