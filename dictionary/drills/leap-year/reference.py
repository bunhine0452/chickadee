import sys
y = int(sys.stdin.read())
leap = (y % 4 == 0 and y % 100 != 0) or y % 400 == 0
print("yes" if leap else "no")
