# 옛 판에서는 if rows: 로 통째로 걸렀다.
"""사양 초안:
    if rows:
        save(rows)
"""


def save(rows, store):
    if rows:
        store.write(rows)
