import sys
lines = sys.stdin.read().split("\n")
want = lines[0][0]
text = lines[1] if len(lines) > 1 else ""
count = 0
for ch in text:
    if ch == want:
        count += 1
print(count)
