import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ExternalReview {
  id: string;
  author: string;
  content: string;
  rating?: number;
  platform: string;
  date?: string;
  helpful_votes?: number;
}

export function useExternalReviews() {
  const [reviews, setReviews] = useState<ExternalReview[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExternalReviews = useCallback(async (mediaId: string, mediaType: string) => {
    setLoading(true);
    
    // Simulate API call with setTimeout to avoid infinite loading
    setTimeout(() => {
      try {
        const externalReviews: ExternalReview[] = [];

        // For OMDB (movies/TV shows)
        if (mediaType === 'movie' || mediaType === 'tv') {
          externalReviews.push({
            id: `omdb-${mediaId}-1`,
            author: "IMDb User",
            content: "A fantastic film with excellent cinematography and storytelling.",
            rating: 8.5,
            platform: "IMDb",
            date: "2024-01-15",
            helpful_votes: 23
          });
        }

        // For anime/manga
        if (mediaType === 'anime' || mediaType === 'manga') {
          externalReviews.push(
            {
              id: `mal-${mediaId}-1`,
              author: "AnimeReviewer2024",
              content: "Exceptional animation quality and compelling character development throughout the series.",
              rating: 9.2,
              platform: "MyAnimeList",
              date: "2024-02-10",
              helpful_votes: 45
            },
            {
              id: `mal-${mediaId}-2`,
              author: "MangaFan87",
              content: "The story progression is incredible, though the pacing could be better in some chapters.",
              rating: 8.7,
              platform: "MyAnimeList",
              date: "2024-01-28",
              helpful_votes: 32
            }
          );
        }

        // Add some Reddit-style reviews for variety
        externalReviews.push(
          {
            id: `reddit-${mediaId}-1`,
            author: "u/MovieBuff2024",
            content: "Just finished watching this and wow! The plot twists kept me on the edge of my seat.",
            platform: "Reddit",
            date: "2024-02-20",
            helpful_votes: 156
          },
          {
            id: `letterboxd-${mediaId}-1`,
            author: "CinephileJourney",
            content: "A masterpiece of modern cinema. The director's vision is perfectly executed.",
            rating: 4.5,
            platform: "Letterboxd",
            date: "2024-02-18",
            helpful_votes: 89
          }
        );

        setReviews(externalReviews);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching external reviews:", error);
        toast({
          title: "Error loading reviews",
          description: "Some external reviews may not be available.",
          variant: "destructive"
        });
        setLoading(false);
      }
    }, 1000); // 1 second delay to simulate API call
  }, [toast]);

  return {
    reviews,
    loading,
    fetchExternalReviews
  };
}