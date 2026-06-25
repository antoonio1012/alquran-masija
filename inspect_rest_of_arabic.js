const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('DATABASE AL QURAN TERJEMAHAN.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  let emptyArabicRows = [];
  let totalRows = rawData.length;
  
  for (let i = 0; i < totalRows; i++) {
    const rowNum = i + 2;
    const arabicCell = sheet[`C${rowNum}`];
    if (!arabicCell || !arabicCell.v) {
      emptyArabicRows.push(rowNum);
    }
  }
  
  console.log(`Total rows in Excel sheet: ${totalRows}`);
  console.log(`Number of rows with empty Arabic text: ${emptyArabicRows.length}`);
  
  if (emptyArabicRows.length > 0) {
    console.log('First 10 empty Arabic rows:', emptyArabicRows.slice(0, 10));
    console.log('Last 10 empty Arabic rows:', emptyArabicRows.slice(-10));
    
    // Let's also check if there is another column that has Arabic text for these rows
    // Loop through row 956 and see all filled cells
    const sampleRow = 956;
    console.log(`Checking all filled cells in row ${sampleRow}:`);
    for (let col = 0; col < 26; col++) {
      const colLetter = String.fromCharCode(65 + col); // A, B, C, ...
      const cell = sheet[`${colLetter}${sampleRow}`];
      if (cell) {
        console.log(`  ${colLetter}${sampleRow}:`, typeof cell.v, `"${String(cell.v).substring(0, 50)}"`);
      }
    }
  }
} catch (e) {
  console.error('Error:', e);
}
