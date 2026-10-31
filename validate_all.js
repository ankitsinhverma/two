const fs = require('fs');
const path = require('path');

const targetHtmlFiles = [
  'index.html',
  'knx-automation.html',
  'wireless-retrofit.html',
  'dali-lighting.html',
  'motorized-curtains.html',
  'structured-cabling.html',
  'wifi-setup.html',
  'automation.html',
  'electrical.html',
  'product.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'cookie-policy.html',
  'sitemap.html'
];

let totalErrors = 0;
let totalWarnings = 0;

console.log('=== INTELLIHOME SEO & ARCHITECTURE VALIDATION ===\n');

targetHtmlFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`[ERROR] File missing: ${file}`);
    totalErrors++;
    return;
  }

  const content = fs.readFileSync(file, 'utf8');

  // 1. Title validation
  const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch) {
    console.error(`[ERROR] ${file} has no <title> tag!`);
    totalErrors++;
  } else {
    const title = titleMatch[1].replace(/\s+/g, ' ').trim();
    if (title.length > 65) {
      console.warn(`[WARN] ${file} title is > 65 chars (${title.length} chars): "${title}"`);
      totalWarnings++;
    } else {
      console.log(`[PASS] ${file} title (${title.length} chars): "${title}"`);
    }
  }

  // 2. Meta description validation (handles multiline attribute)
  const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content="([^"]*)"/i) ||
                    content.match(/<meta[^>]*content="([^"]*)"[^>]*name=["']description["']/i);
  if (!descMatch) {
    console.error(`[ERROR] ${file} has no meta description!`);
    totalErrors++;
  } else {
    const desc = descMatch[1].replace(/\s+/g, ' ').trim();
    if (desc.length < 100 || desc.length > 170) {
      console.warn(`[WARN] ${file} description length (${desc.length} chars): "${desc.substring(0, 50)}..."`);
      totalWarnings++;
    } else {
      console.log(`[PASS] ${file} description (${desc.length} chars): "${desc.substring(0, 60)}..."`);
    }
  }

  // 3. JSON-LD structured data validation
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  let jsonLdCount = 0;
  while ((match = jsonLdRegex.exec(content)) !== null) {
    jsonLdCount++;
    try {
      JSON.parse(match[1]);
    } catch (e) {
      console.error(`[ERROR] ${file} JSON-LD block ${jsonLdCount} failed JSON parse: ${e.message}`);
      totalErrors++;
    }
  }
  if (jsonLdCount > 0) {
    console.log(`[PASS] ${file} has ${jsonLdCount} valid JSON-LD schema block(s)`);
  }

  // 4. Image check
  const imgRegex = /<img[^>]+src=["'](assets\/[^"']+)["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    const imgPath = imgMatch[1];
    if (!fs.existsSync(imgPath)) {
      console.error(`[ERROR] ${file} references missing image: ${imgPath}`);
      totalErrors++;
    }
  }

  // 5. Apple directory footer check
  if (content.includes('apple-footer') || content.includes('apple-directory-columns')) {
    console.log(`[PASS] ${file} contains Apple Global Directory Footer`);
  } else {
    console.warn(`[WARN] ${file} missing Apple footer!`);
    totalWarnings++;
  }
  console.log('----------------------------------------------------');
});

// Check sitemap.xml
if (fs.existsSync('sitemap.xml')) {
  const xml = fs.readFileSync('sitemap.xml', 'utf8');
  const expectedUrls = [
    'https://www.intellihome.in/',
    'https://www.intellihome.in/knx-automation.html',
    'https://www.intellihome.in/wireless-retrofit.html',
    'https://www.intellihome.in/dali-lighting.html',
    'https://www.intellihome.in/motorized-curtains.html',
    'https://www.intellihome.in/structured-cabling.html',
    'https://www.intellihome.in/wifi-setup.html',
    'https://www.intellihome.in/automation.html',
    'https://www.intellihome.in/electrical.html'
  ];

  expectedUrls.forEach(url => {
    if (!xml.includes(`<loc>${url}</loc>`)) {
      console.error(`[ERROR] sitemap.xml missing url: ${url}`);
      totalErrors++;
    } else {
      console.log(`[PASS] sitemap.xml contains: ${url}`);
    }
  });

  // Verify all image tags in sitemap.xml exist
  const xmlImgRegex = /<image:loc>https:\/\/www\.intellihome\.in\/(assets\/[^<]+)<\/image:loc>/gi;
  let xmlImgMatch;
  while ((xmlImgMatch = xmlImgRegex.exec(xml)) !== null) {
    const xmlImgPath = xmlImgMatch[1];
    if (!fs.existsSync(xmlImgPath)) {
      console.error(`[ERROR] sitemap.xml references missing image: ${xmlImgPath}`);
      totalErrors++;
    }
  }
}

console.log(`\n=== VALIDATION COMPLETE: ${totalErrors} Errors, ${totalWarnings} Warnings ===`);
