"""잉크 목업 빌드 — 토큰·기본 조판·Dee 심볼은 ink-home.html 이 단일 출처다.
   각 페이지 템플릿(*.src.html)의 <!-- @base-css --> · <!-- @base-svg --> · <!-- @include name --> 를 인라인해
   자립형 HTML(외부 의존성 0, 폰트 CDN 제외)을 design/ 에 낸다.  실행: python3 build.py"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
DESIGN = os.path.abspath(os.path.join(HERE, '..', '..'))
HOME = os.path.join(DESIGN, 'ink-home.html')

def slice_between(text, start, end, what):
    i = text.find(start); j = text.find(end, i + 1)
    if i < 0 or j < 0: sys.exit(f'build: ink-home.html 에서 {what} 경계를 찾지 못했습니다 ({start!r} … {end!r})')
    return text[i:j]

def base_css(home):
    # 토큰(주간/야간) → 리셋·조판 강제 → 종이 결 → 판 어긋남 → Dee 잉크 겹 (앱 프레임 직전까지)
    return slice_between(home, '/* ───────── 토큰 : 주간반', '/* ═══════════ 앱 프레임', '기본 CSS')

def base_svg(home):
    # 하프톤 스크린 3종 + Dee 심볼 정의 블록
    block = slice_between(home, '<!-- ════ 공용 SVG 정의', '<div class="press">', '공용 SVG')
    return block.rstrip()

def include(name):
    p = os.path.join(HERE, name)
    if not os.path.exists(p): sys.exit(f'build: include 파일 없음 {name}')
    return open(p, encoding='utf-8').read().rstrip('\n')

def build(src_name):
    home = open(HOME, encoding='utf-8').read()
    src = open(os.path.join(HERE, src_name), encoding='utf-8').read()
    out = src.replace('<!-- @base-css -->', base_css(home)).replace('<!-- @base-svg -->', base_svg(home))
    out = re.sub(r'<!-- @include ([\w.\-]+) -->', lambda m: include(m.group(1)), out)
    dest = os.path.join(DESIGN, src_name.replace('.src.html', '.html'))
    open(dest, 'w', encoding='utf-8').write(out)
    print(f'{os.path.relpath(dest, DESIGN):24s} {len(out.encode()):7d} B')

if __name__ == '__main__':
    targets = sys.argv[1:] or sorted(f for f in os.listdir(HERE) if f.endswith('.src.html'))
    for t in targets: build(t)
