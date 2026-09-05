SAMPLE = "if rows: save(rows)"
BLOCK = """
if rows:
    save(rows)
"""


def save(rows, store):
    if rows:
        store.write(rows)
