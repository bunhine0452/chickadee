def pages(total, size):
    return total // size


def offset(page, size):
    return page * size
