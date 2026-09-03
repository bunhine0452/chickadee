"""잉크 목업 빌드 — 토큰·기본 조판·Dee 심볼의 단일 출처는 이 디렉터리다.
   각 페이지 템플릿(*.src.html)의 <!-- @include name --> 를 인라인해
   자립형 HTML(외부 의존성 0, 폰트 CDN 제외)을 design/ 에 낸다.  실행: python3 build.py

   design/ink-home.html · design/ink-session.html 은 **생성물**이다. 고칠 곳은 여기다:
     tokens.css        토큰(주간/야간) — 앱도 scripts/sync-design.mjs 로 이 파일을 읽는다 (05 §12)
     base.css          리셋·조판 강제·종이 결·판 어긋남·Dee 잉크 겹
     mascot.svg.html   하프톤 스크린 + Dee 심볼 정의 (앱은 assets/mascot.svg 로 복사한다)
"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
DESIGN = os.path.abspath(os.path.join(HERE, '..', '..'))

def include(name):
    p = os.path.join(HERE, name)
    if not os.path.exists(p): sys.exit(f'build: include 파일 없음 {name}')
    return open(p, encoding='utf-8').read().rstrip('\n')

def build(src_name):
    src = open(os.path.join(HERE, src_name), encoding='utf-8').read()
    out = re.sub(r'<!-- @include ([\w.\-]+) -->', lambda m: include(m.group(1)), src)
    dest = os.path.join(DESIGN, src_name.replace('.src.html', '.html'))
    open(dest, 'w', encoding='utf-8').write(out)
    print(f'{os.path.relpath(dest, DESIGN):24s} {len(out.encode()):7d} B')

if __name__ == '__main__':
    targets = sys.argv[1:] or sorted(f for f in os.listdir(HERE) if f.endswith('.src.html'))
    for t in targets: build(t)
