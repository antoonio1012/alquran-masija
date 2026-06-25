const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('DATABASE AL QURAN TERJEMAHAN.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  const cell = sheet['D12']; // Row 12 is Surah 2 Ayah 4
  console.log('Original Value (v):', cell.v);
  console.log('Original HTML (h):', cell.h);
  
  // Let's test a cleaning function
  function cleanHtml(html) {
    if (!html) return '';
    // Remove all span tags but keep their contents
    let cleaned = html.replace(/<span[^>]*>/gi, '');
    cleaned = cleaned.replace(/<\/span>/gi, '');
    return cleaned;
  }
  
  console.log('Cleaned HTML:', cleanHtml(cell.h));
} catch (e) {
  console.error('Error:', e);
}
