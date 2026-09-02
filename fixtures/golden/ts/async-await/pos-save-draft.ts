export const saveDraft = async (cart: Cart) => {
  await write(`draft-${cart.id}`, cart.items);
};
