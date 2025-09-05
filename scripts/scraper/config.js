/**
 * Configuration file for the novela scraper
 */

export const CONFIG = {
  // Output settings
  OUTPUT_DIR: './data',
  OUTPUT_FILE: 'novelas.json',
  BACKUP_FILE: 'novelas-backup.json',
  
  // Scraping settings
  DELAY_BETWEEN_REQUESTS: 2000, // 2 seconds
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
  
  // Browser settings for Playwright
  BROWSER_OPTIONS: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  
  // Data validation
  REQUIRED_FIELDS: ['title', 'country', 'wikipediaUrl'],
  
  // Logging
  LOG_LEVEL: 'info', // 'error', 'warn', 'info', 'debug'
  
  // Rate limiting
  CONCURRENT_REQUESTS: 3,
  
  // Enhancement settings
  DEFAULT_MAX_ENHANCE: 100, // Increased from 30
  ENHANCEMENT_ENABLED: true,
  
  // Default images for broadcasters
  DEFAULT_IMAGES: {
    'Record': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Rede_Record_logo.svg/240px-Rede_Record_logo.svg.png',
    'Globo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Rede_Globo_logo.svg/240px-Rede_Globo_logo.svg.png',
    'Band': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Rede_Bandeirantes_logo.svg/240px-Rede_Bandeirantes_logo.svg.png',
    'SBT': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/SBT_logo.svg/240px-SBT_logo.svg.png',
    'default': 'https://via.placeholder.com/300x400/cccccc/666666?text=Novela'
  },
  
  // Countries to scrape
  TARGET_COUNTRIES: [
    'Brasil',
    'México', 
    'Coreia do Sul',
    'Colômbia',
    'Argentina',
    'Venezuela',
    'Chile',
    'Peru',
    'Espanha',
    'Portugal',
    'Turquia',
    'Índia'
  ]
};