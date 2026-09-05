def run(client, given):
    return client.get(timeout=given or 30)
