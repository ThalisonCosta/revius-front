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