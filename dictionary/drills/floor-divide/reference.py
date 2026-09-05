import sys
a, b = (int(x) for x in sys.stdin.read().split())
q = a // b
print(q)
print(a - q * b)
