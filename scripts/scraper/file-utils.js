import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

/**
 * File utilities for managing JSON data output
 */
export class FileUtils {
  constructor() {
    this.outputDir = CONFIG.OUTPUT_DIR;
    this.outputFile = path.join(this.outputDir, CONFIG.OUTPUT_FILE);
    this.backupFile = path.join(this.outputDir, CONFIG.BACKUP_FILE);
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Create backup of existing data file
   */
  createBackup() {
    if (fs.existsSync(this.outputFile)) {
      try {
        const data = fs.readFileSync(this.outputFile, 'utf8');
        fs.writeFileSync(this.backupFile, data, 'utf8');
        console.log('✅ Backup created successfully');
        return true;
      } catch (error) {
        console.error('❌ Error creating backup:', error.message);
        return false;
      }
    }
    return true;
  }

  /**
   * Load existing data for updating
   */
  loadExistingData() {
    try {
      if (fs.existsSync(this.outputFile)) {
        const data = fs.readFileSync(this.outputFile, 'utf8');
        const parsed = JSON.parse(data);
        
        if (parsed && parsed.novelas && Array.isArray(parsed.novelas)) {
          console.log(`📚 Loaded ${parsed.novelas.length} existing novelas`);
          return parsed;
        }
      }
    } catch (error) {
      console.error('❌ Error loading existing data:', error.message);
    }
    
    // Return empty structure if no existing data
    return {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalNovelas: 0,
        countries: [],
        broadcasters: [],
        scrapedSources: []
      },
      novelas: []
    };
  }

  /**
   * Save novelas data to JSON file
   */
  saveNovelas(novelasData) {
    try {
      this.ensureOutputDir();
      
      // Generate metadata
      const metadata = this.generateMetadata(novelasData);
      
      const output = {
        metadata,
        novelas: novelasData
      };
      
      // Write to file with pretty formatting
      const jsonString = JSON.stringify(output, null, 2);
      fs.writeFileSync(this.outputFile, jsonString, 'utf8');
      
      console.log(`✅ Successfully saved ${novelasData.length} novelas to ${this.outputFile}`);
      console.log(`📊 Metadata: ${metadata.countries.length} countries, ${metadata.broadcasters.length} broadcasters`);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving data:', error.message);
      return false;
    }
  }

  /**
   * Generate metadata from novelas data
   */
  generateMetadata(novelasData) {
    const countries = new Set();
    const broadcasters = new Set();
    const genres = new Set();
    
    let totalEpisodes = 0;
    let oldestYear = 9999;
    let newestYear = 0;
    
    novelasData.forEach(novela => {
      if (novela.country) countries.add(novela.country);
      if (novela.broadcaster) broadcasters.add(novela.broadcaster);
      
      if (novela.genre && Array.isArray(novela.genre)) {
        novela.genre.forEach(g => genres.add(g));
      }
      
      if (novela.episodes && typeof novela.episodes === 'number') {
        totalEpisodes += novela.episodes;
      }
      
      if (novela.year && novela.year.start) {
        if (novela.year.start < oldestYear) oldestYear = novela.year.start;
        if (novela.year.start > newestYear) newestYear = novela.year.start;
      }
    });
    
    return {
      lastUpdated: new Date().toISOString(),
      totalNovelas: novelasData.length,
      countries: Array.from(countries).sort(),
      broadcasters: Array.from(broadcasters).sort(),
      genres: Array.from(genres).sort(),
      statistics: {
        totalEpisodes,
        averageEpisodes: novelasData.length > 0 ? Math.round(totalEpisodes / novelasData.length) : 0,
        yearRange: oldestYear < 9999 ? `${oldestYear}-${newestYear}` : 'Unknown',
        oldestYear: oldestYear < 9999 ? oldestYear : null,
        newestYear: newestYear > 0 ? newestYear : null
      },
      scrapedAt: new Date().toISOString()
    };
  }

  /**
   * Merge new data with existing data
   */
  mergeWithExistingData(newNovelas) {
    const existingData = this.loadExistingData();
    const existing = existingData.novelas || [];
    
    // Create a map of existing novelas by normalized title
    const existingMap = new Map();
    existing.forEach(novela => {
      const key = this.normalizeTitle(novela.title);
      existingMap.set(key, novela);
    });
    
    // Merge new novelas
    const merged = [...existing];
    let addedCount = 0;
    let updatedCount = 0;
    
    newNovelas.forEach(newNovela => {
      const key = this.normalizeTitle(newNovela.title);
      
      if (existingMap.has(key)) {
        // Update existing novela if new data is more complete
        const existingNovela = existingMap.get(key);
        const updated = this.mergeNovelData(existingNovela, newNovela);
        
        if (updated) {
          const index = merged.findIndex(n => this.normalizeTitle(n.title) === key);
          if (index >= 0) {
            merged[index] = { ...existingNovela, ...updated, updatedAt: new Date().toISOString() };
            updatedCount++;
          }
        }
      } else {
        // Add new novela
        merged.push({ ...newNovela, createdAt: new Date().toISOString() });
        addedCount++;
      }
    });
    
    console.log(`📊 Merge results: ${addedCount} added, ${updatedCount} updated, ${merged.length} total`);
    
    return merged;
  }

  /**
   * Normalize title for comparison
   */
  normalizeTitle(title) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Merge data from two novela objects
   */
  mergeNovelData(existing, newData) {
    const updates = {};
    let hasUpdates = false;
    
    // Update fields that are empty in existing but present in new
    const fieldsToUpdate = ['synopsis', 'cast', 'director', 'author', 'episodes', 'imageUrl', 'wikipediaUrl'];
    
    fieldsToUpdate.forEach(field => {
      if ((!existing[field] || 
          (Array.isArray(existing[field]) && existing[field].length === 0) ||
          (typeof existing[field] === 'string' && existing[field].trim() === '')) &&
          newData[field] &&
          ((Array.isArray(newData[field]) && newData[field].length > 0) ||
           (typeof newData[field] === 'string' && newData[field].trim() !== '') ||
           (typeof newData[field] === 'number' && newData[field] > 0))) {
        updates[field] = newData[field];
        hasUpdates = true;
      }
    });
    
    // Always update genre if new has more genres
    if (newData.genre && Array.isArray(newData.genre) && newData.genre.length > 0) {
      const existingGenres = existing.genre || [];
      const combinedGenres = [...new Set([...existingGenres, ...newData.genre])];
      if (combinedGenres.length > existingGenres.length) {
        updates.genre = combinedGenres;
        hasUpdates = true;
      }
    }
    
    return hasUpdates ? updates : null;
  }

  /**
   * Validate JSON structure
   */
  validateJsonStructure(data) {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return errors;
    }
    
    if (!data.metadata) {
      errors.push('Missing metadata object');
    }
    
    if (!data.novelas || !Array.isArray(data.novelas)) {
      errors.push('Missing or invalid novelas array');
      return errors;
    }
    
    // Validate each novela
    data.novelas.forEach((novela, index) => {
      if (!novela.title) {
        errors.push(`Novela at index ${index} missing title`);
      }
      
      if (!novela.country) {
        errors.push(`Novela "${novela.title}" missing country`);
      }
      
      if (!novela.id) {
        errors.push(`Novela "${novela.title}" missing id`);
      }
    });
    
    return errors;
  }

  /**
   * Get file statistics
   */
  getFileStats() {
    const stats = {
      exists: fs.existsSync(this.outputFile),
      backupExists: fs.existsSync(this.backupFile),
      size: 0,
      lastModified: null
    };
    
    if (stats.exists) {
      const fileStats = fs.statSync(this.outputFile);
      stats.size = fileStats.size;
      stats.lastModified = fileStats.mtime;
    }
    
    return stats;
  }
}