# 동봉 서체 — 출처와 재현 방법

05 §1.4 · D7. **서브셋 없음**(OFL 예약 서체명 RFN), 네트워크 0, `styles/fonts.css` 의 `@font-face` 9개가 이 파일들을 가리킨다.
「설정 › 정보」에 고지 한 줄이 들어간다. MIT 앱 안의 OFL 동봉은 허용된다.

| 파일 | 서체 · 굵기 | 라이선스 |
|---|---|---|
| `IBMPlexSansKR-{Regular,Medium,SemiBold,Bold}.woff2` | IBM Plex Sans KR 400·500·600·700 | `OFL-Plex.txt` (SIL OFL 1.1, RFN "Plex") |
| `IBMPlexMono-{Regular,Medium,SemiBold,Bold}.woff2` | IBM Plex Mono 400·500·600·700 | `OFL-Plex.txt` |
| `BlackHanSans-Regular.woff2` | Black Han Sans 400 | `OFL-BlackHanSans.txt` (SIL OFL 1.1, RFN "Black Han Sans") |

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

# Black Han Sans
https://raw.githubusercontent.com/google/fonts/main/ofl/blackhansans/BlackHanSans-Regular.ttf
https://raw.githubusercontent.com/google/fonts/main/ofl/blackhansans/OFL.txt   → OFL-BlackHanSans.txt
```

## Black Han Sans 만 컨테이너 변환을 거쳤다 — 왜, 무엇을 안 했는지

`google/fonts` 의 `ofl/blackhansans/` 에는 **woff2 가 없다**(TTF 하나뿐). 업스트림
`zesstype/Black-Han-Sans` 도 `.ttf`·`.otf` 만 둔다. `fonts.gstatic.com` 이 주는 woff2 는
한국어 **서브셋**이라 05 §1.4 가 금지한다. 그래서 원본 TTF 를 받아 **무손실 컨테이너 변환**만 했다:

```sh
npx -y ttf2woff2@6.0.1 < BlackHanSans-Regular.ttf > BlackHanSans-Regular.woff2
```

- 글리프를 하나도 빼지 않았다 — 원본 `numGlyphs` 2734 그대로. 서브셋이 아니다.
- WOFF2 사양이 요구하는 대로 `DSIG` 테이블만 빠진다(15 → 14 테이블). `totalSfntSize` 998,400 B.
- `name` 테이블을 건드리지 않아 서체명은 "Black Han Sans" 그대로다 — RFN 문제 없음.

`OFL-Plex.txt` 는 IBM Plex 릴리스의 `LICENSE.txt` 그대로이고 Sans KR·Mono 두 가족을 함께 덮는다.

## 다시 받기

이 디렉터리를 통째로 지운 뒤 위 URL 로 다시 받으면 된다. CDN 링크로 대체하지 말 것 — 오프라인
결정(D7)과 충돌하고, CDN 서브셋은 글리프가 바뀌어 행 길이 실측(05 §9)이 흔들린다.
