import sys
data = sys.stdin.read().split()
xs = [int(x) for x in data[1:]]
big = xs[0]
small = xs[0]
for x in xs:
    if x > big:
        big = x
    if x < small:
        small = x
print(str(big) + " " + str(small))
