export async function importOrders(path: string) {
  const file = await open(path);
  try {
    const rows = await file.readAll();
    try {
      return rows.map((row) => JSON.parse(row));
    } catch (err) {
      report(err);
      return [];
    }
  } finally {
    await file.close();
  }
}
