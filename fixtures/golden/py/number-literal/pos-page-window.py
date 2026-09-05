def window():
    size = 20
    return size


def fetch(client):
    return client.get(timeout=30)
