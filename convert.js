const XLSX = require('xlsx');
const fs = require('fs');

function cleanHtml(html) {
  if (!html) return '';
  // Remove all span opening tags but keep contents
  let cleaned = html.replace(/<span[^>]*>/gi, '');
  // Remove all span closing tags
  cleaned = cleaned.replace(/<\/span>/gi, '');
  return cleaned;
}

try {
  console.log('Reading Excel file...');
  const workbook = XLSX.readFile('DATABASE AL QURAN TERJEMAHAN.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  console.log('Parsing Excel rows...');
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  // Format the data, preserving rich text italic formatting in the Meaning column
  const formattedData = rawData.map((row, index) => {
    const rowNum = index + 2; // Row 2 in Excel corresponds to rawData[0]
    const meaningCell = sheet[`D${rowNum}`];
    
    let translation = row['Meaning'] || '';
    
    // If the cell contains rich-text HTML representation
    if (meaningCell && meaningCell.h) {
      translation = cleanHtml(meaningCell.h);
    }
    
    return {
      s: row['Surat'],    // Surah number
      a: row['Ayat'],     // Ayah number
      ar: row['Arabic'] || '',  // Arabic text (fallback to empty string if missing)
      tr: translation     // Translation (HTML-enriched Indonesian)
    };
  });
  
  fs.writeFileSync('public/quran.json', JSON.stringify(formattedData));
  console.log(`Successfully converted ${formattedData.length} verses with rich text.`);
  console.log(`JSON file size: ${(fs.statSync('public/quran.json').size / 1024).toFixed(2)} KB`);
} catch (e) {
  console.error('Error during conversion:', e);
}
