// State management
let quranData = [];
let surahData = [];
let bookmarks = [];
let currentView = 'all'; // 'all', 'search', 'surah', 'bookmarks'
let activeSurahNum = null;
let searchQuery = '';
let searchResults = [];
let currentPage = 1;
const pageSize = 25;

// Stopwords for Indonesian search optimization
const indonesianStopwords = new Set([
  'ayat', 'tentang', 'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 
  'untuk', 'dengan', 'pada', 'adalah', 'oleh', 'mereka', 'ia', 'kami', 
  'aku', 'mu', 'nya', 'kita', 'kamu', 'dia', 'tersebut', 'secara', 
  'dalam', 'bahwa', 'sebagai', 'atau', 'telah', 'ada', 'adapun', 'bagi'
]);

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const surahListContainer = document.getElementById('surahList');
const searchSurahInput = document.getElementById('searchSurahInput');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const tagsWrapper = document.getElementById('tagsWrapper');

const themeToggleBtn = document.getElementById('themeToggleBtn');
const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsPanel = document.getElementById('settingsPanel');
const arabicFontSizeSlider = document.getElementById('arabicFontSizeSlider');
const arabicFontSizeVal = document.getElementById('arabicFontSizeVal');
const translationFontSizeSlider = document.getElementById('translationFontSizeSlider');
const translationFontSizeVal = document.getElementById('translationFontSizeVal');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');

const viewBanner = document.getElementById('viewBanner');
const bannerTitle = document.getElementById('bannerTitle');
const bannerDesc = document.getElementById('bannerDesc');
const resetViewBtn = document.getElementById('resetViewBtn');

const versesContainer = document.getElementById('versesContainer');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const bookmarksBtn = document.getElementById('bookmarksBtn');
const bookmarkCountBadge = document.getElementById('bookmarkCount');
const toast = document.getElementById('toast');

// Sticky Header Search Elements
const headerSearch = document.getElementById('headerSearch');
const headerSearchInput = document.getElementById('headerSearchInput');
const clearHeaderSearchBtn = document.getElementById('clearHeaderSearchBtn');

// Initialize application
async function init() {
  try {
    // Load Settings
    loadSettings();
    
    // Load Bookmarks
    loadBookmarks();

    // Fetch data in parallel with cache busting
    const [quranRes, surahRes] = await Promise.all([
      fetch('/quran.json?v=2'),
      fetch('/surahs.json?v=2')
    ]);

    quranData = await quranRes.json();
    surahData = await surahRes.json();

    // Render components
    renderSurahList();
    renderVerses();

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Initialization failed:', error);
    versesContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Gagal Memuat Data</h3>
        <p>Terjadi kesalahan saat memuat database Al-Qur'an. Silakan muat ulang halaman ini.</p>
        <button class="btn btn-primary btn-sm" onclick="location.reload()">Muat Ulang</button>
      </div>
    `;
  }
}

// ==========================================================================
// Settings & Preferences
// ==========================================================================
function loadSettings() {
  // Theme
  const theme = localStorage.getItem('quran_theme') || 'light';
  if (theme === 'dark') {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    document.querySelector('.sun-icon').style.display = 'block';
    document.querySelector('.moon-icon').style.display = 'none';
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    document.querySelector('.sun-icon').style.display = 'none';
    document.querySelector('.moon-icon').style.display = 'block';
  }

  // Font Sizes
  const arabicSize = localStorage.getItem('quran_font_arabic') || '28';
  const translationSize = localStorage.getItem('quran_font_trans') || '16';
  
  arabicFontSizeSlider.value = arabicSize;
  arabicFontSizeVal.textContent = arabicSize + 'px';
  translationFontSizeSlider.value = translationSize;
  translationFontSizeVal.textContent = translationSize + 'px';
  
  updateFontStyles(arabicSize, translationSize);
}

function updateFontStyles(arabicSize, translationSize) {
  versesContainer.style.setProperty('--arabic-font-size', `${arabicSize}px`);
  versesContainer.style.setProperty('--trans-font-size', `${translationSize}px`);
}

function saveSettings() {
  localStorage.setItem('quran_font_arabic', arabicFontSizeSlider.value);
  localStorage.setItem('quran_font_trans', translationFontSizeSlider.value);
}

// ==========================================================================
// Bookmarks Logic
// ==========================================================================
function loadBookmarks() {
  const saved = localStorage.getItem('quran_bookmarks');
  bookmarks = saved ? JSON.parse(saved) : [];
  updateBookmarkBadge();
}

function updateBookmarkBadge() {
  bookmarkCountBadge.textContent = bookmarks.length;
}

function isBookmarked(surah, ayah) {
  return bookmarks.includes(`${surah}:${ayah}`);
}

function toggleBookmark(surah, ayah) {
  const key = `${surah}:${ayah}`;
  const idx = bookmarks.indexOf(key);
  if (idx === -1) {
    bookmarks.push(key);
    showToast('Ayah ditambahkan ke bookmark');
  } else {
    bookmarks.splice(idx, 1);
    showToast('Ayah dihapus dari bookmark');
  }
  localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
  updateBookmarkBadge();
  
  // Re-render current card bookmark button (or full list if we are in bookmarks view)
  if (currentView === 'bookmarks') {
    renderVerses();
  } else {
    const card = document.querySelector(`.ayah-card[data-key="${surah}-${ayah}"]`);
    if (card) {
      const btn = card.querySelector('.bookmark-card-btn');
      const isBook = isBookmarked(surah, ayah);
      btn.innerHTML = isBook ? `
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      ` : `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      btn.title = isBook ? "Hapus dari Favorit" : "Simpan ke Favorit";
    }
  }
}

// ==========================================================================
// Search Algorithm & Reference Parser
// ==========================================================================

// Escape regex special chars
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Tokenize and clean Indonesian query
function extractKeywords(query) {
  return query
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !indonesianStopwords.has(word));
}

// Main Search / Filtering Router
function performSearch() {
  const input = searchInput.value.trim();
  searchQuery = input;
  
  // If empty query
  if (!input) {
    clearSearchState();
    return;
  }

  // Show clear button
  clearSearchBtn.style.display = 'flex';
  clearHeaderSearchBtn.style.display = 'flex';
  currentView = 'search';
  currentPage = 1;
  
  // Remove active surah selections
  document.querySelectorAll('.surah-item').forEach(el => el.classList.remove('active'));
  activeSurahNum = null;

  // 1. Try to parse as specific Reference (e.g. "2:153", "2 153" or "Al-Baqarah 153")
  const refMatches = parseReference(input);
  if (refMatches) {
    searchResults = refMatches;
    updateBanner('Hasil Pencarian Referensi', `Menemukan ayat referensi untuk "${input}"`);
    renderVerses();
    const bannerEl = document.getElementById('viewBanner');
    if (bannerEl) bannerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  // 2. Perform Keyword Search
  const matchMode = document.querySelector('input[name="matchMode"]:checked').value;
  const keywords = extractKeywords(input);
  
  // Fallback to original words if stopwords filtered out everything
  const searchTerms = keywords.length > 0 ? keywords : input.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  if (searchTerms.length === 0) {
    searchResults = [];
    updateBanner('Pencarian Kosong', `Kata kunci tidak valid.`);
    renderVerses();
    return;
  }

  searchResults = quranData.map(ayah => {
    // Strip HTML tags (e.g. <i>) before checking matches
    const meaningClean = ayah.tr.replace(/<[^>]*>/g, '');
    const meaningLower = meaningClean.toLowerCase();
    let score = 0;
    let matchedWordsCount = 0;

    if (matchMode === 'exact') {
      const idx = meaningLower.indexOf(input.toLowerCase());
      if (idx !== -1) {
        score = 100 - (idx * 0.01); // closer to start = higher rank
        matchedWordsCount = searchTerms.length;
      }
    } else {
      searchTerms.forEach(term => {
        const regex = new RegExp(`\\b${escapeRegExp(term)}`, 'g');
        const matches = meaningLower.match(regex);
        if (matches) {
          matchedWordsCount++;
          score += matches.length * 10; // 10 points per occurrence
          
          // Exact word match bonus (e.g., matching "benar" exactly vs "membenarkan")
          const exactWordRegex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g');
          if (exactWordRegex.test(meaningLower)) {
            score += 15;
          }
        }
      });

      // Match mode constraints
      if (matchMode === 'all' && matchedWordsCount < searchTerms.length) {
        score = 0;
      }
    }

    return {
      ayah,
      score,
      matchedWordsCount
    };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => {
    // Sort by match density/score first
    if (b.score !== a.score) return b.score - a.score;
    // Otherwise chronological
    if (a.ayah.s !== b.ayah.s) return a.ayah.s - b.ayah.s;
    return a.ayah.a - b.ayah.a;
  })
  .map(item => item.ayah);

  // Update banner UI
  updateBanner(
    `Hasil Pencarian: "${input}"`,
    `Menemukan ${searchResults.length} ayat yang cocok dengan kata pencarian Anda.`
  );
  
  renderVerses();
  const bannerEl = document.getElementById('viewBanner');
  if (bannerEl) bannerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Parse input reference (e.g. 2:153, Al-Baqarah 153)
function parseReference(input) {
  // Pattern 1: numbers like "2:153", "2-153", "2 153"
  const numPattern = /^(\d+)[\s:-]+(\d+)$/;
  const numMatches = input.match(numPattern);
  if (numMatches) {
    const surahNum = parseInt(numMatches[1], 10);
    const ayahNum = parseInt(numMatches[2], 10);
    if (surahNum >= 1 && surahNum <= 114) {
      const match = quranData.find(v => v.s === surahNum && v.a === ayahNum);
      return match ? [match] : null;
    }
  }

  // Pattern 2: Text reference like "Al-Baqarah 153", "albaqarah 153"
  const textPattern = /^([a-zA-Z'\s-]+?)\s+(\d+)$/;
  const textMatches = input.match(textPattern);
  if (textMatches) {
    const surahQueryName = textMatches[1].toLowerCase().replace(/[^a-z]/g, '');
    const ayahNum = parseInt(textMatches[2], 10);
    
    // Find matching surah
    const surah = surahData.find(s => {
      const cleanName = s.name.toLowerCase().replace(/[^a-z]/g, '');
      return cleanName.includes(surahQueryName) || surahQueryName.includes(cleanName);
    });

    if (surah) {
      const match = quranData.find(v => v.s === surah.no && v.a === ayahNum);
      return match ? [match] : null;
    }
  }

  return null;
}

function clearSearchState() {
  searchInput.value = '';
  headerSearchInput.value = '';
  clearSearchBtn.style.display = 'none';
  clearHeaderSearchBtn.style.display = 'none';
  
  // Reset tag buttons styling
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));

  currentView = 'all';
  currentPage = 1;
  activeSurahNum = null;
  document.querySelectorAll('.surah-item').forEach(el => el.classList.remove('active'));
  
  updateBanner(
    'Semua Ayat Al-Qur\'an',
    'Menampilkan seluruh ayat Al-Qur\'an. Silakan gunakan pencarian untuk menemukan ayat tematis.'
  );
  renderVerses();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// Rendering Engine
// ==========================================================================

// Get Surah details by number
function getSurahDetails(num) {
  return surahData.find(s => s.no === num) || { name: 'Surah', ar: '', eng: '' };
}

// Render Surah index list in sidebar
function renderSurahList() {
  surahListContainer.innerHTML = '';
  
  surahData.forEach(surah => {
    const element = document.createElement('div');
    element.className = 'surah-item';
    element.dataset.num = surah.no;
    
    element.innerHTML = `
      <div class="surah-info-left">
        <span class="surah-num">${surah.no}</span>
        <div class="surah-names">
          <span class="surah-name-id">${surah.name}</span>
          <span class="surah-verses">${surah.verses} Ayat | ${surah.eng}</span>
        </div>
      </div>
      <div class="surah-info-right">
        <span class="surah-arabic">${surah.ar}</span>
      </div>
    `;

    element.addEventListener('click', () => {
      selectSurah(surah.no);
    });

    surahListContainer.appendChild(element);
  });
}

function filterSurahSidebar(query) {
  const items = surahListContainer.querySelectorAll('.surah-item');
  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  items.forEach(item => {
    const surahNo = item.dataset.num;
    const nameText = item.querySelector('.surah-name-id').textContent.toLowerCase().replace(/[^a-z0-9]/g, '');
    const engText = item.querySelector('.surah-verses').textContent.toLowerCase();
    
    if (surahNo === query || nameText.includes(cleanQuery) || engText.includes(cleanQuery)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Set active surah and render its verses
function selectSurah(num) {
  activeSurahNum = num;
  currentView = 'surah';
  currentPage = 1;
  searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));

  // Update sidebar active selection
  document.querySelectorAll('.surah-item').forEach(el => {
    if (parseInt(el.dataset.num, 10) === num) {
      el.classList.add('active');
      // Scroll into view if needed
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      el.classList.remove('active');
    }
  });

  const surah = getSurahDetails(num);
  updateBanner(
    `Surah ${surah.name} (${surah.ar})`,
    `Menampilkan semua ${surah.verses} ayat dari surah ${surah.name} - ${surah.eng}.`
  );

  // Close sidebar on mobile
  closeSidebar();
  
  renderVerses();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Recursively highlight matched keywords in DOM text nodes, leaving HTML tags untouched
function highlightDOMTextNodes(element, query) {
  if (!query) return;
  const matchMode = document.querySelector('input[name="matchMode"]:checked').value;
  const keywords = extractKeywords(query);
  const searchTerms = keywords.length > 0 ? keywords : query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  if (searchTerms.length === 0) return;

  let regex;
  if (matchMode === 'exact') {
    regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  } else {
    // Sort terms by length descending to prevent shorter matches inside longer ones
    const sortedTerms = [...searchTerms].sort((a, b) => b.length - a.length);
    const pattern = sortedTerms.map(term => escapeRegExp(term)).join('|');
    regex = new RegExp(`(${pattern})`, 'gi');
  }

  function walk(node) {
    if (node.nodeType === 3) { // TEXT_NODE
      const text = node.nodeValue;
      if (!regex.test(text)) return;
      
      regex.lastIndex = 0; // Reset regex
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const matchText = match[0];
        const matchIndex = match.index;
        
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
        }
        
        const mark = document.createElement('mark');
        mark.className = 'highlight';
        mark.textContent = matchText;
        fragment.appendChild(mark);
        
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }
      
      node.parentNode.replaceChild(fragment, node);
    } else if (node.nodeType === 1 && node.nodeName !== 'MARK' && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') { // ELEMENT_NODE
      const children = Array.from(node.childNodes);
      children.forEach(walk);
    }
  }

  walk(element);
}

// Get verses based on current view criteria
function getFilteredVerses() {
  if (currentView === 'surah') {
    return quranData.filter(v => v.s === activeSurahNum);
  }
  if (currentView === 'search') {
    return searchResults;
  }
  if (currentView === 'bookmarks') {
    return quranData.filter(v => isBookmarked(v.s, v.a));
  }
  return quranData; // 'all' view
}

// Render list of verses (paginated)
function renderVerses() {
  const filtered = getFilteredVerses();
  const total = filtered.length;

  if (currentPage === 1) {
    versesContainer.innerHTML = '';
  }

  if (total === 0) {
    loadMoreContainer.style.display = 'none';
    if (currentView === 'bookmarks') {
      versesContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>Belum Ada Bookmark</h3>
          <p>Anda belum menandai ayat manapun sebagai favorit. Klik ikon bookmark pada ayat untuk menyimpannya.</p>
        </div>
      `;
    } else if (currentView === 'search') {
      versesContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3>Hasil Tidak Ditemukan</h3>
          <p>Kami tidak dapat menemukan ayat dengan kata kunci "${searchQuery}". Coba kata kunci lain atau ubah mode pencocokan.</p>
        </div>
      `;
    }
    return;
  }

  const limit = currentPage * pageSize;
  const pageItems = filtered.slice((currentPage - 1) * pageSize, limit);

  pageItems.forEach(v => {
    const surah = getSurahDetails(v.s);
    const isBook = isBookmarked(v.s, v.a);
    const card = document.createElement('article');
    card.className = 'ayah-card';
    card.dataset.key = `${v.s}-${v.a}`;
    
    // Format verse text for copying (stripping tags like <i> first and conditionally adding Arabic)
    const cleanTranslation = v.tr.replace(/<[^>]*>/g, '');
    const copyText = v.ar
      ? `QS. ${surah.name} [${v.s}]:${v.a}\n\n${v.ar}\n\nArtinya: "${cleanTranslation}"`
      : `QS. ${surah.name} [${v.s}]:${v.a}\n\nArtinya: "${cleanTranslation}"`;

    // Only render the Arabic text block if it is available in the database
    const arabicHtml = v.ar ? `<div class="ayah-arabic">${v.ar}</div>` : '';

    card.innerHTML = `
      <div class="copy-badge">Teks disalin!</div>
      <div class="ayah-header">
        <span class="ayah-reference">
          QS. ${surah.name} (${surah.ar}) [${v.s}]:${v.a}
        </span>
        <div class="ayah-actions">
          <button class="icon-btn copy-card-btn" title="Salin Teks Lengkap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="icon-btn bookmark-card-btn" title="${isBook ? "Hapus dari Favorit" : "Simpan ke Favorit"}">
            ${isBook ? `
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            ` : `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            `}
          </button>
        </div>
      </div>
      ${arabicHtml}
      <div class="ayah-translation">${v.tr}</div>
    `;

    // Highlight query keywords inside DOM text nodes if search is active
    if (currentView === 'search' && searchQuery) {
      const translationDiv = card.querySelector('.ayah-translation');
      highlightDOMTextNodes(translationDiv, searchQuery);
    }

    // Copy event listener
    card.querySelector('.copy-card-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(copyText).then(() => {
        card.classList.add('copied');
        setTimeout(() => card.classList.remove('copied'), 1500);
        showToast('Ayah berhasil disalin!');
      });
    });

    // Bookmark event listener
    card.querySelector('.bookmark-card-btn').addEventListener('click', () => {
      toggleBookmark(v.s, v.a);
    });

    versesContainer.appendChild(card);
  });

  // Toggle load more visibility
  if (limit < total) {
    loadMoreContainer.style.display = 'flex';
  } else {
    loadMoreContainer.style.display = 'none';
  }
}

// Banner text controller
function updateBanner(title, desc) {
  bannerTitle.textContent = title;
  bannerDesc.textContent = desc;
  
  if (currentView !== 'all') {
    resetViewBtn.style.display = 'inline-flex';
  } else {
    resetViewBtn.style.display = 'none';
  }
}

// Toast indicator helper
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Mobile sidebar controls
function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

// ==========================================================================
// Event Listeners Registration
// ==========================================================================
function setupEventListeners() {
  // Mobile drawer events
  menuBtn.addEventListener('click', openSidebar);
  closeSidebarBtn.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // Sync and handle main search input
  searchInput.addEventListener('input', () => {
    headerSearchInput.value = searchInput.value;
    if (searchInput.value.trim()) {
      clearSearchBtn.style.display = 'flex';
      clearHeaderSearchBtn.style.display = 'flex';
    } else {
      clearSearchBtn.style.display = 'none';
      clearHeaderSearchBtn.style.display = 'none';
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  clearSearchBtn.addEventListener('click', clearSearchState);

  // Sync and handle sticky header search input
  headerSearchInput.addEventListener('input', () => {
    searchInput.value = headerSearchInput.value;
    if (headerSearchInput.value.trim()) {
      clearSearchBtn.style.display = 'flex';
      clearHeaderSearchBtn.style.display = 'flex';
    } else {
      clearSearchBtn.style.display = 'none';
      clearHeaderSearchBtn.style.display = 'none';
    }
  });

  headerSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  clearHeaderSearchBtn.addEventListener('click', clearSearchState);

  // Scroll event for sticky header and search visibility
  window.addEventListener('scroll', () => {
    const threshold = 100; // Scroll threshold to show header search and shrink header
    if (window.scrollY > threshold) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  });

  // Match modes toggle search trigger
  document.querySelectorAll('input[name="matchMode"]').forEach(el => {
    el.addEventListener('change', () => {
      if (searchInput.value.trim()) {
        performSearch();
      }
    });
  });

  // Popular tag click trigger
  tagsWrapper.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    
    // Toggle active state
    const isActive = btn.classList.contains('active');
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    
    if (isActive) {
      clearSearchState();
    } else {
      btn.classList.add('active');
      searchInput.value = btn.dataset.tag;
      performSearch();
    }
  });

  // Sidebar Surah Search filter
  searchSurahInput.addEventListener('input', (e) => {
    filterSurahSidebar(e.target.value.trim());
  });

  // Header Bookmarks View Toggle
  bookmarksBtn.addEventListener('click', () => {
    currentView = 'bookmarks';
    currentPage = 1;
    activeSurahNum = null;
    document.querySelectorAll('.surah-item').forEach(el => el.classList.remove('active'));
    
    updateBanner('Ayat Favorit Saya', `Menampilkan ${bookmarks.length} ayat yang telah Anda simpan.`);
    renderVerses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Settings dropdown toggle
  settingsToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = settingsPanel.style.display === 'flex';
    settingsPanel.style.display = isVisible ? 'none' : 'flex';
  });

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsToggleBtn) {
      settingsPanel.style.display = 'none';
    }
  });

  // Settings sliders input
  arabicFontSizeSlider.addEventListener('input', (e) => {
    const size = e.target.value;
    arabicFontSizeVal.textContent = size + 'px';
    updateFontStyles(size, translationFontSizeSlider.value);
    saveSettings();
  });

  translationFontSizeSlider.addEventListener('input', (e) => {
    const size = e.target.value;
    translationFontSizeVal.textContent = size + 'px';
    updateFontStyles(arabicFontSizeSlider.value, size);
    saveSettings();
  });

  resetSettingsBtn.addEventListener('click', () => {
    arabicFontSizeSlider.value = 28;
    arabicFontSizeVal.textContent = '28px';
    translationFontSizeSlider.value = 16;
    translationFontSizeVal.textContent = '16px';
    updateFontStyles(28, 16);
    saveSettings();
  });

  // Theme Toggle Button
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (isDark) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
      localStorage.setItem('quran_theme', 'light');
      showToast('Mode Terang Aktif');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
      localStorage.setItem('quran_theme', 'dark');
      showToast('Mode Gelap Aktif');
    }
  });

  // Load More pagination trigger
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    renderVerses();
  });

  // Banner Return to Home Button
  resetViewBtn.addEventListener('click', clearSearchState);
}

// Start application
document.addEventListener('DOMContentLoaded', init);

// Register PWA Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}
