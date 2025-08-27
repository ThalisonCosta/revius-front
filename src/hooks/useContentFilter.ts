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
    const adultGenres = ['hentai', 'ecchi', 'erotica', 'yaoi', 'yuri', 'adult'];
    const matureRatings = ['R+', 'Rx', 'R17+', 'NC-17', 'X'];
    
    // Check genres
    if (content.genres && Array.isArray(content.genres)) {
      const hasAdultGenre = content.genres.some((genre: any) => 
        adultGenres.some(adultGenre => 
          (typeof genre === 'string' ? genre : genre.name)
            .toLowerCase()
            .includes(adultGenre)
        )
      );
      if (hasAdultGenre) return true;
    }

    // Check explicit genres (for Jikan API)
    if (content.explicit_genres && Array.isArray(content.explicit_genres) && content.explicit_genres.length > 0) {
      return true;
    }

    // Check demographics for adult content
    if (content.demographics && Array.isArray(content.demographics)) {
      const hasAdultDemo = content.demographics.some((demo: any) => 
        (typeof demo === 'string' ? demo : demo.name)
          .toLowerCase()
          .includes('hentai')
      );
      if (hasAdultDemo) return true;
    }

    // Check rating
    if (content.rating && typeof content.rating === 'string') {
      const hasAdultRating = matureRatings.some(rating => 
        content.rating.includes(rating)
      );
      if (hasAdultRating) return true;
    }

    // Check for adult keywords in title
    const adultKeywords = ['hentai', 'ecchi', 'xxx', 'adult', 'mature'];
    if (content.title && typeof content.title === 'string') {
      const hasAdultKeyword = adultKeywords.some(keyword => 
        content.title.toLowerCase().includes(keyword)
      );
      if (hasAdultKeyword) return true;
    }

    return false;
  }, []);

  const shouldBlurContent = useCallback((content: any) => {
    if (!isAdultContent(content)) return false;
    if (!user && settings.blurAdultContent) return true;
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