const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('DATABASE AL QURAN TERJEMAHAN.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Let's search for cells that have a rich text array (.r)
  let foundRichText = 0;
  
  for (let cellRef in sheet) {
    if (cellRef.startsWith('!')) continue; // Skip metadata
    const cell = sheet[cellRef];
    
    // Check if cell has rich text runs
    if (cell && cell.r) {
      foundRichText++;
      if (foundRichText <= 5) {
        console.log(`Cell ${cellRef} contains rich text:`);
        console.log(JSON.stringify(cell.r, null, 2));
        console.log('Plain value:', cell.v);
        console.log('---------------------------');
      }
    }
  }
  
  console.log(`Total cells with rich text: ${foundRichText}`);
} catch (e) {
  console.error('Error during inspection:', e);
}
