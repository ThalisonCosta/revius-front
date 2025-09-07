import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ContentFilterSettings {
  blurAdultContent: boolean;
  hideAdultContent: boolean;
  showContentWarnings: boolean;
}

interface ContentItem {
  mal_id?: number;
  title?: string;
  rating?: string;
  score?: number;
  members?: number;
  genres?: Array<{ name: string } | string>;
  themes?: Array<{ name: string } | string>;
  demographics?: Array<{ name: string } | string>;
  explicit_genres?: Array<{ name: string } | string>;
  source?: string;
}

export function useContentFilter() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ContentFilterSettings>({
    blurAdultContent: true,
    hideAdultContent: false,
    showContentWarnings: true,
  });

  const isAdultContent = useCallback((content: ContentItem) => {
    // Check for adult/mature content indicators
    const adultGenres = ['hentai', 'ecchi', 'erotica', 'yaoi', 'yuri', 'adult', 'mature', 'josei'];
    const matureRatings = ['R+', 'Rx', 'R17+', 'NC-17', 'X', 'R - 17+', 'Rx - Hentai'];
    
    // Check explicit genres (for Jikan API) - this is the most reliable indicator
    if (content.explicit_genres && Array.isArray(content.explicit_genres) && content.explicit_genres.length > 0) {
      return true;
    }

    // Check rating (improved detection for Jikan API format)
    if (content.rating && typeof content.rating === 'string') {
      const ratingLower = content.rating.toLowerCase();
      
      // Definitive adult ratings
      if (ratingLower.includes('rx') || 
          ratingLower.includes('hentai') ||
          ratingLower.includes('x rated')) {
        return true;
      }
      
      // R+ ratings are typically sexual content
      if (ratingLower.includes('r+') || ratingLower.includes('r - mild nudity')) {
        return true;
      }
      
      // R-17+ can be violence OR sexual content - check context
      if (ratingLower.includes('r - 17+')) {
        // If it's only violence/profanity and has high score/popularity, likely not adult content
        const isViolenceOnly = ratingLower.includes('violence') && !ratingLower.includes('nudity') && !ratingLower.includes('sexual');
        const hasHighScore = content.score && content.score > 8.0;
        const hasHighPopularity = content.members && content.members > 1000000;
        
        // Don't block mainstream violent content
        if (isViolenceOnly && hasHighScore && hasHighPopularity) {
          return false;
        }
        return true;
      }
    }

    // Consider score and popularity to avoid false positives for mainstream content
    const hasHighScore = content.score && content.score > 8.0;
    const hasHighPopularity = content.members && content.members > 1000000;
    const isMainstream = hasHighScore && hasHighPopularity;

    // Check genres (less aggressive for mainstream content)
    if (content.genres && Array.isArray(content.genres)) {
      const hasAdultGenre = content.genres.some((genre) => {
        const genreName = (typeof genre === 'string' ? genre : genre.name || '').toLowerCase();
        return adultGenres.some(adultGenre => 
          genreName.includes(adultGenre)
        );
      });
      // If it's mainstream content, be less strict about genre detection
      if (hasAdultGenre && !isMainstream) return true;
    }

    // Check demographics for adult content
    if (content.demographics && Array.isArray(content.demographics)) {
      const hasAdultDemo = content.demographics.some((demo) => {
        const demoName = (typeof demo === 'string' ? demo : demo.name || '').toLowerCase();
        return demoName.includes('hentai') || demoName.includes('adult');
      });
      if (hasAdultDemo) return true;
    }

    // Check for adult keywords in title (stricter for mainstream content)
    const adultKeywords = ['hentai', 'ecchi', 'xxx', 'adult', 'mature', 'erotic', 'panchira', 'oppai'];
    if (content.title && typeof content.title === 'string') {
      const titleLower = content.title.toLowerCase();
      const hasAdultKeyword = adultKeywords.some(keyword => 
        titleLower.includes(keyword)
      );
      if (hasAdultKeyword && !isMainstream) return true;
    }

    // Check themes for adult content (Jikan API specific)
    if (content.themes && Array.isArray(content.themes)) {
      const hasAdultTheme = content.themes.some((theme) => {
        const themeName = (typeof theme === 'string' ? theme : theme.name || '').toLowerCase();
        return adultGenres.some(adultGenre => 
          themeName.includes(adultGenre)
        );
      });
      if (hasAdultTheme && !isMainstream) return true;
    }

    // Check source material for adult indicators
    if (content.source && typeof content.source === 'string') {
      const sourceLower = content.source.toLowerCase();
      if (adultKeywords.some(keyword => sourceLower.includes(keyword))) {
        return true;
      }
    }

    return false;
  }, []);

  const shouldBlurContent = useCallback((content: ContentItem) => {
    if (!isAdultContent(content)) return false;
    
    // Always blur for non-logged users
    if (!user) return true;
    
    // For logged users, respect their settings
    return settings.blurAdultContent;
  }, [user, settings.blurAdultContent, isAdultContent]);

  const shouldHideContent = useCallback((content: ContentItem) => {
    if (!isAdultContent(content)) return false;
    return settings.hideAdultContent;
  }, [settings.hideAdultContent, isAdultContent]);

  const updateSettings = useCallback((newSettings: Partial<ContentFilterSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    updateSettings,
    isAdultContent,
    shouldBlurContent,
    shouldHideContent,
  };
}