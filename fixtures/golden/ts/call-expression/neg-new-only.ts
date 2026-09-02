// `new F()` 는 new_expression 이라 호출로 잡히지 않는다.
export class Receipt {
  constructor(readonly orderId: string, readonly total: number) {}
}

const receipt = new Receipt('ord-1024', 32000);
const printed = receipt.orderId;
