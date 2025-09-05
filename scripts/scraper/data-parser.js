import * as cheerio from 'cheerio';

/**
 * Parse novela data from Wikipedia HTML content
 */
export class NovelParser {
  constructor() {
    this.currentId = 1;
  }

  /**
   * Parse a Wikipedia list page for novelas
   */
  parseListPage(html, sourceInfo) {
    const $ = cheerio.load(html);
    const novelas = [];
    
    // Use broadcaster-specific parsing logic
    switch (sourceInfo.type) {
      case 'record_page':
        return this.parseRecordPage($, sourceInfo);
      case 'globo_page':
        return this.parseGloboPage($, sourceInfo);
      case 'band_page':
        return this.parseBandPage($, sourceInfo);
      case 'sbt_page':
        return this.parseSbtPage($, sourceInfo);
      default:
        return this.parseGenericPage($, sourceInfo);
    }
  }

  /**
   * Parse Record TV specific page structure
   */
  parseRecordPage($, sourceInfo) {
    const novelas = [];
    const tables = $('table.wikitable, table.sortable');
    
    tables.each((index, table) => {
      const rows = $(table).find('tr');
      
      rows.each((rowIndex, row) => {
        if (rowIndex === 0) return; // Skip header row
        
        const cells = $(row).find('td');
        if (cells.length < 4) return; // Need at least basic columns
        
        const novela = this.parseRecordTableRow($, cells, sourceInfo);
        if (novela && this.isValidNovela(novela)) {
          novelas.push(novela);
        }
      });
    });
    
    return this.deduplicate(novelas);
  }

  /**
   * Parse Globo specific page structure (English Wikipedia)
   */
  parseGloboPage($, sourceInfo) {
    const novelas = [];
    const tables = $('table.wikitable, table.sortable');
    
    tables.each((index, table) => {
      const rows = $(table).find('tr');
      
      rows.each((rowIndex, row) => {
        if (rowIndex === 0) return; // Skip header row
        
        const cells = $(row).find('td');
        if (cells.length < 4) return; // Need at least basic columns
        
        const novela = this.parseGloboTableRow($, cells, sourceInfo);
        if (novela && this.isValidNovela(novela)) {
          novelas.push(novela);
        }
      });
    });
    
    return this.deduplicate(novelas);
  }

  /**
   * Parse Band specific page structure
   */
  parseBandPage($, sourceInfo) {
    const novelas = [];
    const tables = $('table.wikitable, table.sortable');
    
    tables.each((index, table) => {
      const rows = $(table).find('tr');
      
      rows.each((rowIndex, row) => {
        if (rowIndex === 0) return; // Skip header row
        
        const cells = $(row).find('td');
        if (cells.length < 4) return; // Need at least basic columns
        
        const novela = this.parseBandTableRow($, cells, sourceInfo);
        if (novela && this.isValidNovela(novela)) {
          novelas.push(novela);
        }
      });
    });
    
    return this.deduplicate(novelas);
  }

  /**
   * Parse SBT specific page structure
   */
  parseSbtPage($, sourceInfo) {
    const novelas = [];
    const tables = $('table.wikitable, table.sortable');
    
    tables.each((index, table) => {
      const rows = $(table).find('tr');
      
      rows.each((rowIndex, row) => {
        if (rowIndex === 0) return; // Skip header row
        
        const cells = $(row).find('td');
        if (cells.length < 4) return; // Need at least basic columns
        
        const novela = this.parseSbtTableRow($, cells, sourceInfo);
        if (novela && this.isValidNovela(novela)) {
          novelas.push(novela);
        }
      });
    });
    
    return this.deduplicate(novelas);
  }

  /**
   * Generic fallback parser
   */
  parseGenericPage($, sourceInfo) {
    const novelas = [];
    
    // Different parsing strategies based on Wikipedia page structure
    const tables = $('table.wikitable, table.sortable');
    
    tables.each((index, table) => {
      const rows = $(table).find('tr');
      
      rows.each((rowIndex, row) => {
        if (rowIndex === 0) return; // Skip header row
        
        const cells = $(row).find('td');
        if (cells.length < 2) return; // Need at least title and year
        
        const novela = this.parseTableRow($, cells, sourceInfo);
        if (novela && this.isValidNovela(novela)) {
          novelas.push(novela);
        }
      });
    });
    
    // Parse from content lists only (avoid navigation and sidebar)
    const contentLists = $('#mw-content-text ul li, #mw-content-text ol li, .mw-parser-output ul li, .mw-parser-output ol li');
    contentLists.each((index, item) => {
      const $item = $(item);
      
      // Skip if this is clearly navigation or if no link
      if (!$item.find('a').length) return;
      
      // Skip items in navboxes, infoboxes, or sidebar
      if ($item.closest('.navbox, .infobox, .sidebar, #mw-navigation, .vector-menu').length > 0) return;
      
      const novela = this.parseListItem($, $item, sourceInfo);
      if (novela && this.isValidNovela(novela)) {
        novelas.push(novela);
      }
    });
    
    return this.deduplicate(novelas);
  }

  /**
   * Parse a table row containing novela information
   */
  parseTableRow($, cells, sourceInfo) {
    const cellsArray = cells.toArray();
    if (cellsArray.length < 2) return null;
    
    let title = '';
    let year = null;
    let genres = [];
    let synopsis = '';
    let cast = [];
    let episodes = null;
    let director = '';
    let author = '';
    let wikipediaUrl = '';
    
    // Try to extract title (usually first column with link)
    const titleCell = $(cellsArray[0]);
    const titleLink = titleCell.find('a').first();
    
    if (titleLink.length > 0) {
      title = this.cleanText(titleLink.text());
      const href = titleLink.attr('href');
      if (href && href.startsWith('/wiki/')) {
        const baseUrl = sourceInfo.language === 'en' ? 'https://en.wikipedia.org' : 'https://pt.wikipedia.org';
        wikipediaUrl = baseUrl + href;
      }
    } else {
      title = this.cleanText(titleCell.text());
    }
    
    // Extract year (look for 4-digit numbers)
    cellsArray.forEach((cell, index) => {
      const cellText = $(cell).text();
      const yearMatch = cellText.match(/(\d{4})/);
      if (yearMatch && !year) {
        year = { start: parseInt(yearMatch[1]), end: null };
      }
      
      // Look for year ranges
      const yearRangeMatch = cellText.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
      if (yearRangeMatch) {
        year = { 
          start: parseInt(yearRangeMatch[1]), 
          end: parseInt(yearRangeMatch[2]) 
        };
      }
    });
    
    // Try to extract other information from remaining cells
    if (cellsArray.length > 2) {
      for (let i = 1; i < cellsArray.length; i++) {
        const cellText = this.cleanText($(cellsArray[i]).text());
        
        // Look for episode count
        const episodeMatch = cellText.match(/(\d+)\s*(cap|ep|episódios?|capítulos?)/i);
        if (episodeMatch) {
          episodes = parseInt(episodeMatch[1]);
        }
        
        // Look for genres (common drama genres)
        const genreKeywords = ['drama', 'romance', 'comédia', 'ação', 'suspense', 'musical', 'histórico', 'infantil', 'juvenil'];
        genreKeywords.forEach(genre => {
          if (cellText.toLowerCase().includes(genre) && !genres.includes(this.capitalizeFirst(genre))) {
            genres.push(this.capitalizeFirst(genre));
          }
        });
      }
    }
    
    return {
      id: this.generateId(title),
      title,
      country: sourceInfo.country,
      broadcaster: sourceInfo.broadcaster,
      year,
      genre: genres.length > 0 ? genres : ['Drama'],
      synopsis: synopsis && synopsis.length > 50 ? synopsis : `${title} é uma ${sourceInfo.country === 'Brasil' ? 'telenovela' : 'série'} de ${sourceInfo.broadcaster}.`,
      cast: cast,
      episodes: episodes || this.estimateEpisodes(sourceInfo.country),
      director,
      author,
      wikipediaUrl: wikipediaUrl || '',
      imageUrl: '',
      scraped: new Date().toISOString()
    };
  }

  /**
   * Parse a list item containing novela information
   */
  parseListItem($, item, sourceInfo) {
    const text = item.text();
    const link = item.find('a').first();
    
    if (!link.length) return null;
    
    const title = this.cleanText(link.text());
    if (!title || title.length < 3) return null;
    
    const href = link.attr('href');
    const wikipediaUrl = href && href.startsWith('/wiki/') 
      ? (sourceInfo.language === 'en' ? 'https://en.wikipedia.org' : 'https://pt.wikipedia.org') + href 
      : '';
    
    // Extract year from parentheses
    const yearMatch = text.match(/\((\d{4})\)/);
    let year = null;
    if (yearMatch) {
      year = { start: parseInt(yearMatch[1]), end: null };
    }
    
    return {
      id: this.generateId(title),
      title,
      country: sourceInfo.country,
      broadcaster: sourceInfo.broadcaster,
      year,
      genre: ['Drama'],
      synopsis: `${title} é uma ${sourceInfo.country === 'Brasil' ? 'telenovela' : 'série'} de ${sourceInfo.broadcaster}.`,
      cast: [],
      episodes: this.estimateEpisodes(sourceInfo.country),
      director: '',
      author: '',
      wikipediaUrl,
      imageUrl: '',
      scraped: new Date().toISOString()
    };
  }

  /**
   * Parse Record TV table row with enhanced extraction
   * Columns: #, Start Date, End Date, Title, Episodes, Timeslot, Authorship, Direction
   */
  parseRecordTableRow($, cells, sourceInfo) {
    const cellsArray = cells.toArray();
    if (cellsArray.length < 4) return null;
    
    let title = '';
    let year = null;
    let episodes = null;
    let author = '';
    let director = '';
    let wikipediaUrl = '';
    let genres = ['Drama'];
    
    // Enhanced title extraction with better column detection
    for (let i = 0; i < Math.min(6, cellsArray.length); i++) {
      const cell = $(cellsArray[i]);
      const cellText = cell.text().trim();
      
      // Skip cells with only numbers or dates
      if (/^\d+$/.test(cellText) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cellText)) continue;
      
      const link = cell.find('a').first();
      
      if (link.length > 0 && !title) {
        const linkText = this.cleanText(link.text());
        if (linkText.length > 2 && !linkText.toLowerCase().includes('record')) {
          title = linkText;
          const href = link.attr('href');
          if (href && href.startsWith('/wiki/')) {
            const baseUrl = sourceInfo.language === 'en' ? 'https://en.wikipedia.org' : 'https://pt.wikipedia.org';
            wikipediaUrl = baseUrl + href;
          }
          break;
        }
      }
      
      // Fallback: look for italicized text (common for titles)
      if (!title) {
        const italicText = cell.find('i').text().trim();
        if (italicText.length > 3 && !italicText.toLowerCase().includes('record')) {
          title = this.cleanText(italicText);
        }
      }
    }
    
    // Enhanced fallback title extraction
    if (!title) {
      for (let i = 2; i < Math.min(5, cellsArray.length); i++) {
        const cellText = this.cleanText($(cellsArray[i]).text());
        if (cellText.length > 3 && !/^\d+$/.test(cellText) && !cellText.toLowerCase().includes('record')) {
          title = cellText;
          break;
        }
      }
    }
    
    // Enhanced data extraction with better pattern recognition
    cellsArray.forEach((cell) => {
      const cellText = $(cell).text();
      
      // Enhanced date extraction
      const datePatterns = [
        /(\d{1,2})\s*de\s*(\w+)\s*de\s*(\d{4})/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /\b(\d{4})\b/
      ];
      
      for (const pattern of datePatterns) {
        const match = cellText.match(pattern);
        if (match && !year) {
          const yearNum = parseInt(match[match.length - 1]); // Last capture group is usually year
          if (yearNum >= 1950 && yearNum <= new Date().getFullYear() + 5) {
            year = { start: yearNum, end: null };
            break;
          }
        }
      }
      
      // Enhanced episode extraction
      const episodePatterns = [
        /(\d+)\s*(capítulos?|cap\.?)/i,
        /(\d+)\s*(episódios?|ep\.?)/i,
        /\b(\d{2,4})\s*eps?\b/i
      ];
      
      for (const pattern of episodePatterns) {
        const match = cellText.match(pattern);
        if (match && !episodes) {
          const epCount = parseInt(match[1]);
          if (epCount > 0 && epCount < 2000) {
            episodes = epCount;
            break;
          }
        }
      }
      
      // Extract genres from cell text
      const genreKeywords = ['drama', 'comédia', 'romance', 'suspense', 'ação', 'musical', 'histórico', 'infantil', 'aventura'];
      genreKeywords.forEach(genre => {
        if (cellText.toLowerCase().includes(genre) && !genres.some(g => g.toLowerCase() === genre)) {
          genres.push(this.capitalizeFirst(genre));
        }
      });
    });
    
    // Enhanced authorship and direction extraction
    if (cellsArray.length > 6) {
      const authorText = this.cleanText($(cellsArray[6]).text());
      if (authorText && !authorText.match(/^\d+$/) && authorText.length > 2) {
        author = authorText.split(',')[0].trim(); // Get first author if multiple
      }
    }
    
    if (cellsArray.length > 7) {
      const directorText = this.cleanText($(cellsArray[7]).text());
      if (directorText && !directorText.match(/^\d+$/) && directorText.length > 2) {
        director = directorText.split(',')[0].trim(); // Get first director if multiple
      }
    }
    
    // Clean up genres array
    genres = [...new Set(genres)].slice(0, 3);
    
    return {
      id: this.generateId(title),
      title,
      country: sourceInfo.country,
      broadcaster: sourceInfo.broadcaster,
      year,
      genre: genres,
      synopsis: `${title} é uma telenovela da ${sourceInfo.broadcaster}.`,
      cast: [],
      episodes: episodes || this.estimateEpisodes(sourceInfo.country),
      director,
      author,
      wikipediaUrl: wikipediaUrl || '',
      imageUrl: '',
      scraped: new Date().toISOString()
    };
  }

  /**
   * Parse Globo table row (English Wikipedia)
   * Columns: Title, Episodes, Author(s), First Air Date, Last Air Date
   */
  parseGloboTableRow($, cells, sourceInfo) {
    const cellsArray = cells.toArray();
    if (cellsArray.length < 3) return null;
    
    let title = '';
    let year = null;
    let episodes = null;
    let author = '';
    let wikipediaUrl = '';
    
    // Title is usually first column
    const titleCell = $(cellsArray[0]);
    const titleLink = titleCell.find('a').first();
    
    if (titleLink.length > 0) {
      title = this.cleanText(titleLink.text());
      const href = titleLink.attr('href');
      if (href && href.startsWith('/wiki/')) {
        const baseUrl = sourceInfo.language === 'en' ? 'https://en.wikipedia.org' : 'https://pt.wikipedia.org';
        wikipediaUrl = baseUrl + href;
      }
    } else {
      title = this.cleanText(titleCell.text());
    }
    
    // Episodes in second column
    if (cellsArray.length > 1) {
      const episodeText = $(cellsArray[1]).text();
      const episodeMatch = episodeText.match(/(\d+)/);
      if (episodeMatch) {
        episodes = parseInt(episodeMatch[1]);
      }
    }
    
    // Author in third column
    if (cellsArray.length > 2) {
      author = this.cleanText($(cellsArray[2]).text());
    }
    
    // Extract year from air dates (columns 3 and 4)
    if (cellsArray.length > 3) {
      const firstAirDate = $(cellsArray[3]).text();
      const yearMatch = firstAirDate.match(/(\d{4})/);
      if (yearMatch) {
        year = { start: parseInt(yearMatch[1]), end: null };
        
        // Check for end year in last air date
        if (cellsArray.length > 4) {
          const lastAirDate = $(cellsArray[4]).text();
          const endYearMatch = lastAirDate.match(/(\d{4})/);
          if (endYearMatch) {
            year.end = parseInt(endYearMatch[1]);
          }
        }
      }
    }
    
    return {
      id: this.generateId(title),
      title,
      country: sourceInfo.country,
      broadcaster: sourceInfo.broadcaster,
      year,
      genre: ['Drama'],
      synopsis: `${title} é uma telenovela da ${sourceInfo.broadcaster}.`,
      cast: [],
      episodes: episodes || this.estimateEpisodes(sourceInfo.country),
      director: '',
      author,
      wikipediaUrl: wikipediaUrl || '',
      imageUrl: '',
      scraped: new Date().toISOString()
    };
  }

  /**
   * Parse Band table row
   * Similar structure to Record with numbered entries
   */
  parseBandTableRow($, cells, sourceInfo) {
    const cellsArray = cells.toArray();
    if (cellsArray.length < 4) return null;
    
    let title = '';
    let year = null;
    let episodes = null;
    let author = '';
    let director = '';
    let wikipediaUrl = '';
    
    // Extract title (look for link or main title column)
    for (let i = 0; i < Math.min(4, cellsArray.length); i++) {
      const cell = $(cellsArray[i]);
      const link = cell.find('a').first();
      
      if (link.length > 0 && !title) {
        title = this.cleanText(link.text());
        const href = link.attr('href');
        if (href && href.startsWith('/wiki/')) {
          const baseUrl = sourceInfo.language === 'en' ? 'https://en.wikipedia.org' : 'https://pt.wikipedia.org';
          wikipediaUrl = baseUrl + href;
        }
        break;
      }
    }
    
    // Fallback to text extraction
    if (!title && cellsArray.length > 1) {
      title = this.cleanText($(cellsArray[1]).text());
    }
    
    // Extract dates, episodes, and other data
    cellsArray.forEach((cell, index) => {
      const cellText = $(cell).text();
      
      // Year extraction
      const yearMatch = cellText.match(/(\d{4})/);
      if (yearMatch && !year) {
        year = { start: parseInt(yearMatch[1]), end: null };
      }
      
      // Episodes extraction
      const episodeMatch = cellText.match(/(\d+)\s*(cap|ep|episódios?|capítulos?)/i);
      if (episodeMatch) {
        episodes = parseInt(episodeMatch[1]);
      }
    });
    
    return {
      id: this.generateId(title),
      title,
      country: sourceInfo.country,
      broadcaster: sourceInfo.broadcaster,
      year,
      genre: ['Drama'],
      synopsis: `${title} é uma telenovela da ${sourceInfo.broadcaster}.`,
      cast: [],
      episodes: episodes || this.estimateEpisodes(sourceInfo.country),
      director,
      author,
      wikipediaUrl: wikipediaUrl || '',
      imageUrl: '',
      scraped: new Date().toISOString()
    };
  }

  /**
   * Parse SBT table row
   * Detailed structure with episodes, timeslot, authorship, direction
   */
  parseSbtTableRow($, cells, sourceInfo) {
    const cellsArray = cells.toArray();
    if (cellsArray.length < 4) return null;
    
    let title = '';
    let year = null;
    let episodes = null;
    let author = '';
    let director = '';
    let wikipediaUrl = '';
    
    // Title extraction (look for italicized title or link)
    for (let i = 0; i < Math.min(4, cellsArray.length); i++) {
      const cell = $(cellsArray[i]);
      
      // Look for italicized title first
      const italicTitle = cell.find('i').first();
      if (italicTitle.length > 0 && !title) {
        title = this.cleanText(italicTitle.text());
      }
      
      // Look for linked title
      const link = cell.find('a').first();
      if (link.length > 0 && !title) {
        title = this.cleanText(link.text());
        const href = link.attr('href');
        if (href && href.startsWith('/wiki/')) {
          const baseUrl = sourceInfo.language === 'en' ? 'https://en.wikipedia.org' : 'https://pt.wikipedia.org';
          wikipediaUrl = baseUrl + href;
        }
      }
      
      if (title) break;
    }
    
    // Extract data from all cells
    cellsArray.forEach((cell, index) => {
      const cellText = $(cell).text();
      
      // Year and date extraction
      const dateMatch = cellText.match(/(\d{1,2})\s*de\s*\w+\s*de\s*(\d{4})/i);
      if (dateMatch && !year) {
        year = { start: parseInt(dateMatch[2]), end: null };
      } else {
        const yearMatch = cellText.match(/(\d{4})/);
        if (yearMatch && !year) {
          year = { start: parseInt(yearMatch[1]), end: null };
        }
      }
      
      // Episodes extraction
      const episodeMatch = cellText.match(/(\d+)\s*(cap|ep|episódios?|capítulos?)/i);
      if (episodeMatch) {
        episodes = parseInt(episodeMatch[1]);
      }
    });
    
    // Author and director from later columns if available
    if (cellsArray.length > 6) {
      author = this.cleanText($(cellsArray[6]).text());
    }
    if (cellsArray.length > 7) {
      director = this.cleanText($(cellsArray[7]).text());
    }
    
    return {
      id: this.generateId(title),
      title,
      country: sourceInfo.country,
      broadcaster: sourceInfo.broadcaster,
      year,
      genre: ['Drama'],
      synopsis: `${title} é uma telenovela do ${sourceInfo.broadcaster}.`,
      cast: [],
      episodes: episodes || this.estimateEpisodes(sourceInfo.country),
      director,
      author,
      wikipediaUrl: wikipediaUrl || '',
      imageUrl: '',
      scraped: new Date().toISOString()
    };
  }

  /**
   * Generate a unique ID for a novela
   */
  generateId(title) {
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50); // Limit length
      
    return `${slug}-${this.currentId++}`;
  }

  /**
   * Clean text content
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\[.*?\]/g, '') // Remove Wikipedia references
      .trim();
  }

  /**
   * Capitalize first letter
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Validate novela object
   */
  isValidNovela(novela) {
    if (!novela || !novela.title || !novela.country) return false;
    
    const title = novela.title.toLowerCase();
    
    // Length validation
    if (novela.title.length < 3 || novela.title.length > 100) return false;
    
    // Filter out Wikipedia navigation and meta pages
    const invalidTerms = [
      'lista de', 'anexo:', 'categoria:', 'página principal', 'conteúdo destacado',
      'eventos atuais', 'esplanada', 'página aleatória', 'portais', 'páginas especiais',
      'boas-vindas', 'ajuda', 'páginas de testes', 'portal comunitário', 'mudanças recentes',
      'manutenção', 'criar página', 'páginas novas', 'contato', 'artigo', 'ler',
      'páginas afluentes', 'alterações relacionadas', 'desambiguação', 'sobre a wikipédia',
      'avisos gerais', 'desambiguações de', 'especial:', 'wikipedia:', 'wikimedia',
      'discussão:', 'usuário:', 'ficheiro:', 'mídia:', 'predefinição:', 'módulo:',
      'editar', 'histórico', 'ver código', 'imprimir', 'exportar', 'ferramentas',
      'navegar', 'busca', 'contribuir', 'interação', 'acessibilidade'
    ];
    
    // Check if title contains any invalid terms
    for (const term of invalidTerms) {
      if (title.includes(term)) return false;
    }
    
    // Filter URLs that are clearly not novela pages
    if (novela.wikipediaUrl) {
      const url = novela.wikipediaUrl.toLowerCase();
      const invalidUrlPatterns = [
        '/especial:', '/wikipedia:', '/portal:', '/categoria:', '/ajuda:',
        '/ficheiro:', '/mídia:', '/predefinição:', '/módulo:', '/discussão:',
        '/usuário:', '/wikimedia'
      ];
      
      for (const pattern of invalidUrlPatterns) {
        if (url.includes(pattern)) return false;
      }
    }
    
    return true;
  }

  /**
   * Estimate episode count based on country/broadcaster
   */
  estimateEpisodes(country) {
    const estimates = {
      'Brasil': 180,
      'México': 120,
      'Coreia do Sul': 16,
      'Colômbia': 100,
      'Argentina': 150,
      'Venezuela': 120,
      'Chile': 80,
      'Peru': 100,
      'Espanha': 60,
      'Portugal': 100,
      'Turquia': 150,
      'Índia': 200
    };
    
    return estimates[country] || 120;
  }

  /**
   * Remove duplicate novelas with comprehensive deduplication
   */
  deduplicate(novelas) {
    const unique = [];
    const seenTitles = new Set();
    const seenUrls = new Set();
    const titleToNovela = new Map();
    
    for (const novela of novelas) {
      const normalizedTitle = this.normalizeForComparison(novela.title);
      const cleanUrl = novela.wikipediaUrl ? novela.wikipediaUrl.split('#')[0].toLowerCase() : '';
      
      let isDuplicate = false;
      let existingNovela = null;
      
      // Check for URL duplication first (most reliable)
      if (cleanUrl && seenUrls.has(cleanUrl)) {
        isDuplicate = true;
        // Find the existing novela with this URL
        existingNovela = unique.find(n => {
          const existingUrl = n.wikipediaUrl ? n.wikipediaUrl.split('#')[0].toLowerCase() : '';
          return existingUrl === cleanUrl;
        });
      }
      // Check for title similarity if no URL match
      else if (seenTitles.has(normalizedTitle)) {
        isDuplicate = true;
        existingNovela = titleToNovela.get(normalizedTitle);
      }
      // Check for fuzzy title matching for close variations
      else {
        for (const existingTitle of seenTitles) {
          if (this.titlesAreSimilar(normalizedTitle, existingTitle)) {
            isDuplicate = true;
            existingNovela = titleToNovela.get(existingTitle);
            break;
          }
        }
      }
      
      if (isDuplicate && existingNovela) {
        // Merge data from duplicate into existing novela
        this.mergeNovelasData(existingNovela, novela);
        console.log(`🔄 Merged duplicate: ${novela.title}`);
      } else {
        // Add as new novela
        seenTitles.add(normalizedTitle);
        if (cleanUrl) seenUrls.add(cleanUrl);
        titleToNovela.set(normalizedTitle, novela);
        unique.push(novela);
      }
    }
    
    console.log(`📊 Deduplication: ${novelas.length} → ${unique.length} (removed ${novelas.length - unique.length} duplicates)`);
    return unique;
  }
  
  /**
   * Normalize text for comparison
   */
  normalizeForComparison(text) {
    return text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '') // Remove spaces
      .trim();
  }
  
  /**
   * Check if two titles are similar using fuzzy matching
   */
  titlesAreSimilar(title1, title2) {
    if (title1 === title2) return true;
    
    // Calculate Levenshtein distance for similarity
    const distance = this.levenshteinDistance(title1, title2);
    const maxLength = Math.max(title1.length, title2.length);
    const similarity = 1 - (distance / maxLength);
    
    // Consider similar if 85% or more similar
    return similarity >= 0.85;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[len2][len1];
  }
  
  /**
   * Merge data from duplicate novela into existing one
   */
  mergeNovelasData(existing, duplicate) {
    // Merge fields that might be better in the duplicate
    const fieldsToMerge = ['synopsis', 'cast', 'director', 'author', 'episodes', 'imageUrl', 'genre'];
    
    fieldsToMerge.forEach(field => {
      if (this.isFieldBetter(existing[field], duplicate[field])) {
        existing[field] = duplicate[field];
      }
    });
    
    // Merge genres
    if (duplicate.genre && Array.isArray(duplicate.genre)) {
      const existingGenres = existing.genre || [];
      existing.genre = [...new Set([...existingGenres, ...duplicate.genre])].slice(0, 5);
    }
    
    // Update scraped date
    existing.updatedAt = new Date().toISOString();
  }
  
  /**
   * Determine if a field value is better than existing
   */
  isFieldBetter(existingValue, newValue) {
    if (!newValue) return false;
    if (!existingValue) return true;
    
    if (typeof existingValue === 'string' && typeof newValue === 'string') {
      // Prefer longer, more descriptive text
      if (newValue.length > existingValue.length * 1.5) return true;
      // Prefer non-generic text
      if (existingValue.includes('é uma telenovela') && !newValue.includes('é uma telenovela')) return true;
    }
    
    if (Array.isArray(existingValue) && Array.isArray(newValue)) {
      return newValue.length > existingValue.length;
    }
    
    return false;
  }
}

/**
 * Extract comprehensive information from individual novela pages
 */
export async function parseNovelDetailsPage(html) {
  const $ = cheerio.load(html);
  
  // Extract from infobox
  const infobox = $('.infobox, .infobox_v2');
  const details = {
    cast: [],
    director: '',
    author: '',
    episodes: null,
    synopsis: '',
    imageUrl: '',
    genre: [],
    productionCompany: '',
    originalNetwork: '',
    year: null,
    country: '',
    language: ''
  };
  
  // Helper function to find infobox rows
  const findInfoboxRow = (keywords) => {
    return infobox.find('tr').filter((i, el) => {
      const text = $(el).find('th, td').first().text().toLowerCase();
      return keywords.some(keyword => text.includes(keyword));
    });
  };
  
  // Extract cast from infobox - focus on main cast
  const castRow = findInfoboxRow(['elenco', 'protagonistas', 'cast', 'starring', 'protagonista']);
  if (castRow.length > 0) {
    const castCell = castRow.find('td').first();
    // Try to get only main cast by looking for links or bold text
    const castLinks = castCell.find('a');
    if (castLinks.length > 0) {
      details.cast = castLinks.map((i, el) => $(el).text().trim())
        .get()
        .filter(name => name.length > 2)
        .slice(0, 8); // Limit to main cast
    } else {
      // Fallback to text parsing
      const castText = castCell.text();
      details.cast = castText.split(/[,\n•]/)
        .map(name => name.trim())
        .filter(name => name.length > 2 && !name.includes('['))
        .slice(0, 8);
    }
  }
  
  // Extract director
  const directorRow = findInfoboxRow(['direção', 'director', 'dirigida', 'directed']);
  if (directorRow.length > 0) {
    const directorText = directorRow.find('td').text().trim();
    details.director = directorText.split(/[,\n]/)[0].trim(); // Get first director
  }
  
  // Extract author/creator
  const authorRow = findInfoboxRow(['autor', 'criação', 'roteiro', 'created', 'writer', 'screenplay']);
  if (authorRow.length > 0) {
    const authorText = authorRow.find('td').text().trim();
    details.author = authorText.split(/[,\n]/)[0].trim(); // Get main author
  }
  
  // Extract production company
  const productionRow = findInfoboxRow(['produtora', 'production', 'produtor', 'producer']);
  if (productionRow.length > 0) {
    details.productionCompany = productionRow.find('td').text().trim().split(/[,\n]/)[0].trim();
  }
  
  // Extract original network
  const networkRow = findInfoboxRow(['emissora', 'rede', 'network', 'channel', 'broadcaster']);
  if (networkRow.length > 0) {
    details.originalNetwork = networkRow.find('td').text().trim().split(/[,\n]/)[0].trim();
  }
  
  // Extract genre(s)
  const genreRow = findInfoboxRow(['gênero', 'género', 'genre']);
  if (genreRow.length > 0) {
    const genreText = genreRow.find('td').text();
    details.genre = genreText.split(/[,\n•]/)
      .map(genre => genre.trim())
      .filter(genre => genre.length > 0 && genre.length < 20)
      .slice(0, 5); // Limit to 5 genres
  }
  
  // Extract country
  const countryRow = findInfoboxRow(['país', 'country', 'origin']);
  if (countryRow.length > 0) {
    details.country = countryRow.find('td').text().trim().split(/[,\n]/)[0].trim();
  }
  
  // Extract language
  const languageRow = findInfoboxRow(['idioma', 'language', 'língua']);
  if (languageRow.length > 0) {
    details.language = languageRow.find('td').text().trim().split(/[,\n]/)[0].trim();
  }
  
  // Extract episodes count
  const episodesRow = findInfoboxRow(['episódios', 'capítulos', 'episodes']);
  if (episodesRow.length > 0) {
    const episodesText = episodesRow.find('td').text();
    const match = episodesText.match(/(\d+)/);
    if (match) {
      details.episodes = parseInt(match[1]);
    }
  }
  
  // Extract year from air dates
  const airDateRow = findInfoboxRow(['exibição', 'transmissão', 'aired', 'original run', 'period']);
  if (airDateRow.length > 0) {
    const dateText = airDateRow.find('td').text();
    const yearMatch = dateText.match(/(\d{4})/);
    if (yearMatch) {
      const startYear = parseInt(yearMatch[1]);
      const yearRangeMatch = dateText.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
      if (yearRangeMatch) {
        details.year = { 
          start: parseInt(yearRangeMatch[1]), 
          end: parseInt(yearRangeMatch[2]) 
        };
      } else {
        details.year = { start: startYear, end: null };
      }
    }
  }
  
  // Extract image - comprehensive search with multiple strategies
  let imageFound = false;
  let bestImage = null;
  const candidateImages = [];
  
  // Strategy 1: Specific XPath for novela images (highest priority)
  // Convert XPath //*[@id="mw-content-text"]/div[1]/table[2]/tbody/tr[2]/td/span/a/img to CSS selector
  try {
    // Try multiple variations of the infobox image location
    const xpathSelectors = [
      '#mw-content-text > div:first-child table:nth-of-type(1) tr:nth-child(2) td span a img',
      '#mw-content-text .mw-parser-output table:nth-of-type(1) tr:nth-child(2) td span a img',
      '#mw-content-text table.infobox tr:nth-child(2) td span a img',
      '#mw-content-text .infobox tr:nth-child(2) td span a img'
    ];
    
    for (const selector of xpathSelectors) {
      const specificImagePath = $(selector);
      if (specificImagePath.length > 0) {
        const src = specificImagePath.attr('src');
        if (src && isValidImage(src)) {
          candidateImages.push({ src, priority: 0, source: 'specific-xpath', selector });
          console.log(`✅ Found image using XPath selector: ${selector}`);
          break; // Found image with highest priority selector
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Specific XPath image search failed, continuing with fallbacks:', error.message);
  }
  
  // Strategy 2: Enhanced infobox image search (high priority)
  const infoboxSelectors = [
    '.infobox img',
    'table.infobox img', 
    '.infobox_v2 img',
    '[class*="infobox"] img',
    'table[class*="infobox"] img'
  ];
  
  for (const selector of infoboxSelectors) {
    const infoboxImages = $(selector);
    infoboxImages.each((i, img) => {
      const src = $(img).attr('src');
      const alt = $(img).attr('alt') || '';
      if (src && isValidImage(src)) {
        // Prioritize images that are likely to be the main poster
        let priority = 1;
        if (alt.toLowerCase().includes('poster') || alt.toLowerCase().includes('capa')) {
          priority = 0.5; // Higher priority for poster images
        }
        candidateImages.push({ src, priority, source: 'infobox', selector, alt });
        console.log(`📸 Found infobox image: ${selector} (alt: ${alt})`);
      }
    });
    
    // If we found images with this selector, log it
    if (infoboxImages.length > 0) {
      console.log(`🔍 Searched infobox with selector: ${selector} - found ${infoboxImages.length} images`);
    }
  }
  
  // Strategy 3: Enhanced table image search focusing on content tables
  const tableSelectors = [
    'table.wikitable img',
    'table[class*="infobox"] img',
    'table img[alt*="poster" i]',
    'table img[alt*="capa" i]',
    'table img[alt*="logo" i]',
    '#mw-content-text table img',
    '.mw-parser-output table img'
  ];
  
  for (const selector of tableSelectors) {
    const tableImages = $(selector);
    tableImages.each((i, img) => {
      const src = $(img).attr('src');
      const alt = $(img).attr('alt') || '';
      if (src && isValidImage(src)) {
        let priority = 1.5;
        
        // Higher priority for poster-like images
        if (alt.toLowerCase().includes('poster') || alt.toLowerCase().includes('capa') || alt.toLowerCase().includes('logo')) {
          priority = 1;
        }
        
        // Skip if already found in higher priority searches
        const alreadyFound = candidateImages.some(candidate => candidate.src === src);
        if (!alreadyFound) {
          candidateImages.push({ src, priority, source: 'table-enhanced', selector, alt });
          console.log(`🖼️ Found table image: ${selector} (alt: ${alt})`);
        }
      }
    });
  }
  
  // Strategy 4: Enhanced thumbnail and figure image search (medium priority)
  const thumbnailSelectors = [
    '.thumbinner img',
    '.thumb img', 
    '.thumbimage',
    'figure img',
    '.mw-default-size img',
    'div[class*="thumb"] img',
    'span[class*="thumb"] img'
  ];
  
  for (const selector of thumbnailSelectors) {
    const thumbnailImages = $(selector);
    thumbnailImages.each((i, img) => {
      const src = $(img).attr('src');
      const alt = $(img).attr('alt') || '';
      if (src && isValidImage(src)) {
        // Skip if already found in higher priority searches
        const alreadyFound = candidateImages.some(candidate => candidate.src === src);
        if (!alreadyFound) {
          candidateImages.push({ src, priority: 2, source: 'thumbnail', selector, alt });
          console.log(`🖼️ Found thumbnail image: ${selector} (alt: ${alt})`);
        }
      }
    });
  }
  
  // Strategy 5: Comprehensive content area image search (lower priority)
  const contentSelectors = [
    '#mw-content-text img',
    '.mw-parser-output img',
    'div.mw-content-ltr img',
    'div[id*="content"] img'
  ];
  
  for (const selector of contentSelectors) {
    const allImages = $(selector);
    allImages.each((i, img) => {
      const src = $(img).attr('src');
      const alt = $(img).attr('alt') || '';
      if (src && isValidImage(src)) {
        // Skip if already found in higher priority searches
        const alreadyFound = candidateImages.some(candidate => candidate.src === src);
        if (!alreadyFound) {
          candidateImages.push({ src, priority: 3, source: 'content', selector, alt });
          console.log(`🔍 Found content image: ${selector} (alt: ${alt})`);
        }
      }
    });
  }
  
  // Log total candidates found
  console.log(`📊 Total image candidates found: ${candidateImages.length}`);
  
  // Select best image based on comprehensive scoring
  if (candidateImages.length > 0) {
    // Score each candidate and sort by quality
    candidateImages.forEach(candidate => {
      candidate.score = scoreImageQuality(candidate);
    });
    
    candidateImages.sort((a, b) => b.score - a.score);
    
    bestImage = candidateImages[0];
    details.imageUrl = normalizeWikipediaImageUrl(bestImage.src);
    imageFound = true;
    
    // Log the successful image extraction for debugging
    console.log(`✅ Selected best image: ${bestImage.source} (score: ${bestImage.score}, selector: ${bestImage.selector || 'N/A'})`);
    console.log(`🔗 Image URL: ${details.imageUrl}`);
  } else {
    console.log('❌ No valid images found for this novela');
    if (candidateImages.length > 0) {
      console.log('🚫 Rejected candidates:');
      candidateImages.forEach((candidate, index) => {
        console.log(`   ${index + 1}. ${candidate.source}: ${candidate.src} (score: ${candidate.score || 'N/A'})`);
      });
    }
  }
  
  // Helper function to validate image URLs with enhanced filtering
  function isValidImage(src) {
    if (!src || typeof src !== 'string') return false;
    
    // Must be from Wikipedia/Wikimedia (relaxed check for better coverage)
    if (!/upload\.wikimedia\.org|commons\.wikimedia|wikipedia/i.test(src)) {
      console.log(`❌ Image rejected - not from Wikimedia: ${src}`);
      return false;
    }
    
    // Only allow image formats
    if (!/\.(jpg|jpeg|png|gif|webp|svg)(\?|$|\/|:)/i.test(src)) {
      console.log(`❌ Image rejected - invalid format: ${src}`);
      return false;
    }
    
    // More lenient size checking - only skip extremely small images
    if (/\b\d+px\b/.test(src)) {
      const sizeMatch = src.match(/\b(\d+)px\b/);
      if (sizeMatch && parseInt(sizeMatch[1]) < 50) {
        console.log(`❌ Image rejected - too small (${sizeMatch[1]}px): ${src}`);
        return false;
      }
    }
    
    // Skip specific UI and navigation elements (but be more permissive)
    if (/\b(edit-icon|external-link|arrow-icon|OOjs_UI|Symbol_category|Commons-logo|Edit-icon)\b/i.test(src)) {
      console.log(`❌ Image rejected - UI element: ${src}`);
      return false;
    }
    
    // Skip static UI images
    if (/\/static\/images\//.test(src)) {
      console.log(`❌ Image rejected - static UI: ${src}`);
      return false;
    }
    
    // Accept the image
    console.log(`✅ Image accepted: ${src}`);
    return true;
  }
  
  // Helper function to score image quality
  function scoreImageQuality(candidate) {
    let score = 0;
    const { src, source } = candidate;
    
    // Priority by source type
    if (source === 'specific-xpath') score += 100;
    else if (source === 'infobox') score += 80;
    else if (source === 'table-poster') score += 75;
    else if (source === 'thumbnail') score += 60;
    else score += 40;
    
    // Prefer larger images
    const sizeMatch = src.match(/\b(\d+)px\b/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      if (size >= 300) score += 30;
      else if (size >= 200) score += 20;
      else if (size >= 100) score += 10;
    }
    
    // Prefer poster/cover/logo keywords
    if (/poster|capa|cover|logo/i.test(src)) score += 25;
    
    // Prefer JPG/PNG over SVG for posters
    if (/\.(jpg|jpeg|png)/i.test(src)) score += 15;
    
    return score;
  }
  
  // Extract comprehensive synopsis with multiple strategies
  const contentDiv = $('#mw-content-text .mw-parser-output, #mw-content-text');
  let synopsis = '';
  let synopsisFound = false;
  
  // Strategy 1: Look for specific sections with plot/synopsis
  const plotSections = ['Enredo', 'Sinopse', 'Plot', 'Synopsis', 'História', 'Story', 'Trama'];
  for (const sectionName of plotSections) {
    const sectionHeader = contentDiv.find(`h2, h3, h4`).filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes(sectionName.toLowerCase());
    });
    
    if (sectionHeader.length > 0) {
      // Get paragraphs after this section header until next header
      let nextElement = sectionHeader.next();
      let sectionText = '';
      
      while (nextElement.length > 0 && !nextElement.is('h1, h2, h3, h4')) {
        if (nextElement.is('p')) {
          const pText = nextElement.text().trim();
          if (pText.length > 30 && !isMetaText(pText)) {
            sectionText += pText + ' ';
            if (sectionText.length > 200) break; // Got enough content
          }
        }
        nextElement = nextElement.next();
      }
      
      if (sectionText.length > 100) {
        synopsis = sectionText;
        synopsisFound = true;
        break;
      }
    }
  }
  
  // Strategy 2: If no specific section found, get meaningful paragraphs from start
  if (!synopsisFound) {
    const paragraphs = contentDiv.find('p').slice(0, 5);
    paragraphs.each((_, p) => {
      const text = $(p).text().trim();
      if (text.length > 50 && !isMetaText(text) && !synopsis.includes(text.substring(0, 50))) {
        synopsis += text + ' ';
        if (synopsis.length > 300) return false; // Break out of each loop
      }
    });
  }
  
  // Clean and validate synopsis
  if (synopsis.length > 100) {
    synopsis = cleanSynopsis(synopsis);
    if (synopsis.length > 100) {
      details.synopsis = synopsis.substring(0, 800) + (synopsis.length > 800 ? '...' : '');
      synopsisFound = true;
    }
  }
  
  // Helper function to detect meta/navigation text
  function isMetaText(text) {
    const metaPatterns = [
      'coordinates:', 'disambiguation', 'this article', 'wikipedia', 'citation needed',
      'ver também', 'see also', 'referências', 'references', 'ligações externas',
      'external links', 'categoria:', 'category:', 'this page', 'may refer to',
      'the following', 'redirect', 'retrieved', 'isbn', 'doi:', 'archived from',
      'wayback machine', 'access date', 'originally aired', 'primeiro episódio',
      'último episódio', 'temporada', 'season', 'episodes?\\s*:', 'capítulos?\\s*:'
    ];
    
    const lowerText = text.toLowerCase();
    return metaPatterns.some(pattern => {
      try {
        return new RegExp(pattern, 'i').test(lowerText);
      } catch {
        return lowerText.includes(pattern);
      }
    });
  }
  
  // Helper function to clean synopsis text
  function cleanSynopsis(text) {
    return text
      .replace(/\[[^\]]*\]/g, '') // Remove Wikipedia citations
      .replace(/\([^)]*\d{4}[^)]*\)/g, '') // Remove year references in parentheses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\.\s*\./g, '.') // Fix double periods
      .trim();
  }
  
  if (!synopsisFound) {
    console.log('⚠️ No quality synopsis found, will use default');
  }
  
  // Clean up empty arrays and strings
  Object.keys(details).forEach(key => {
    if (Array.isArray(details[key]) && details[key].length === 0) {
      delete details[key];
    } else if (typeof details[key] === 'string' && details[key].trim() === '') {
      delete details[key];
    }
  });
  
  return details;
}

/**
 * Normalize Wikipedia image URLs to get higher resolution versions
 */
function normalizeWikipediaImageUrl(src) {
  if (!src) return '';
  
  // Handle protocol-relative URLs
  if (src.startsWith('//')) {
    src = 'https:' + src;
  } else if (src.startsWith('/')) {
    src = 'https://upload.wikimedia.org' + src;
  }
  
  // For very small thumbnails, try to get a larger version but keep the thumbnail URL structure
  // This is safer than trying to get the original which might not exist
  if (src.includes('/thumb/') && /\/\d+px-/.test(src)) {
    // Only increase size for very small images (under 100px), otherwise keep original
    const sizeMatch = src.match(/\/(\d+)px-/);
    if (sizeMatch && parseInt(sizeMatch[1]) < 100) {
      // Try to get a 400px version instead
      src = src.replace(/\/\d+px-/, '/400px-');
    }
  }
  
  // Ensure we're using HTTPS
  src = src.replace(/^http:/, 'https:');
  
  return src;
}