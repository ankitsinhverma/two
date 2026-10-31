const fs = require('fs');
const path = require('path');

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html') && f !== 'googlec73d23b9db81d2a9.html');
const sitemapXml = fs.readFileSync('sitemap.xml', 'utf8');

console.log('=== MULTI-PILLAR AUDIT START ===\n');

// ----------------------------------------------------
// PILLAR 1: INDEXING AUDIT
// ----------------------------------------------------
console.log('--- 1. INDEXING AUDIT ---');
const sitemapUrls = [];
const sitemapLocRegex = /<loc>(https:\/\/www\.intellihome\.in\/[^<]*)<\/loc>/g;
let m;
while ((m = sitemapLocRegex.exec(sitemapXml)) !== null) {
  sitemapUrls.push(m[1]);
}

htmlFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  
  // Canonical check
  const canonMatch = c.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const canonUrl = canonMatch ? canonMatch[1] : 'MISSING';
  
  // Robots check
  const robotsMatch = c.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  const robots = robotsMatch ? robotsMatch[1] : 'MISSING';
  const hasNoIndex = robots.includes('noindex');

  // Sitemap presence
  const expectedUrl = f === 'index.html' ? 'https://www.intellihome.in/' : `https://www.intellihome.in/${f}`;
  const inSitemap = sitemapUrls.includes(expectedUrl);

  console.log(`${f}:`);
  console.log(`  Canonical: ${canonUrl} (${canonUrl === expectedUrl ? 'MATCH' : 'MISMATCH!'})`);
  console.log(`  Robots: ${robots} (noindex: ${hasNoIndex ? 'YES - WARNING' : 'NO'})`);
  console.log(`  In sitemap.xml: ${inSitemap ? 'YES' : 'NO - WARNING'}`);
});

// ----------------------------------------------------
// PILLAR 2: PERFORMANCE AUDIT (Images, Fonts, Scripts)
// ----------------------------------------------------
console.log('\n--- 2. PERFORMANCE AUDIT ---');
htmlFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  
  // Scripts check
  const renderBlockingScripts = [];
  const scriptRegex = /<script(?![^>]*application\/ld\+json)([^>]*)src=["']([^"']+)["']([^>]*)>/gi;
  let sm;
  while ((sm = scriptRegex.exec(c)) !== null) {
    const attrs = sm[1] + ' ' + sm[3];
    const isAsync = attrs.includes('async');
    const isDefer = attrs.includes('defer');
    if (!isAsync && !isDefer) {
      renderBlockingScripts.push(sm[2]);
    }
  }

  // Large or unoptimized images
  const eagerImages = [];
  const missingAltImages = [];
  const imgRegex = /<img([^>]*)>/gi;
  let im;
  while ((im = imgRegex.exec(c)) !== null) {
    const attrs = im[1];
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
    const loadingMatch = attrs.match(/loading=["']([^"']+)["']/i);
    
    if (srcMatch) {
      const src = srcMatch[1];
      if (!altMatch || !altMatch[1].trim()) {
        missingAltImages.push(src);
      }
      if (!loadingMatch || loadingMatch[1] !== 'lazy') {
        eagerImages.push(src);
      }
    }
  }

  // Fonts check
  const fontPreload = c.includes('rel="preconnect"') || c.includes('rel="preload"');

  console.log(`${f}:`);
  console.log(`  Render-blocking external scripts: ${renderBlockingScripts.length ? renderBlockingScripts.join(', ') : 'None'}`);
  console.log(`  Images without lazy loading: ${eagerImages.length}`);
  console.log(`  Images without alt text: ${missingAltImages.length ? missingAltImages.join(', ') : 'None'}`);
  console.log(`  Font preconnect/preload present: ${fontPreload ? 'YES' : 'NO'}`);
});

// ----------------------------------------------------
// PILLAR 3: STRUCTURED DATA AUDIT
// ----------------------------------------------------
console.log('\n--- 3. STRUCTURED DATA AUDIT ---');
htmlFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  const types = [];
  while ((match = jsonLdRegex.exec(c)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed['@graph']) {
        parsed['@graph'].forEach(item => types.push(item['@type']));
      } else {
        types.push(parsed['@type']);
      }
    } catch (e) {
      types.push(`PARSE_ERROR: ${e.message}`);
    }
  }
  console.log(`${f}: Schemas -> ${JSON.stringify(types)}`);
});

// ----------------------------------------------------
// PILLAR 5 & 6: CONVERSIONS & CTA ACCESSIBILITY AUDIT
// ----------------------------------------------------
console.log('\n--- 4. CONVERSIONS & CTA AUDIT ---');
htmlFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const whatsappCtas = (c.match(/href=["']https:\/\/wa\.link\/[^"']+["']/g) || []).length;
  const phoneCtas = (c.match(/href=["']tel:[^"']+["']/g) || []).length;
  const contactPageCtas = (c.match(/href=["']contact\.html["']/g) || []).length;
  const hasConversionTracking = c.includes('gtag') || c.includes('data-analytics') || c.includes('data-cta');
  
  console.log(`${f}: WhatsApp CTAs: ${whatsappCtas}, Phone CTAs: ${phoneCtas}, Contact CTAs: ${contactPageCtas}, Tracking attributes: ${hasConversionTracking ? 'YES' : 'NO'}`);
});
