const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('DATABASE AL QURAN TERJEMAHAN.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Let's inspect column D (Meaning) rows 2 to 15
  for (let r = 2; r <= 15; r++) {
    const cellRef = `D${r}`;
    const cell = sheet[cellRef];
    console.log(`Cell ${cellRef}:`);
    if (cell) {
      console.log('  Type of cell:', typeof cell);
      console.log('  Keys:', Object.keys(cell));
      console.log('  v:', cell.v ? cell.v.substring(0, 60) : 'none');
      if (cell.r) {
        console.log('  r type:', typeof cell.r);
        console.log('  r isArray:', Array.isArray(cell.r));
        console.log('  r value:', JSON.stringify(cell.r).substring(0, 150));
      }
      if (cell.h) {
        console.log('  h:', cell.h.substring(0, 150));
      }
    }
    console.log('---------------------------');
  }
} catch (e) {
  console.error('Error during inspection:', e);
}
