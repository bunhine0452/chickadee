def drain(queue):
    while len(queue) > 0:
        queue.pop()
