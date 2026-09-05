import sys
n, k = (int(x) for x in sys.stdin.read().split())
print((n + k - 1) // k)
