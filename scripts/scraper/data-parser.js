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
        wikipediaUrl = 'https://pt.wikipedia.org' + href;
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
      ? 'https://pt.wikipedia.org' + href 
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
 * Extract additional information from individual novela pages
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
    imageUrl: ''
  };
  
  // Extract cast from infobox
  const castRow = infobox.find('tr').filter((i, el) => {
    const text = $(el).find('th, td').first().text().toLowerCase();
    return text.includes('elenco') || text.includes('protagonistas') || text.includes('cast');
  });
  
  if (castRow.length > 0) {
    const castText = castRow.find('td').text();
    details.cast = castText.split(/[,\n]/)
      .map(name => name.trim())
      .filter(name => name.length > 0)
      .slice(0, 10); // Limit to main cast
  }
  
  // Extract director
  const directorRow = infobox.find('tr').filter((i, el) => {
    const text = $(el).find('th, td').first().text().toLowerCase();
    return text.includes('direção') || text.includes('director') || text.includes('dirigida');
  });
  
  if (directorRow.length > 0) {
    details.director = directorRow.find('td').text().trim();
  }
  
  // Extract author/creator
  const authorRow = infobox.find('tr').filter((i, el) => {
    const text = $(el).find('th, td').first().text().toLowerCase();
    return text.includes('autor') || text.includes('criação') || text.includes('roteiro');
  });
  
  if (authorRow.length > 0) {
    details.author = authorRow.find('td').text().trim();
  }
  
  // Extract episodes count
  const episodesRow = infobox.find('tr').filter((i, el) => {
    const text = $(el).find('th, td').first().text().toLowerCase();
    return text.includes('episódios') || text.includes('capítulos') || text.includes('episodes');
  });
  
  if (episodesRow.length > 0) {
    const episodesText = episodesRow.find('td').text();
    const match = episodesText.match(/(\d+)/);
    if (match) {
      details.episodes = parseInt(match[1]);
    }
  }
  
  // Extract image
  const image = $('.infobox img, .thumbinner img').first();
  if (image.length > 0) {
    const src = image.attr('src');
    if (src && src.startsWith('//')) {
      details.imageUrl = 'https:' + src;
    } else if (src && src.startsWith('/')) {
      details.imageUrl = 'https://upload.wikimedia.org' + src;
    }
  }
  
  // Extract synopsis from first paragraph
  const firstParagraph = $('#mw-content-text p').first();
  if (firstParagraph.length > 0) {
    details.synopsis = firstParagraph.text().trim().substring(0, 500);
  }
  
  return details;
}