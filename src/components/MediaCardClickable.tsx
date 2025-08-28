import { MediaCard } from "@/components/MediaCard";

interface MediaCardClickableProps {
  id: string;
  title: string;
  poster: string;
  year: number;
  rating?: number;
  type: "movie" | "game" | "anime" | "tv" | "manga";
  synopsis?: string;
  onMediaClick?: () => void;
}

export function MediaCardClickable({
  id,
  title,
  poster,
  year,
  rating,
  type,
  synopsis,
  onMediaClick
}: MediaCardClickableProps) {
  const handleClick = () => {
    if (onMediaClick) {
      onMediaClick();
    } else {
      const url = `/media/${type}/${id}?title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&year=${year}${rating ? `&rating=${rating}` : ''}${synopsis ? `&synopsis=${encodeURIComponent(synopsis)}` : ''}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="cursor-pointer" onClick={handleClick}>
      <MediaCard
        id={id}
        title={title}
        poster={poster}
        year={year}
        rating={rating}
        type={type}
        synopsis={synopsis}
      />
    </div>
  );
}