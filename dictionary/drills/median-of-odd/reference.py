import sys
data = sys.stdin.read().split()
n = int(data[0])
xs = sorted(int(x) for x in data[1:])
print(xs[n // 2])
