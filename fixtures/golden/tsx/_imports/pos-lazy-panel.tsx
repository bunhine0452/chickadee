export { CartTotal } from './CartTotal';

export async function loadStockPanel() {
  const mod = await import('./StockPanel');
  return mod.StockPanel;
}
