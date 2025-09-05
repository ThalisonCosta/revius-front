/**
 * Configuration file for the novela scraper
 */

export const CONFIG = {
  // Output settings
  OUTPUT_DIR: './data',
  OUTPUT_FILE: 'novelas.json',
  BACKUP_FILE: 'novelas-backup.json',
  
  // Enhanced scraping settings
  DELAY_BETWEEN_REQUESTS: 3000, // 3 seconds (increased for better reliability)
  MAX_RETRIES: 5, // More retries for better success rate
  TIMEOUT: 45000, // 45 seconds (increased for complex pages)
  ENHANCEMENT_TIMEOUT: 60000, // 1 minute for detail enhancement pages
  
  // Enhanced browser settings for Playwright
  BROWSER_OPTIONS: {
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-blink-features=AutomationControlled'
    ]
  },
  
  // Data validation
  REQUIRED_FIELDS: ['title', 'country', 'wikipediaUrl'],
  
  // Logging
  LOG_LEVEL: 'info', // 'error', 'warn', 'info', 'debug'
  
  // Enhanced rate limiting
  CONCURRENT_REQUESTS: 2, // Reduced for better stability
  ADAPTIVE_DELAY: true, // Enable adaptive delays based on response times
  
  // Enhanced enhancement settings
  DEFAULT_MAX_ENHANCE: 150, // Increased further for more complete data
  ENHANCEMENT_ENABLED: true,
  PRIORITY_ENHANCEMENT: true, // Prioritize newer and more popular novelas
  IMAGE_ENHANCEMENT_PRIORITY: 'high', // Focus on getting images
  
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