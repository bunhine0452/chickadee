import { FREE_OVER, SHIPPING } from './shipping';

export function shippingFee(total: number, express: boolean) {
  const base = express ? SHIPPING.express.fee : SHIPPING.standard.fee;
  return total >= FREE_OVER ? 0 : base;
}
