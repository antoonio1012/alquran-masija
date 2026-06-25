const fs = require('fs');

try {
  const quran = JSON.parse(fs.readFileSync('public/quran.json', 'utf8'));
  const surahs = JSON.parse(fs.readFileSync('public/surahs.json', 'utf8'));
  
  let undefinedQuranCount = 0;
  quran.forEach((v, index) => {
    const hasUndefined = (v.s === undefined || v.a === undefined || v.ar === undefined || v.tr === undefined ||
                          v.s === null || v.a === null || v.ar === null || v.tr === null ||
                          String(v.s).includes('undefined') || String(v.a).includes('undefined') || 
                          String(v.ar).includes('undefined') || String(v.tr).includes('undefined'));
    if (hasUndefined) {
      undefinedQuranCount++;
      if (undefinedQuranCount <= 5) {
        console.log(`Quran Index ${index} (Surah ${v.s}, Ayah ${v.a}) contains undefined:`, JSON.stringify(v));
      }
    }
  });

  let undefinedSurahCount = 0;
  surahs.forEach((s, index) => {
    const hasUndefined = (s.no === undefined || s.name === undefined || s.eng === undefined || s.ar === undefined || s.verses === undefined ||
                          s.no === null || s.name === null || s.eng === null || s.ar === null ||
                          String(s.no).includes('undefined') || String(s.name).includes('undefined') ||
                          String(s.eng).includes('undefined') || String(s.ar).includes('undefined'));
    if (hasUndefined) {
      undefinedSurahCount++;
      if (undefinedSurahCount <= 5) {
        console.log(`Surah Index ${index} (No ${s.no}) contains undefined:`, JSON.stringify(s));
      }
    }
  });

  console.log(`Total undefined records in quran.json: ${undefinedQuranCount}`);
  console.log(`Total undefined records in surahs.json: ${undefinedSurahCount}`);
} catch (e) {
  console.error('Error during checks:', e);
}
