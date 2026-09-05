RETRY_LIMIT = 3


def budget(count):
    return count * RETRY_LIMIT
