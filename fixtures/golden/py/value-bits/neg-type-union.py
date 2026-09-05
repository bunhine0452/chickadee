def find(name: str | None) -> list[str]:
    if name is None:
        return []
    return [name]


def merge(left: set, right: set) -> set:
    return left.union(right)
