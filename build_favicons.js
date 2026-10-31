const sharp = require('./node_modules/sharp');
const fs = require('fs');

const origPath = 'C:/Users/Ankit Vermaaa/.gemini/antigravity/brain/a8d8f652-e8db-4558-a3ca-8a7edd8d099c/.user_uploaded/media_1793452383324_eacb30ec.png';

function pointToLineDistance(p, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p.x - p1.x, p.y - p1.y);
  return Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x) / len;
}

function rdp(points, epsilon) {
  if (points.length <= 2) return points;
  let dmax = 0;
  let index = 0;
  const p1 = points[0];
  const p2 = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointToLineDistance(points[i], p1, p2);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }
  if (dmax > epsilon) {
    const rec1 = rdp(points.slice(0, index + 1), epsilon);
    const rec2 = rdp(points.slice(index), epsilon);
    return rec1.slice(0, -1).concat(rec2);
  } else {
    return [p1, p2];
  }
}

function simplifyClosedLoop(loop, epsilon) {
  if (loop.length < 4) return loop;
  let maxD = 0;
  let splitIdx = Math.floor(loop.length / 2);
  for (let i = 1; i < loop.length; i++) {
    const d = Math.hypot(loop[i].x - loop[0].x, loop[i].y - loop[0].y);
    if (d > maxD) {
      maxD = d;
      splitIdx = i;
    }
  }
  const part1 = rdp(loop.slice(0, splitIdx + 1), epsilon);
  const part2 = rdp(loop.slice(splitIdx).concat([loop[0]]), epsilon);
  return part1.slice(0, -1).concat(part2.slice(0, -1));
}

async function buildAll() {
  const { data, info } = await sharp(origPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  
  const bin = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    bin[i] = data[i * 4 + 3] > 120 ? 1 : 0;
  }
  
  const getPixel = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return 0;
    return bin[y * w + x];
  };
  
  const edgeMap = new Map();
  function addEdge(x1, y1, x2, y2) {
    edgeMap.set(`${x1},${y1}`, { x: x2, y: y2 });
  }
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (getPixel(x, y) === 1) {
        if (getPixel(x, y - 1) === 0) addEdge(x, y, x + 1, y);
        if (getPixel(x + 1, y) === 0) addEdge(x + 1, y, x + 1, y + 1);
        if (getPixel(x, y + 1) === 0) addEdge(x + 1, y + 1, x, y + 1);
        if (getPixel(x - 1, y) === 0) addEdge(x, y + 1, x, y);
      }
    }
  }
  
  const loops = [];
  const visited = new Set();
  
  for (const [startKey, target] of edgeMap.entries()) {
    if (visited.has(startKey)) continue;
    
    const loop = [];
    let curKey = startKey;
    const [startX, startY] = startKey.split(',').map(Number);
    loop.push({ x: startX, y: startY });
    visited.add(startKey);
    
    let next = target;
    while (next) {
      loop.push({ x: next.x, y: next.y });
      curKey = `${next.x},${next.y}`;
      if (curKey === startKey) break;
      if (visited.has(curKey)) break;
      visited.add(curKey);
      next = edgeMap.get(curKey);
    }
    
    if (loop.length > 10) {
      loops.push(loop);
    }
  }
  
  const simplifiedLoops = loops.map(l => simplifyClosedLoop(l, 0.75));
  
  let minX = 10000, maxX = 0, minY = 10000, maxY = 0;
  for (const loop of simplifiedLoops) {
    for (const p of loop) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  
  // Fit into 512x512 with 10% breathing room
  const targetW = 410;
  const scale = targetW / contentW;
  const targetH = contentH * scale;
  const padX = (512 - targetW) / 2;
  const padY = (512 - targetH) / 2;
  
  const transformedLoops = simplifiedLoops.map(loop => {
    return loop.map(p => ({
      x: Number(((p.x - minX) * scale + padX).toFixed(1)),
      y: Number(((p.y - minY) * scale + padY).toFixed(1))
    }));
  });
  
  let pathD = '';
  for (const l of transformedLoops) {
    pathD += `M ${l[0].x} ${l[0].y} ` + l.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z ';
  }
  
  // Modern SVG Favicon with dark/light mode preference
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <style>
    path {
      fill: #1b1b1a;
    }
    @media (prefers-color-scheme: dark) {
      path {
        fill: #ffffff;
      }
    }
  </style>
  <path d="${pathD.trim()}" fill-rule="evenodd"/>
</svg>`;
  
  fs.writeFileSync('favicon.svg', svgContent);
  fs.writeFileSync('assets/branding-logo.svg', svgContent);
  console.log('Saved favicon.svg & assets/branding-logo.svg');
  
  // Render PNGs from the vector at native resolutions
  const renderSvgAt = async (size, fillColor = '#1b1b1a') => {
    const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path d="${pathD.trim()}" fill="${fillColor}" fill-rule="evenodd"/>
    </svg>`;
    return await sharp(Buffer.from(rawSvg))
      .resize(size, size)
      .png()
      .toBuffer();
  };
  
  const p16 = await renderSvgAt(16);
  const p32 = await renderSvgAt(32);
  const p48 = await renderSvgAt(48);
  const p192 = await renderSvgAt(192);
  const p512 = await renderSvgAt(512);
  
  fs.writeFileSync('favicon-16x16.png', p16);
  fs.writeFileSync('favicon-32x32.png', p32);
  fs.writeFileSync('favicon-48x48.png', p48);
  fs.writeFileSync('android-chrome-192x192.png', p192);
  fs.writeFileSync('android-chrome-512x512.png', p512);
  
  fs.writeFileSync('assets/branding-logo.png', p512);
  const webpBuffer = await sharp(p512).avif({ quality: 95 }).toBuffer();
  fs.writeFileSync('assets/branding-logo.avif', webpBuffer);
  
  // Apple Touch Icon (180x180):
  // Clean luxury dark squircle (#000000 background with crisp white logo)
  const whiteLogo126 = await renderSvgAt(126, '#ffffff');
  const appleTouchBuffer = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 1 }
    }
  })
  .composite([{
    input: whiteLogo126,
    gravity: 'center'
  }])
  .png()
  .toBuffer();
  
  fs.writeFileSync('apple-touch-icon.png', appleTouchBuffer);
  
  // Multi-resolution favicon.ico (16, 32, 48)
  function createIco(images) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // ICO
    header.writeUInt16LE(images.length, 4);
    
    let offset = 6 + images.length * 16;
    const dirEntries = [];
    for (const img of images) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
      entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
      entry.writeUInt8(0, 2); // color count
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bpp
      entry.writeUInt32LE(img.buffer.length, 8); // size
      entry.writeUInt32LE(offset, 12); // offset
      dirEntries.push(entry);
      offset += img.buffer.length;
    }
    return Buffer.concat([header, ...dirEntries, ...images.map(img => img.buffer)]);
  }
  
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 }
  ]);
  
  fs.writeFileSync('favicon.ico', icoBuffer);
  fs.writeFileSync('assets/favicon.ico', icoBuffer);
  
  const manifest = {
    name: "IntelliHome",
    short_name: "IntelliHome",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#000000",
    background_color: "#ffffff",
    display: "standalone"
  };
  fs.writeFileSync('site.webmanifest', JSON.stringify(manifest, null, 2));
  console.log('Build complete!');
}

buildAll();
