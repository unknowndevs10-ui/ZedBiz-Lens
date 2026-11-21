// Tiny dependency-free PDF writer (Helvetica, ASCII text, A4). It keeps report
// downloads lightweight and works without adding a large PDF library.
// Dev B's generators replace this - see services/reportService.js.
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 56;

const clean = (text) =>
  String(text)
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, '?');
const escapePdf = (text) => clean(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function wrap(text, size, width) {
  const maxChars = Math.max(10, Math.floor(width / (size * 0.52)));
  const lines = [];
  let line = '';
  for (const word of clean(text).split(' ')) {
    if ((line + ' ' + word).trim().length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/**
 * blocks: { text, size?, bold?, gapBefore? } | { left, right, bold?, size? } | { rule: true }
 */
export function buildSimplePdf({ headerLabel = 'WORKSPACE RECORDS', blocks }) {
  const pages = [[]];
  let y = PAGE_H - 92;
  const ops = () => pages[pages.length - 1];
  const newPage = () => {
    pages.push([]);
    y = PAGE_H - 92;
  };
  const text = (value, x, size, bold) =>
    ops().push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y.toFixed(1)} Td (${escapePdf(value)}) Tj ET`);

  for (const block of blocks) {
    const size = block.size || 11;
    const lineHeight = size * 1.5;
    y -= block.gapBefore || 0;
    if (block.rule) {
      if (y < 80) newPage();
      ops().push(`0.85 0.89 0.89 RG 0.8 w ${MARGIN} ${y.toFixed(1)} m ${PAGE_W - MARGIN} ${y.toFixed(1)} l S`);
      y -= 10;
      continue;
    }
    if (block.left !== undefined) {
      if (y - lineHeight < 64) newPage();
      y -= lineHeight;
      text(block.left, MARGIN, size, block.bold);
      const right = clean(block.right ?? '');
      text(right, PAGE_W - MARGIN - right.length * size * 0.52, size, block.bold);
      continue;
    }
    for (const line of wrap(block.text, size, PAGE_W - MARGIN * 2)) {
      if (y - lineHeight < 64) newPage();
      y -= lineHeight;
      text(line, MARGIN, size, block.bold);
    }
  }

  const total = pages.length;
  const contents = pages.map((body, index) => {
    const header = [
      '0.122 0.435 0.42 rg',
      `0 ${PAGE_H - 48} ${PAGE_W} 48 re f`,
      '1 1 1 rg',
      `BT /F2 14 Tf ${MARGIN} ${PAGE_H - 30} Td (ZedBiz Lens) Tj ET`,
      `BT /F1 9 Tf ${PAGE_W - MARGIN - clean(headerLabel).length * 4.7} ${PAGE_H - 29} Td (${escapePdf(headerLabel)}) Tj ET`,
      '0.118 0.165 0.184 rg',
    ];
    const footer = [`BT /F1 9 Tf ${MARGIN} 30 Td (Page ${index + 1} of ${total}) Tj ET`];
    return [...header, ...body, ...footer].join('\n');
  });

  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${contents.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${total} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  contents.forEach((stream, i) => {
    const pageObj = 5 + i * 2;
    objects[pageObj] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageObj + 1} 0 R >>`;
    objects[pageObj + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

