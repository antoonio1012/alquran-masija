const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('DATABASE AL QURAN TERJEMAHAN.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  // Inspect index 953, 954, 955 (which correspond to Quran Index 953-955)
  for (let i = 952; i <= 956; i++) {
    console.log(`Index ${i} (Row ${i + 2} in sheet):`);
    console.log('Raw Row keys:', Object.keys(rawData[i]));
    console.log('Raw Row data:', JSON.stringify(rawData[i]).substring(0, 180));
    
    // Inspect sheet cells for A, B, C, D at this row
    const rowNum = i + 2;
    console.log(`Sheet Cells for row ${rowNum}:`);
    console.log(`  A${rowNum} (Surat):`, sheet[`A${rowNum}`] ? sheet[`A${rowNum}`].v : 'empty');
    console.log(`  B${rowNum} (Ayat):`, sheet[`B${rowNum}`] ? sheet[`B${rowNum}`].v : 'empty');
    console.log(`  C${rowNum} (Arabic):`, sheet[`C${rowNum}`] ? sheet[`C${rowNum}`].v : 'empty');
    console.log(`  D${rowNum} (Meaning):`, sheet[`D${rowNum}`] ? sheet[`D${rowNum}`].v : 'empty');
    console.log('----------------------------------------------------');
  }
} catch (e) {
  console.error('Error:', e);
}
