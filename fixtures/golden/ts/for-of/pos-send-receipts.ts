import { mailReceipt } from './mail';

export async function sendReceipts(orders: Order[]) {
  for (const order of orders) {
    await mailReceipt(order.email, order.id);
  }
}
