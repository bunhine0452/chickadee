def attempt(left, run):
    while left > 0:
        run()
        left -= 1
