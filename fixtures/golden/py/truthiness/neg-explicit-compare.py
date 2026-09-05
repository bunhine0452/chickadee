def save(rows, store):
    if len(rows) > 0:
        store.write(rows)
    return rows
