# 동봉 서체 — 출처와 재현 방법

05 §1.4 · D7 · D182. **서브셋 없음**(OFL 예약 서체명 RFN), 네트워크 0,
`styles/fonts.css` 의 `@font-face` 8개가 이 파일들을 가리킨다.
「설정 › 정보」에 고지 한 줄이 들어간다. MIT 앱 안의 OFL 동봉은 허용된다.

| 파일 | 서체 · 굵기 | 라이선스 |
|---|---|---|
| `IBMPlexSansKR-{Regular,Medium,SemiBold,Bold}.woff2` | IBM Plex Sans KR 400·500·600·700 | `OFL-Plex.txt` (SIL OFL 1.1, RFN "Plex") |
| `IBMPlexMono-{Regular,Medium,SemiBold,Bold}.woff2` | IBM Plex Mono 400·500·600·700 | `OFL-Plex.txt` |

합계 8파일 1.80 MB(비압축). 05 §1.3 의 폰트 예산은 9 MB 다.

## 왜 이 두 벌인가 (2026-09-05 재검토, D182)

정본 §6 이 「읽기용 하나 + 코드용 하나, 디스플레이 서체 없음」으로 닫았다. 후보를 다시
재고 **Plex 두 벌을 유지**했다. 셈은 `fontTools` 로 직접 잰 것이다.

| 잰 것 | IBM Plex Sans KR | IBM Plex Mono | Black Han Sans (폐기) |
|---|---|---|---|
| 현대 한글 음절 (U+AC00~U+D7A3) | **11,172 / 11,172** | 0 | 2,581 / 11,172 |
| 한글 자모 | 51 / 51 | 0 | 51 / 51 |
| ASCII | 95 / 95 | 95 / 95 | 94 / 95 |
| upem · x높이 · 대문자높이 | 1000 · 516 · 698 | 1000 · **516 · 698** | 1000 · 600 · 750 |
| 굵기 | 4 (400·500·600·700) | 4 | **1 (400)** |
| 파일 | 4파일 1.65 MB | 4파일 0.20 MB | 1파일 0.19 MB |

- **Plex Sans KR 은 현대 한글을 전부 덮는다.** 조건(한글+라틴 한 벌 · 굵기 최소 셋 ·
  OFL 재배포 가능 · 번들 오프라인)을 이미 만족하므로 바꿀 값이 없다.
- **Plex Mono 와 x높이·대문자높이가 같다**(516 · 698, upem 1000). 이 앱은 산문과 코드가
  한 화면에 나란히 서므로 두 서체의 기준선이 어긋나면 눈이 매 줄 다시 맞춰야 한다.
  다른 한글 서체를 골랐다면 이 값이 갈라진다.
- **Pretendard(OFL, 9굵기, 한글 11,172자)를 후보로 재고 채택하지 않았다.** 덮는 범위가
  같은데 파일이 늘고(정적 3굵기 ≈3.3 MB, 지금의 약 2배), 짝이 되는 모노가 없어 위의
  기준선 일치를 잃는다. 굵기 9는 이 시스템이 쓰는 3(400·500·700)보다 많다.
- **Black Han Sans 를 지웠다.** 굵기가 400 하나뿐이라 `h1`~`h3` 의 기본 굵게가 합성 굵게를
  불러 한글 제목이 검은 상자로 찍혔고(D183), 한글 음절도 23%(2,581/11,172)만 덮었다.

`--fw-*` 토큰이 쓰는 굵기는 셋(400·500·700)이다. 600(SemiBold) 파일은 D182 이전 CSS 가
아직 참조하고 있어 남겨 두었다 — 새 규칙에서는 쓰지 않는다.

## 정확한 출처 URL

```
# IBM Plex Sans KR — 릴리스 zip 의 fonts/complete/woff2/hinted/ (원본 woff2, 서브셋 아님)
https://github.com/IBM/plex/releases/download/%40ibm%2Fplex-sans-kr%401.1.0/ibm-plex-sans-kr.zip
  → ibm-plex-sans-kr/fonts/complete/woff2/hinted/IBMPlexSansKR-Regular.woff2
  → …/IBMPlexSansKR-Medium.woff2  …/IBMPlexSansKR-SemiBold.woff2  …/IBMPlexSansKR-Bold.woff2
  → ibm-plex-sans-kr/LICENSE.txt                       → OFL-Plex.txt

# IBM Plex Mono — 릴리스 zip 의 fonts/complete/woff2/ (원본 woff2, 서브셋 아님)
https://github.com/IBM/plex/releases/download/%40ibm%2Fplex-mono%402.5.0/ibm-plex-mono.zip
  → ibm-plex-mono/fonts/complete/woff2/IBMPlexMono-Regular.woff2
  → …/IBMPlexMono-Medium.woff2  …/IBMPlexMono-SemiBold.woff2  …/IBMPlexMono-Bold.woff2
```

`OFL-Plex.txt` 는 IBM Plex 릴리스의 `LICENSE.txt` 그대로이고 Sans KR·Mono 두 가족을 함께 덮는다.
두 벌 다 컨테이너 변환 없이 상류 woff2 를 그대로 쓴다 — 서브셋도 이름 변경도 없다.

## 다시 재는 법

```sh
python3 - <<'EOF'
from fontTools.ttLib import TTFont
t = TTFont('apps/desktop/src/assets/fonts/IBMPlexSansKR-Regular.woff2', lazy=True)
cm = set(t.getBestCmap())
print(len(cm & set(range(0xAC00, 0xD7A4))), '/ 11172')
EOF
```

## 다시 받기

이 디렉터리를 통째로 지운 뒤 위 URL 로 다시 받으면 된다. CDN 링크로 대체하지 말 것 — 오프라인
결정(D7)과 충돌하고, CDN 서브셋은 글리프가 바뀌어 행 길이 실측(05 §9)이 흔들린다.
