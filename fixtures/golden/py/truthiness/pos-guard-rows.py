def save(rows, store):
    if rows:
        store.write(rows)
    return rows
