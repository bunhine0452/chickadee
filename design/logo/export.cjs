/* 확정 로고에서 파생 에셋을 내보낸다 — 디자인은 건드리지 않는다.
   실행: node export.cjs   (playwright 가 필요: npx playwright install chromium) */
const fs = require('node:fs'), path = require('node:path');
function pw(){ try { return require('playwright'); } catch (e) {
  try { return require('@playwright/test'); } catch (e2) { /* 아래 캐시를 마저 본다 */ }
  const cache = path.join(process.env.HOME || '', '.npm/_npx');
  for (const d of fs.existsSync(cache) ? fs.readdirSync(cache) : []) { const p = path.join(cache, d, 'node_modules/playwright'); if (fs.existsSync(p)) return require(p); }
  throw new Error('playwright 를 찾지 못했습니다: npm i playwright 또는 npx playwright install chromium'); } }
const { chromium } = pw();
const DIR = __dirname, PNG = path.join(DIR, 'png');
const FILES = { badge: 'chickadee-logo-badge.svg', square: 'chickadee-logo-square.svg', favicon: 'chickadee-logo-favicon.svg', nobg: 'chickadee-logo-no-background.svg', macos: 'chickadee-logo-macos.svg', macos16: 'chickadee-logo-macos-16.svg', master: 'chickadee-logo.svg' };
/* icns 가 요구하는 열 장 (16~512 와 각각의 @2x). 512@2x = 1024. */
const ICNS = [[16,1],[16,2],[32,1],[32,2],[128,1],[128,2],[256,1],[256,2],[512,1],[512,2]];
(async () => {
  const browser = await chromium.launch();
  fs.mkdirSync(PNG, { recursive: true });
  const exp = async (name, sizes, prefix) => { const svg = fs.readFileSync(path.join(DIR, name), 'utf8');
    for (const z of sizes) { const p = await browser.newPage({ viewport: { width: z, height: z }, deviceScaleFactor: 1 });
      await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${z}px;height:${z}px}</style>` + svg);
      await p.screenshot({ path: path.join(PNG, `${prefix}-${z}.png`), omitBackground: true }); await p.close(); } };
  await exp(FILES.badge, [1024, 512, 256, 128, 64, 48, 32], 'badge');
  await exp(FILES.square, [1024, 512, 256], 'square');
  await exp(FILES.favicon, [64, 48, 32, 16], 'favicon');
  await exp(FILES.nobg, [1024, 512, 256, 128, 64, 32], 'nobg');
  await exp(FILES.macos, [1024, 512, 256, 128, 64, 32], 'macos');
  await exp(FILES.macos16, [32, 16], 'macos16');

  /* 앱이 쓰는 PNG 도 같은 타일로 (D135). Windows 의 `icon.ico`·`Square*Logo.png` 는
     정사각 그대로 둔다 — 그쪽 타일은 시스템이 배경을 깔아 주는 자리다. */
  const ICONS = path.join(DIR, '..', '..', 'apps/desktop/src-tauri/icons');
  for (const [from, to] of [['macos-1024', 'icon'], ['macos-256', '128x128@2x'], ['macos-128', '128x128'], ['macos-64', '64x64'], ['macos-32', '32x32']]) {
    fs.copyFileSync(path.join(PNG, `${from}.png`), path.join(ICONS, `${to}.png`));
  }

  /* macOS 앱 아이콘 (D135) — iconset 열 장을 굽고 `iconutil` 로 icns 를 만든다.
     iconutil 은 macOS 에만 있으므로 다른 OS 에서는 건너뛴다: icns 는 커밋된 산출물이다. */
  if (process.platform === 'darwin') {
    const svg = fs.readFileSync(path.join(DIR, FILES.macos), 'utf8');
    /* 16px 슬롯만 머리 크롭이다 — 전신 배지는 16px 에서 3단 판정을 통과하지 못한다
       (design/logo/README.md 「16px 판정」). 32px 부터는 배지 그대로. */
    const svg16 = fs.readFileSync(path.join(DIR, FILES.macos16), 'utf8');
    const set = path.join(DIR, 'Chickadee.iconset');
    fs.rmSync(set, { recursive: true, force: true }); fs.mkdirSync(set, { recursive: true });
    for (const [pt, scale] of ICNS) {
      const px = pt * scale;
      const p = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
      await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${px}px;height:${px}px}</style>` + (px < 32 ? svg16 : svg));
      await p.screenshot({ path: path.join(set, `icon_${pt}x${pt}${scale === 2 ? '@2x' : ''}.png`), omitBackground: true });
      await p.close();
    }
    const out = path.join(ICONS, 'icon.icns');
    require('node:child_process').execFileSync('iconutil', ['-c', 'icns', set, '-o', out]);
    fs.rmSync(set, { recursive: true, force: true });
    console.log('icon.icns ←', FILES.macos);
  }

  /* 대조 시트 + 16px 3단 판정 (캡→뺨→턱받이 : 먹→종이→먹 열 수와 흰 띠 높이) */
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
  const svgs = Object.entries(FILES).map(([k, n]) => ({ k, name: n, svg: fs.readFileSync(path.join(DIR, n), 'utf8') }));
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
  body{margin:0;padding:26px;background:#D9CDB4;font:13px/1.4 "IBM Plex Mono",ui-monospace,Menlo,monospace;color:#221D18}
  h1{font:700 18px/1.2 "IBM Plex Sans KR",-apple-system,sans-serif;margin:0 0 14px}
  .card{background:#F7F1E3;border:2.5px solid #221D18;box-shadow:5px 6px 0 rgba(34,29,24,.3);padding:14px 16px;margin-bottom:16px}
  .row{display:flex;align-items:flex-end;gap:22px;flex-wrap:wrap}
  .sz{display:flex;flex-direction:column;align-items:center;gap:5px}
  .sz img{display:block;background:#FDFAF0;border:1px solid rgba(34,29,24,.35)}
  .sz img.dk{background:#1F1915}.sz img.kr{background:#D9CDB4}
  .px{image-rendering:pixelated}.name{font-weight:700;margin-bottom:8px}.v{margin-top:8px;font-size:12px}
  .ok{color:#0F3F9E;font-weight:700}.no{color:#960B42;font-weight:700}
  </style><h1>Chickadee 확정 로고 — 파생 에셋 · 크기 사다리 · 16px 판정</h1><div id="g"></div>`);
  const results = await page.evaluate(async (svgs) => {
    const load = (svg) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
    const raster = (im, size, bg) => { const c = document.createElement('canvas'); c.width = size; c.height = size; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0,0,size,size); x.drawImage(im, 0, 0, size, size); return c; };
    const test = (c) => { const size = c.width, d = c.getContext('2d').getImageData(0,0,size,size).data;
      const px = (x,y) => { const i=(y*size+x)*4; return [d[i],d[i+1],d[i+2]]; };
      const K = (x,y) => Math.max(...px(x,y)) < 96; const W = (x,y) => { const [r,g,b]=px(x,y); return (0.2126*r+0.7152*g+0.0722*b)/255 > 0.72; };
      let cols=0, tall=0, ascii=[]; for (let y=0;y<size;y++){ let l=''; for (let x=0;x<size;x++) l += K(x,y)?'#':(W(x,y)?'.':'+'); ascii.push(l); }
      for (let x=0;x<size;x++){ let st=0,run=0,best=0; for (let y=0;y<size;y++){ const k=K(x,y), w=W(x,y); if(st===0&&k)st=1; else if(st===1&&w){st=2;run=1;} else if(st===2&&w)run++; else if(st===2&&k){best=Math.max(best,run);st=3;break;} } if(st===3){cols++; tall=Math.max(tall,best);} }
      return { cols, tall, pass: cols>=2 && tall>=2, ascii: ascii.join('\n') }; };
    const g = document.getElementById('g'); const out = [];
    for (const s of svgs){
      const im = await load(s.svg);
      const sizes = s.k === 'favicon' ? [64,48,32,24,16] : [256,128,64,32,16];
      const card = document.createElement('div'); card.className='card';
      let row = `<div class="name">${s.name}</div><div class="row">`;
      const tests = {};
      for (const z of sizes){ const c = raster(im, z, '#FDFAF0'); const t = test(c); tests[z] = { cols:t.cols, cheek:t.tall, pass:t.pass, ascii: z<=24 ? t.ascii : undefined };
        const disp = z <= 32 ? z*4 : z; row += `<div class="sz"><img class="${z<=32?'px':''}" src="${c.toDataURL()}" width="${disp}" height="${disp}"><span>${z}px${z<=32?' ×4':''}</span></div>`; }
      if (s.k === 'badge') { row += `<div class="sz"><img class="dk" src="${raster(im,128,'#1F1915').toDataURL()}" width="128" height="128"><span>야간반 판지</span></div><div class="sz"><img class="kr" src="${raster(im,128,'#D9CDB4').toDataURL()}" width="128" height="128"><span>크라프트 책상</span></div>`; }
      row += '</div><div class="v">' + sizes.filter(z=>z<=32).map(z => `${z}px: 3단 열 ${tests[z].cols} · 뺨 ${tests[z].cheek}px → <span class="${tests[z].pass?'ok':'no'}">${tests[z].pass?'합격':'불합격'}</span>`).join(' &nbsp; ') + '</div>';
      card.innerHTML = row; g.appendChild(card); out.push({ name: s.name, tests });
    }
    return out;
  }, svgs);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(DIR, 'contact-sheet.png'), fullPage: true });
  fs.writeFileSync(path.join(DIR, 'verify.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results.map(r => ({ name: r.name, t: Object.fromEntries(Object.entries(r.tests).filter(([z])=>+z<=32).map(([z,v])=>[z, `${v.cols}열/${v.cheek}px/${v.pass?'PASS':'fail'}`])) }))));
  await browser.close();
})();
