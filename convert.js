const XLSX = require('xlsx');
const fs = require('fs');

function cleanHtml(html) {
  if (!html) return '';
  
  let cleaned = html;
  
  // 1. Replace 8.0pt, 9.0pt, 10.0pt spans with <small>...</small>
  cleaned = cleaned.replace(/<span\s+style="font-size:\s*(8\.0|9\.0|10\.0)pt;">([\s\S]*?)<\/span>/gi, '<small>$2</small>');
  
  // 2. Replace 11.0pt spans with just their inner contents
  cleaned = cleaned.replace(/<span\s+style="font-size:\s*11\.0pt;">([\s\S]*?)<\/span>/gi, '$1');
  
  // 3. Fallback: Remove any other span tags if any are left
  cleaned = cleaned.replace(/<span[^>]*>/gi, '');
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
