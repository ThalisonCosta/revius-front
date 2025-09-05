#!/usr/bin/env node

import { chromium } from 'playwright';
import { parseNovelDetailsPage } from './data-parser.js';
import { CONFIG } from './config.js';

/**
 * Test scraper specifically for validating image extraction
 */
class TestImageScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initBrowser() {
    console.log('🚀 Initializing test browser...');
    
    this.browser = await chromium.launch(CONFIG.BROWSER_OPTIONS);
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo'
    });
    
    this.page = await this.context.newPage();
    console.log('✅ Test browser initialized');
  }

  async closeBrowser() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    console.log('🔄 Test browser closed');
  }

  async testImageExtraction() {
    console.log('\n🧪 Testing Image Extraction');
    console.log('='.repeat(50));

    // Test URLs with known images
    const testUrls = [
      {
        url: 'https://pt.wikipedia.org/wiki/Terra_e_Paixão',
        title: 'Terra e Paixão',
        expected: 'Should find main poster image'
      },
      {
        url: 'https://pt.wikipedia.org/wiki/Travessia_(telenovela)',
        title: 'Travessia',
        expected: 'Should find infobox image'
      },
      {
        url: 'https://pt.wikipedia.org/wiki/Pantanal_(telenovela_de_2022)',
        title: 'Pantanal (2022)',
        expected: 'Should find remake poster'
      },
      {
        url: 'https://pt.wikipedia.org/wiki/Um_Lugar_ao_Sol',
        title: 'Um Lugar ao Sol',
        expected: 'Should find promotional image'
      },
      {
        url: 'https://pt.wikipedia.org/wiki/Nos_Tempos_do_Imperador',
        title: 'Nos Tempos do Imperador',
        expected: 'Should find period drama poster'
      }
    ];

    let successCount = 0;
    let totalTests = testUrls.length;

    for (const testCase of testUrls) {
      console.log(`\n🔍 Testing: ${testCase.title}`);
      console.log(`🌐 URL: ${testCase.url}`);
      console.log(`📋 Expected: ${testCase.expected}`);
      
      try {
        // Fetch the page
        await this.page.goto(testCase.url, { 
          waitUntil: 'networkidle', 
          timeout: CONFIG.TIMEOUT 
        });
        
        const html = await this.page.content();
        
        // Parse the page for images
        const details = await parseNovelDetailsPage(html);
        
        if (details.imageUrl && details.imageUrl.trim() !== '') {
          console.log(`✅ SUCCESS: Found image for ${testCase.title}`);
          console.log(`🖼️  Image URL: ${details.imageUrl}`);
          successCount++;
          
          // Additional validation
          if (details.imageUrl.includes('upload.wikimedia.org')) {
            console.log(`📝 ✓ Valid Wikimedia URL`);
          }
          
          if (details.imageUrl.includes('.jpg') || details.imageUrl.includes('.png')) {
            console.log(`📝 ✓ Valid image format`);
          }
          
        } else {
          console.log(`❌ FAILED: No image found for ${testCase.title}`);
          
          // Debug: Check what other details were extracted
          console.log(`📊 Other extracted data:`);
          console.log(`   - Cast: ${details.cast ? details.cast.length : 0} members`);
          console.log(`   - Director: ${details.director || 'Not found'}`);
          console.log(`   - Synopsis: ${details.synopsis ? 'Found' : 'Not found'}`);
        }
        
      } catch (error) {
        console.error(`💥 ERROR testing ${testCase.title}: ${error.message}`);
      }
      
      // Wait between requests
      await this.sleep(2000);
    }

    console.log('\n📊 TEST RESULTS');
    console.log('='.repeat(30));
    console.log(`✅ Successful extractions: ${successCount}/${totalTests}`);
    console.log(`📈 Success rate: ${Math.round((successCount/totalTests) * 100)}%`);
    
    if (successCount === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Image extraction is working correctly.');
    } else if (successCount > totalTests * 0.7) {
      console.log('⚠️  Most tests passed, but some improvements may be needed.');
    } else {
      console.log('❌ Many tests failed. Image extraction needs significant improvement.');
    }

    return { successCount, totalTests, successRate: (successCount/totalTests) * 100 };
  }

  async validateExistingData() {
    console.log('\n🔍 Validating existing novela data...');
    
    try {
      const fs = await import('fs/promises');
      const data = JSON.parse(await fs.readFile('./data/novelas.json', 'utf-8'));
      
      const withImages = data.filter(n => n.imageUrl && !n.imageUrl.includes('placeholder'));
      const withoutImages = data.filter(n => !n.imageUrl || n.imageUrl.includes('placeholder'));
      
      console.log(`📊 Data Analysis:`);
      console.log(`   Total novelas: ${data.length}`);
      console.log(`   With images: ${withImages.length} (${Math.round((withImages.length/data.length) * 100)}%)`);
      console.log(`   Without images: ${withoutImages.length} (${Math.round((withoutImages.length/data.length) * 100)}%)`);
      
      if (withoutImages.length > 0) {
        console.log(`\n📋 Sample novelas without images:`);
        withoutImages.slice(0, 10).forEach((novela, index) => {
          console.log(`   ${index + 1}. ${novela.title} (${novela.broadcaster})`);
        });
      }
      
    } catch (error) {
      console.log(`⚠️  Could not validate existing data: ${error.message}`);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runFullTest() {
    try {
      await this.initBrowser();
      
      const results = await this.testImageExtraction();
      await this.validateExistingData();
      
      return results;
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      return { successCount: 0, totalTests: 0, successRate: 0 };
    } finally {
      await this.closeBrowser();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const testScraper = new TestImageScraper();
  
  if (args.includes('--validate')) {
    // Just validate existing data
    await testScraper.validateExistingData();
  } else if (args.includes('--full-test')) {
    // Run full test suite
    const results = await testScraper.runFullTest();
    process.exit(results.successRate >= 70 ? 0 : 1);
  } else {
    // Default: run image extraction tests
    await testScraper.initBrowser();
    try {
      await testScraper.testImageExtraction();
    } finally {
      await testScraper.closeBrowser();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default TestImageScraper;