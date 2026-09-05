// 타입 인자가 붙은 `await` 호출. tree-sitter 가 `(await api.get)<User>(…)` 로 접는 자리다.
import { api } from './client';
import { listen } from '@tauri-apps/api/event';

export async function loadUser(id: string) {
  const user = await api.get<User>(`/users/${id}`);
  const off = await listen<void>('user-changed', () => undefined);
  return { user, off };
}

interface User { id: string }
