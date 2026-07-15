const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public/artispay-icon.svg');
const icoPath = path.join(__dirname, 'public/favicon.ico');
const png192Path = path.join(__dirname, 'public/logo192.png');
const png512Path = path.join(__dirname, 'public/logo512.png');

async function main() {
  const svg = fs.readFileSync(svgPath);

  const [p16, p32, p48] = await Promise.all([
    sharp(svg).resize(16, 16).png().toBuffer(),
    sharp(svg).resize(32, 32).png().toBuffer(),
    sharp(svg).resize(48, 48).png().toBuffer(),
  ]);

  const ico = await toIco([p16, p32, p48]);
  fs.writeFileSync(icoPath, ico);
  console.log('favicon.ico generated');

  await sharp(svg).resize(192, 192).png().toFile(png192Path);
  await sharp(svg).resize(512, 512).png().toFile(png512Path);
  console.log('logo192.png and logo512.png updated');
}

main().catch(err => { console.error(err); process.exit(1); });
