#!/usr/bin/env node

import NovelaScraper from './novela-scraper.js';
import { WIKIPEDIA_SOURCES } from './wikipedia-sources.js';

/**
 * Test the scraper with a small subset of sources
 */
async function testScraper() {
  console.log('🧪 Testing Novela Scraper with sample sources');
  console.log('='.repeat(50));
  
  // Test with just Brazilian sources first
  const testSources = WIKIPEDIA_SOURCES.brasil.slice(0, 2); // Just first 2 sources
  
  console.log('📚 Test sources:');
  testSources.forEach((source, index) => {
    console.log(`${index + 1}. ${source.broadcaster} - ${source.url}`);
  });
  
  const scraper = new NovelaScraper();
  
  // Test with limited options
  const options = {
    countries: ['Brasil'],
    enhanceDetails: false, // Skip enhancement for faster testing
    mergeWithExisting: false, // Don't merge for clean test
    maxToEnhance: 0
  };
  
  console.log('\n🚀 Starting test scrape...');
  const result = await scraper.scrape(options);
  
  if (result.success) {
    console.log('\n✅ Test completed successfully!');
    console.log(`📊 Found ${result.data.length} novelas`);
    
    // Show sample data
    if (result.data.length > 0) {
      console.log('\n📋 Sample novelas:');
      result.data.slice(0, 5).forEach((novela, index) => {
        console.log(`${index + 1}. ${novela.title} (${novela.year?.start || 'Unknown year'}) - ${novela.broadcaster}`);
      });
      
      // Show data structure
      console.log('\n🔍 Sample data structure:');
      const sample = result.data[0];
      console.log(JSON.stringify(sample, null, 2));
    }
  } else {
    console.log('\n❌ Test failed:', result.error);
  }
  
  return result.success;
}

// Simpler validation test
async function testPageParsing() {
  console.log('\n🔬 Testing page parsing without browser...');
  
  try {
    const { NovelParser } = await import('./data-parser.js');
    const parser = new NovelParser();
    
    // Test with mock HTML structure
    const mockHtml = `
      <html>
        <body>
          <table class="wikitable">
            <tr><th>Título</th><th>Ano</th><th>Emissora</th></tr>
            <tr>
              <td><a href="/wiki/Novela_Teste">Novela Teste</a></td>
              <td>2023</td>
              <td>Rede Globo</td>
            </tr>
            <tr>
              <td><a href="/wiki/Outra_Novela">Outra Novela</a></td>
              <td>2022-2023</td>
              <td>SBT</td>
            </tr>
          </table>
        </body>
      </html>
    `;
    
    const sourceInfo = {
      broadcaster: 'Test Broadcaster',
      country: 'Brasil',
      url: 'https://test.com'
    };
    
    const novelas = parser.parseListPage(mockHtml, sourceInfo);
    
    console.log('✅ Parsing test successful!');
    console.log(`📊 Parsed ${novelas.length} novelas from mock HTML`);
    
    if (novelas.length > 0) {
      console.log('📋 Parsed novelas:');
      novelas.forEach((novela, index) => {
        console.log(`${index + 1}. ${novela.title} - ${JSON.stringify(novela.year)}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Parsing test failed:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--parsing-only')) {
    await testPageParsing();
  } else if (args.includes('--help')) {
    console.log(`
Test Scraper - Test the novela scraper functionality

Usage: node test-scraper.js [options]

Options:
  --parsing-only    Test only the HTML parsing logic (no browser)
  --help           Show this help message

Default: Run full scraper test with browser
    `);
  } else {
    // First test parsing
    console.log('🔬 Step 1: Testing parsing logic...');
    const parsingTest = await testPageParsing();
    
    if (parsingTest) {
      console.log('\n🚀 Step 2: Testing full scraper...');
      await testScraper();
    } else {
      console.log('\n❌ Skipping full test due to parsing failure');
      process.exit(1);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}