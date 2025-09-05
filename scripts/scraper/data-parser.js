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
      synopsis: synopsis || `${title} é uma ${sourceInfo.country === 'Brasil' ? 'telenovela' : 'série'} de ${sourceInfo.broadcaster}.`,
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
   * Parse Record TV table row
   * Columns: #, Start Date, End Date, Title, Episodes, Timeslot, Authorship, Direction
   */
  parseRecordTableRow($, cells, sourceInfo) {
    const cellsArray = cells.toArray();
    if (cellsArray.length < 4) return null;
    
    // Typically: column 3 is title, columns 1-2 are dates
    let title = '';
    let year = null;
    let episodes = null;
    let author = '';
    let director = '';
    let wikipediaUrl = '';
    
    // Extract title (usually column 3 or first column with a link)
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
    
    // If no link found, try to extract title from a text cell
    if (!title && cellsArray.length > 3) {
      title = this.cleanText($(cellsArray[3]).text());
    }
    
    // Extract dates and year
    cellsArray.forEach((cell, index) => {
      const cellText = $(cell).text();
      
      // Look for dates and extract year
      const dateMatch = cellText.match(/(\d{1,2})\s*de\s*\w+\s*de\s*(\d{4})/i);
      if (dateMatch && !year) {
        const yearNum = parseInt(dateMatch[2]);
        year = { start: yearNum, end: null };
      }
      
      // Look for year only
      if (!year) {
        const yearMatch = cellText.match(/(\d{4})/);
        if (yearMatch) {
          year = { start: parseInt(yearMatch[1]), end: null };
        }
      }
      
      // Look for episodes
      const episodeMatch = cellText.match(/(\d+)\s*(cap|ep|episódios?|capítulos?)/i);
      if (episodeMatch) {
        episodes = parseInt(episodeMatch[1]);
      }
    });
    
    // Extract authorship (usually later columns)
    if (cellsArray.length > 6) {
      author = this.cleanText($(cellsArray[6]).text());
    }
    
    // Extract direction
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
   * Remove duplicate novelas based on title similarity
   */
  deduplicate(novelas) {
    const unique = [];
    const seen = new Set();
    
    for (const novela of novelas) {
      const normalizedTitle = novela.title.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '');
      
      if (!seen.has(normalizedTitle)) {
        seen.add(normalizedTitle);
        unique.push(novela);
      }
    }
    
    return unique;
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
  
  // Extract image - prioritize high quality images with comprehensive search
  let imageFound = false;
  let bestImage = null;
  const candidateImages = [];
  
  // Strategy 1: Try infobox image first (highest priority)
  const infoboxImages = infobox.find('img');
  infoboxImages.each((i, img) => {
    const src = $(img).attr('src');
    if (src && isValidImage(src)) {
      candidateImages.push({ src, priority: 1, source: 'infobox' });
    }
  });
  
  // Strategy 2: Try thumbnail images (medium priority) 
  const thumbnailImages = $('.thumbinner img, .thumb img, .thumbimage');
  thumbnailImages.each((i, img) => {
    const src = $(img).attr('src');
    if (src && isValidImage(src)) {
      candidateImages.push({ src, priority: 2, source: 'thumbnail' });
    }
  });
  
  // Strategy 3: Search all img tags in content area (lower priority)
  const allImages = $('#mw-content-text img, .mw-parser-output img');
  allImages.each((i, img) => {
    const src = $(img).attr('src');
    if (src && isValidImage(src)) {
      // Skip if already found in higher priority searches
      const alreadyFound = candidateImages.some(candidate => candidate.src === src);
      if (!alreadyFound) {
        candidateImages.push({ src, priority: 3, source: 'content' });
      }
    }
  });
  
  // Select best image based on priority and quality
  if (candidateImages.length > 0) {
    // Sort by priority first, then by image quality indicators
    candidateImages.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      
      // Prefer larger images (less likely to be thumbnails)
      const aHasSize = /\d+px/i.test(a.src);
      const bHasSize = /\d+px/i.test(b.src);
      if (aHasSize !== bHasSize) return aHasSize ? 1 : -1;
      
      // Prefer common image formats for posters/logos
      const aIsLogo = /logo|poster|banner/i.test(a.src);
      const bIsLogo = /logo|poster|banner/i.test(b.src);
      if (aIsLogo !== bIsLogo) return bIsLogo ? 1 : -1;
      
      return 0;
    });
    
    bestImage = candidateImages[0];
    details.imageUrl = normalizeWikipediaImageUrl(bestImage.src);
    imageFound = true;
  }
  
  // Helper function to validate image URLs
  function isValidImage(src) {
    if (!src || typeof src !== 'string') return false;
    
    // Must be from Wikipedia/Wikimedia first
    if (!/upload\.wikimedia\.org/i.test(src) && !/wikipedia/i.test(src)) return false;
    
    // Only allow image formats
    if (!/\.(jpg|jpeg|png|gif|webp|svg)(\?|$|\/)/i.test(src)) return false;
    
    // Skip very small images and UI elements
    if (/\b\d+px\b/.test(src)) {
      const sizeMatch = src.match(/\b(\d+)px\b/);
      if (sizeMatch && parseInt(sizeMatch[1]) < 50) return false;
    }
    
    // Skip specific UI and navigation elements
    if (/\b(edit|external|arrow|icon|bullet|flag|star|OOjs_UI|Symbol_category)\b/i.test(src)) return false;
    
    // Skip static UI images
    if (/\/static\/images\//.test(src)) return false;
    
    return true;
  }
  
  // Extract comprehensive synopsis from multiple paragraphs
  const contentDiv = $('#mw-content-text .mw-parser-output, #mw-content-text');
  let synopsis = '';
  
  // Get first few meaningful paragraphs
  const paragraphs = contentDiv.find('p').slice(0, 3);
  paragraphs.each((i, p) => {
    const text = $(p).text().trim();
    if (text.length > 50 && !text.includes('Coordinates:') && !text.includes('disambiguation')) {
      synopsis += text + ' ';
    }
  });
  
  if (synopsis.length > 100) {
    details.synopsis = synopsis.trim().substring(0, 800) + (synopsis.length > 800 ? '...' : '');
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