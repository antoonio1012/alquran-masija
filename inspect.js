const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('DATABASE AL QURAN TERJEMAHAN.xlsx');
  const sheetNames = workbook.SheetNames;
  console.log('Sheet Names:', sheetNames);

  if (sheetNames.length > 0) {
    const sheet = workbook.Sheets[sheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('First sheet row count:', data.length);
    console.log('Header row:', data[0]);
    console.log('Row 1:', data[1]);
    console.log('Row 2:', data[2]);
  }
} catch (e) {
  console.error('Error reading file:', e);
}
