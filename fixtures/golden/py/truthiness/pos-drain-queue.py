def drain(queue):
    while queue:
        queue.pop()
    return queue
