#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { NovelParser } from './data-parser.js';
import { FileUtils } from './file-utils.js';
import { getAllSources } from './wikipedia-sources.js';
import { CONFIG } from './config.js';

/**
 * Test utility for the novela scraper
 */
class ScraperTester {
  constructor() {
    this.parser = new NovelParser();
    this.fileUtils = new FileUtils();
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Run parsing tests without browser
   */
  async runParsingTests() {
    console.log('🧪 Running Parsing Tests');
    console.log('='.repeat(40));
    
    // Test 1: Parser initialization
    this.test('Parser Initialization', () => {
      return this.parser instanceof NovelParser;
    });

    // Test 2: Wikipedia sources loading
    this.test('Wikipedia Sources Loading', () => {
      const sources = getAllSources();
      return sources.length > 0 && sources[0].url && sources[0].country;
    });

    // Test 3: Config validation
    this.test('Config Validation', () => {
      return CONFIG.OUTPUT_DIR && CONFIG.OUTPUT_FILE && CONFIG.DELAY_BETWEEN_REQUESTS;
    });

    // Test 4: File utilities
    this.test('File Utils Initialization', () => {
      return this.fileUtils instanceof FileUtils;
    });

    // Test 5: Sample HTML parsing
    await this.testSampleHtmlParsing();

    // Test 6: ID generation
    this.test('ID Generation', () => {
      const id1 = this.parser.generateId('Terra e Paixão');
      const id2 = this.parser.generateId('Senhora do Destino');
      return id1 !== id2 && id1.includes('terra-e-paixao') && id2.includes('senhora-do-destino');
    });

    // Test 7: Data validation
    this.testDataValidation();

    this.printResults();
  }

  /**
   * Test sample HTML parsing
   */
  async testSampleHtmlParsing() {
    const sampleHtml = `
      <html>
        <body>
          <div id="mw-content-text">
            <table class="wikitable">
              <tr><th>Título</th><th>Ano</th><th>Emissora</th></tr>
              <tr>
                <td><a href="/wiki/Terra_e_Paixao">Terra e Paixão</a></td>
                <td>2023</td>
                <td>Rede Globo</td>
              </tr>
              <tr>
                <td><a href="/wiki/Senhora_do_Destino">Senhora do Destino</a></td>
                <td>2004-2005</td>
                <td>Rede Globo</td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    this.test('Sample HTML Parsing', () => {
      const sourceInfo = {
        country: 'Brasil',
        broadcaster: 'Rede Globo',
        url: 'https://pt.wikipedia.org/wiki/test'
      };

      const novelas = this.parser.parseListPage(sampleHtml, sourceInfo);
      
      return novelas.length >= 2 && 
             novelas[0].title.includes('Terra e Paixão') &&
             novelas[0].country === 'Brasil' &&
             novelas[0].broadcaster === 'Rede Globo';
    });
  }

  /**
   * Test data validation
   */
  testDataValidation() {
    const validNovela = {
      title: 'Terra e Paixão',
      country: 'Brasil',
      broadcaster: 'Rede Globo',
      year: { start: 2023, end: 2024 },
      wikipediaUrl: 'https://pt.wikipedia.org/wiki/Terra_e_Paixao'
    };

    const invalidNovela1 = {
      title: 'Lista de telenovelas',
      country: 'Brasil'
    };

    const invalidNovela2 = {
      title: 'ab',
      country: 'Brasil'
    };

    this.test('Valid Novela Validation', () => {
      return this.parser.isValidNovela(validNovela);
    });

    this.test('Invalid Novela Validation (List Page)', () => {
      return !this.parser.isValidNovela(invalidNovela1);
    });

    this.test('Invalid Novela Validation (Too Short)', () => {
      return !this.parser.isValidNovela(invalidNovela2);
    });
  }

  /**
   * Validate existing JSON file
   */
  async validateJsonFile() {
    console.log('📊 Validating JSON File');
    console.log('='.repeat(40));

    const jsonPath = path.join(CONFIG.OUTPUT_DIR, CONFIG.OUTPUT_FILE);
    
    if (!fs.existsSync(jsonPath)) {
      console.log('⚠️  No JSON file found to validate');
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      const errors = this.fileUtils.validateJsonStructure(data);
      
      if (errors.length === 0) {
        console.log('✅ JSON file is valid');
        console.log(`📚 Contains ${data.novelas?.length || 0} novelas`);
        console.log(`🌍 Countries: ${data.metadata?.countries?.length || 0}`);
        console.log(`📺 Broadcasters: ${data.metadata?.broadcasters?.length || 0}`);
      } else {
        console.log('❌ JSON file has validation errors:');
        errors.forEach(error => console.log(`   - ${error}`));
      }
      
    } catch (error) {
      console.log('❌ Failed to parse JSON file:', error.message);
    }
  }

  /**
   * Run full test suite
   */
  async runFullTests() {
    console.log('🚀 Running Full Test Suite');
    console.log('='.repeat(50));
    
    await this.runParsingTests();
    console.log('\n');
    await this.validateJsonFile();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Full Test Suite Completed');
    
    if (this.failed === 0) {
      console.log('✅ All tests passed!');
      process.exit(0);
    } else {
      console.log(`❌ ${this.failed} test(s) failed`);
      process.exit(1);
    }
  }

  /**
   * Test helper
   */
  test(name, testFn) {
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        this.passed++;
      } else {
        console.log(`❌ ${name}`);
        this.failed++;
      }
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      this.failed++;
    }
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n' + '='.repeat(40));
    console.log('📊 Test Results');
    console.log('='.repeat(40));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}`);
    
    if (this.failed === 0) {
      console.log('🎉 All parsing tests passed!');
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const tester = new ScraperTester();

  if (args.includes('--validate')) {
    await tester.validateJsonFile();
  } else if (args.includes('--full-test')) {
    await tester.runFullTests();
  } else {
    await tester.runParsingTests();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ScraperTester;