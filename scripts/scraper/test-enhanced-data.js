#!/usr/bin/env node

/**
 * Test script to showcase the enhanced novela data extraction
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testEnhancedData() {
  console.log('🧪 Testing Enhanced Novela Data');
  console.log('=' .repeat(50));

  try {
    // Load the novela data
    const dataPath = join(__dirname, '../../data/novelas.json');
    const data = JSON.parse(readFileSync(dataPath, 'utf8'));
    
    console.log(`📚 Total novelas: ${data.novelas.length}`);
    console.log(`🌍 Countries: ${data.metadata.countries.join(', ')}`);
    console.log(`📺 Broadcasters: ${data.metadata.broadcasters.join(', ')}`);
    console.log(`🎭 Genres available: ${data.metadata.genres.length}`);
    
    // Find novelas with enhanced data
    const enhanced = data.novelas.filter(n => 
      n.productionCompany || 
      n.originalNetwork || 
      (Array.isArray(n.genre) && n.genre.length > 1) ||
      (n.cast && n.cast.length > 0) ||
      (n.synopsis && n.synopsis.length > 100) ||
      n.updatedAt
    );
    
    console.log(`\n✨ Enhanced novelas: ${enhanced.length} (${Math.round(enhanced.length/data.novelas.length*100)}%)`);
    
    // Show sample enhanced novela
    if (enhanced.length > 0) {
      console.log('\n📋 Sample Enhanced Novela:');
      console.log('─'.repeat(30));
      const sample = enhanced[0];
      
      console.log(`📺 Title: ${sample.title}`);
      console.log(`🏢 Broadcaster: ${sample.broadcaster}`);
      if (sample.year) {
        console.log(`📅 Year: ${sample.year.start}${sample.year.end ? `-${sample.year.end}` : ''}`);
      }
      if (sample.genre && sample.genre.length > 0) {
        console.log(`🎭 Genres: ${sample.genre.join(', ')}`);
      }
      if (sample.cast && sample.cast.length > 0) {
        console.log(`🎬 Cast: ${sample.cast.slice(0, 3).join(', ')}${sample.cast.length > 3 ? '...' : ''}`);
      }
      if (sample.director) {
        console.log(`🎬 Director: ${sample.director}`);
      }
      if (sample.author) {
        console.log(`✍️  Author: ${sample.author}`);
      }
      if (sample.episodes) {
        console.log(`📺 Episodes: ${sample.episodes}`);
      }
      if (sample.productionCompany) {
        console.log(`🏭 Production: ${sample.productionCompany}`);
      }
      if (sample.imageUrl) {
        console.log(`🖼️  Image: ${sample.imageUrl.length > 50 ? sample.imageUrl.substring(0, 50) + '...' : sample.imageUrl}`);
      }
      if (sample.synopsis && sample.synopsis.length > 50) {
        console.log(`📖 Synopsis: ${sample.synopsis.substring(0, 100)}...`);
      }
    }
    
    // Show statistics
    console.log('\n📊 Enhancement Statistics:');
    console.log('─'.repeat(30));
    
    const withImages = data.novelas.filter(n => n.imageUrl && n.imageUrl !== '').length;
    const withCast = data.novelas.filter(n => n.cast && n.cast.length > 0).length;
    const withSynopsis = data.novelas.filter(n => n.synopsis && n.synopsis.length > 100).length;
    const withDirector = data.novelas.filter(n => n.director && n.director !== '').length;
    const withAuthor = data.novelas.filter(n => n.author && n.author !== '').length;
    const withMultipleGenres = data.novelas.filter(n => n.genre && n.genre.length > 1).length;
    
    console.log(`🖼️  Novelas with images: ${withImages} (${Math.round(withImages/data.novelas.length*100)}%)`);
    console.log(`🎬 Novelas with cast info: ${withCast} (${Math.round(withCast/data.novelas.length*100)}%)`);
    console.log(`📖 Novelas with detailed synopsis: ${withSynopsis} (${Math.round(withSynopsis/data.novelas.length*100)}%)`);
    console.log(`🎬 Novelas with director info: ${withDirector} (${Math.round(withDirector/data.novelas.length*100)}%)`);
    console.log(`✍️  Novelas with author info: ${withAuthor} (${Math.round(withAuthor/data.novelas.length*100)}%)`);
    console.log(`🎭 Novelas with multiple genres: ${withMultipleGenres} (${Math.round(withMultipleGenres/data.novelas.length*100)}%)`);
    
    console.log('\n✅ Enhanced data test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedData().catch(console.error);
}

export default testEnhancedData;