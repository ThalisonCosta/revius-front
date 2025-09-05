import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ContentFilterSettings {
  blurAdultContent: boolean;
  hideAdultContent: boolean;
  showContentWarnings: boolean;
}

export function useContentFilter() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ContentFilterSettings>({
    blurAdultContent: true,
    hideAdultContent: false,
    showContentWarnings: true,
  });

  const isAdultContent = useCallback((content: any) => {
    // Check for adult/mature content indicators
    const adultGenres = ['hentai', 'ecchi', 'erotica', 'yaoi', 'yuri', 'adult', 'mature'];
    const matureRatings = ['R+', 'Rx', 'R17+', 'NC-17', 'X', 'R - 17+'];
    
    // Check explicit genres (for Jikan API) - this is the most reliable indicator
    if (content.explicit_genres && Array.isArray(content.explicit_genres) && content.explicit_genres.length > 0) {
      return true;
    }

    // Check genres
    if (content.genres && Array.isArray(content.genres)) {
      const hasAdultGenre = content.genres.some((genre: any) => {
        const genreName = (typeof genre === 'string' ? genre : genre.name || '').toLowerCase();
        return adultGenres.some(adultGenre => 
          genreName.includes(adultGenre)
        );
      });
      if (hasAdultGenre) return true;
    }

    // Check demographics for adult content
    if (content.demographics && Array.isArray(content.demographics)) {
      const hasAdultDemo = content.demographics.some((demo: any) => {
        const demoName = (typeof demo === 'string' ? demo : demo.name || '').toLowerCase();
        return demoName.includes('hentai') || demoName.includes('adult');
      });
      if (hasAdultDemo) return true;
    }

    // Check rating (common in anime/manga)
    if (content.rating && typeof content.rating === 'string') {
      const hasAdultRating = matureRatings.some(rating => 
        content.rating.includes(rating)
      );
      if (hasAdultRating) return true;
    }

    // Check for adult keywords in title
    const adultKeywords = ['hentai', 'ecchi', 'xxx', 'adult', 'mature', 'erotic', 'panchira'];
    if (content.title && typeof content.title === 'string') {
      const titleLower = content.title.toLowerCase();
      const hasAdultKeyword = adultKeywords.some(keyword => 
        titleLower.includes(keyword)
      );
      if (hasAdultKeyword) return true;
    }

    // Check themes for adult content (Jikan API specific)
    if (content.themes && Array.isArray(content.themes)) {
      const hasAdultTheme = content.themes.some((theme: any) => {
        const themeName = (typeof theme === 'string' ? theme : theme.name || '').toLowerCase();
        return adultGenres.some(adultGenre => 
          themeName.includes(adultGenre)
        );
      });
      if (hasAdultTheme) return true;
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

  const shouldBlurContent = useCallback((content: any) => {
    if (!isAdultContent(content)) return false;
    
    // Always blur for non-logged users
    if (!user) return true;
    
    // For logged users, respect their settings
    return settings.blurAdultContent;
  }, [user, settings.blurAdultContent, isAdultContent]);

  const shouldHideContent = useCallback((content: any) => {
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