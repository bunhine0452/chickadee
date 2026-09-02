export { formatWon } from './format';
export * from './shipping';

export async function loadChart() {
  const mod = await import('./chart');
  return mod.render;
}
