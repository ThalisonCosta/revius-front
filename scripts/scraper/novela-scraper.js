#!/usr/bin/env node

import { chromium } from 'playwright';
import { NovelParser, parseNovelDetailsPage } from './data-parser.js';
import { FileUtils } from './file-utils.js';
import { getAllSources } from './wikipedia-sources.js';
import { CONFIG } from './config.js';

/**
 * Main Novela Scraper class
 */
class NovelaScraper {
  constructor() {
    this.parser = new NovelParser();
    this.fileUtils = new FileUtils();
    this.browser = null;
    this.context = null;
    this.page = null;
    this.stats = {
      sourcesProcessed: 0,
      novelasFound: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  /**
   * Initialize browser
   */
  async initBrowser() {
    console.log('🚀 Initializing browser...');
    
    try {
      this.browser = await chromium.launch(CONFIG.BROWSER_OPTIONS);
      
      // Create context with user agent to avoid bot detection
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo'
      });
      
      this.page = await this.context.newPage();
      
      console.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error.message);
      return false;
    }
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        console.log('🔄 Browser closed');
      }
    } catch (error) {
      console.error('⚠️ Error closing browser:', error.message);
    }
  }

  /**
   * Fetch page content with retry logic
   */
  async fetchPage(url, retries = CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🌐 Fetching: ${url} (attempt ${attempt}/${retries})`);
        
        await this.page.goto(url, { 
          waitUntil: 'networkidle', 
          timeout: CONFIG.TIMEOUT 
        });
        
        // Wait for content to load
        await this.page.waitForSelector('body', { timeout: 5000 });
        
        const content = await this.page.content();
        
        if (content && content.length > 1000) {
          console.log('✅ Page loaded successfully');
          return content;
        } else {
          throw new Error('Page content too short or empty');
        }
        
      } catch (error) {
        console.log(`⚠️  Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === retries) {
          console.error(`❌ Failed to fetch ${url} after ${retries} attempts`);
          this.stats.errors++;
          return null;
        }
        
        // Wait before retrying
        await this.sleep(CONFIG.DELAY_BETWEEN_REQUESTS * attempt);
      }
    }
    
    return null;
  }

  /**
   * Process a single Wikipedia source
   */
  async processSource(source) {
    console.log(`\n📖 Processing: ${source.broadcaster} (${source.country})`);
    console.log(`🔗 URL: ${source.url}`);
    
    const html = await this.fetchPage(source.url);
    if (!html) {
      return [];
    }
    
    try {
      const novelas = this.parser.parseListPage(html, source);
      
      if (novelas.length > 0) {
        console.log(`✨ Found ${novelas.length} novelas from ${source.broadcaster}`);
        this.stats.novelasFound += novelas.length;
        
        // Log sample titles for verification
        const sampleTitles = novelas.slice(0, 5).map(n => n.title);
        console.log(`📋 Sample titles: ${sampleTitles.join(', ')}${novelas.length > 5 ? '...' : ''}`);
      } else {
        console.log('⚠️  No novelas found on this page');
      }
      
      return novelas;
      
    } catch (error) {
      console.error(`❌ Error parsing ${source.url}:`, error.message);
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Enhanced details scraping for specific novelas
   */
  async enhanceNovelasWithDetails(novelas, maxToEnhance = CONFIG.DEFAULT_MAX_ENHANCE) {
    console.log(`\n🔍 Enhancing ${Math.min(maxToEnhance, novelas.length)} novelas with detailed information...`);
    
    let enhanced = 0;
    const toEnhance = novelas
      .filter(n => n.wikipediaUrl && n.wikipediaUrl.length > 0)
      .sort((a, b) => {
        // Prioritize newer novelas
        const yearA = a.year ? a.year.start : 1900;
        const yearB = b.year ? b.year.start : 1900;
        return yearB - yearA;
      })
      .slice(0, maxToEnhance);
    
    for (const novela of toEnhance) {
      try {
        console.log(`🔍 Enhancing: ${novela.title}`);
        
        const html = await this.fetchPage(novela.wikipediaUrl);
        if (html) {
          const details = await parseNovelDetailsPage(html);
          
          // Merge details with existing novela data, preserving existing data where appropriate
          Object.keys(details).forEach(key => {
            if (details[key]) {
              if (!novela[key] || 
                  (Array.isArray(novela[key]) && novela[key].length === 0) ||
                  (typeof novela[key] === 'string' && novela[key].trim() === '')) {
                novela[key] = details[key];
              } else if (key === 'genre' && Array.isArray(details[key]) && details[key].length > 0) {
                // Merge genres, keeping unique values
                const existingGenres = Array.isArray(novela[key]) ? novela[key] : [novela[key]];
                const newGenres = [...new Set([...existingGenres, ...details[key]])];
                novela[key] = newGenres.slice(0, 5); // Limit to 5 genres
              }
            }
          });
          
          // Add default image if no image found
          if (!novela.imageUrl || novela.imageUrl.trim() === '') {
            novela.imageUrl = this.getDefaultImage(novela.broadcaster);
          }
          
          enhanced++;
          console.log(`✨ Enhanced: ${novela.title} - Added ${Object.keys(details).length} fields`);
        }
        
        // Respect rate limiting
        await this.sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
        
      } catch (error) {
        console.error(`❌ Error enhancing ${novela.title}:`, error.message);
        this.stats.errors++;
        
        // Add default image even on error
        if (!novela.imageUrl || novela.imageUrl.trim() === '') {
          novela.imageUrl = this.getDefaultImage(novela.broadcaster);
        }
      }
    }
    
    console.log(`✅ Enhanced ${enhanced} novelas with additional details`);
    return novelas;
  }

  /**
   * Get default image for broadcaster
   */
  getDefaultImage(broadcaster) {
    return CONFIG.DEFAULT_IMAGES[broadcaster] || CONFIG.DEFAULT_IMAGES['default'];
  }

  /**
   * Run the complete scraping process
   */
  async scrape(options = {}) {
    const startTime = new Date();
    console.log('🎬 Starting Novela Scraper');
    console.log('='.repeat(50));
    
    try {
      // Initialize browser
      const browserReady = await this.initBrowser();
      if (!browserReady) {
        throw new Error('Failed to initialize browser');
      }
      
      // Create backup of existing data
      console.log('💾 Creating backup of existing data...');
      this.fileUtils.createBackup();
      
      // Get all sources to scrape
      const sources = getAllSources();
      console.log(`📚 Found ${sources.length} Wikipedia sources to scrape`);
      
      // Filter sources if specific countries requested
      let sourcesToProcess = sources;
      if (options.countries && options.countries.length > 0) {
        sourcesToProcess = sources.filter(s => 
          options.countries.some(country => 
            s.country.toLowerCase().includes(country.toLowerCase())
          )
        );
        console.log(`🎯 Filtered to ${sourcesToProcess.length} sources for: ${options.countries.join(', ')}`);
      }
      
      // Process all sources
      const allNovelas = [];
      
      for (const source of sourcesToProcess) {
        const novelas = await this.processSource(source);
        allNovelas.push(...novelas);
        
        this.stats.sourcesProcessed++;
        
        // Respect rate limiting between sources
        await this.sleep(CONFIG.DELAY_BETWEEN_REQUESTS);
        
        // Progress update
        const progress = Math.round((this.stats.sourcesProcessed / sourcesToProcess.length) * 100);
        console.log(`📊 Progress: ${progress}% (${this.stats.sourcesProcessed}/${sourcesToProcess.length} sources)`);
      }
      
      console.log(`\n🎉 Scraping completed! Found ${allNovelas.length} novelas total`);
      
      // Enhance with detailed information (limited to avoid overwhelming)
      if (options.enhanceDetails !== false && allNovelas.length > 0) {
        await this.enhanceNovelasWithDetails(allNovelas, options.maxToEnhance || CONFIG.DEFAULT_MAX_ENHANCE);
      }
      
      // Merge with existing data if requested
      let finalNovelas = allNovelas;
      if (options.mergeWithExisting !== false) {
        console.log('🔄 Merging with existing data...');
        finalNovelas = this.fileUtils.mergeWithExistingData(allNovelas);
      }
      
      // Save results
      console.log('💾 Saving results...');
      const saved = this.fileUtils.saveNovelas(finalNovelas);
      
      if (saved) {
        this.printResults(finalNovelas, startTime);
        return { success: true, data: finalNovelas };
      } else {
        throw new Error('Failed to save results');
      }
      
    } catch (error) {
      console.error('💥 Scraper failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      await this.closeBrowser();
    }
  }

  /**
   * Print final results summary
   */
  printResults(novelas, startTime) {
    const duration = Math.round((new Date() - startTime) / 1000);
    const countries = [...new Set(novelas.map(n => n.country))];
    const broadcasters = [...new Set(novelas.map(n => n.broadcaster))];
    
    console.log('\n' + '=' * 50);
    console.log('🎉 SCRAPING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📚 Total novelas: ${novelas.length}`);
    console.log(`🌍 Countries: ${countries.length} (${countries.join(', ')})`);
    console.log(`📺 Broadcasters: ${broadcasters.length}`);
    console.log(`🔗 Sources processed: ${this.stats.sourcesProcessed}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    
    // Top countries by count
    const countryCounts = {};
    novelas.forEach(n => {
      countryCounts[n.country] = (countryCounts[n.country] || 0) + 1;
    });
    
    const topCountries = Object.entries(countryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    console.log('\n📊 Top countries by novela count:');
    topCountries.forEach(([country, count]) => {
      console.log(`   ${country}: ${count} novelas`);
    });
    
    console.log(`\n📁 Data saved to: ${this.fileUtils.outputFile}`);
    console.log('='.repeat(50));
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  const options = {
    countries: [],
    enhanceDetails: true,
    mergeWithExisting: true,
    maxToEnhance: CONFIG.DEFAULT_MAX_ENHANCE
  };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--countries' && args[i + 1]) {
      options.countries = args[i + 1].split(',').map(c => c.trim());
      i++;
    } else if (arg === '--no-enhance') {
      options.enhanceDetails = false;
    } else if (arg === '--no-merge') {
      options.mergeWithExisting = false;
    } else if (arg === '--max-enhance' && args[i + 1]) {
      options.maxToEnhance = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--help') {
      console.log(`
Novela Scraper - Wikipedia Scraper for Telenovelas

Usage: node novela-scraper.js [options]

Options:
  --countries <list>    Comma-separated list of countries to scrape
  --no-enhance         Skip detailed information enhancement
  --no-merge           Don't merge with existing data
  --max-enhance <num>   Maximum number of novelas to enhance (default: 30)
  --help               Show this help message

Examples:
  node novela-scraper.js
  node novela-scraper.js --countries "Brasil,México"
  node novela-scraper.js --no-enhance --max-enhance 10
      `);
      process.exit(0);
    }
  }
  
  const scraper = new NovelaScraper();
  const result = await scraper.scrape(options);
  
  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default NovelaScraper;