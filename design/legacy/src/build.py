head = '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>박새 도감 — 학습 경로 홈</title>
<style>
'''
css = "".join(open(f).read() for f in ("fg-tokens.css","fg-base.css","fg-comp.css","fg-layout.css"))
out = head+css+"</style>\n</head>\n<body>\n"+open("fg-body.html").read()+"\n<script>\n"+open("fg-app.js").read()+"</script>\n</body>\n</html>\n"
open("fg-shell.html","w").write(out); print("built", len(out), "bytes")
