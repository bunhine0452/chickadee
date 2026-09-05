import sys
a, b, c = (float(x) for x in sys.stdin.read().split())
print("yes" if a + b == c else "no")
