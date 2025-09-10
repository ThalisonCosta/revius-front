-- Ensure API source columns exist in user_list_items table
ALTER TABLE public.user_list_items
  ADD COLUMN IF NOT EXISTS external_poster_url text,
  ADD COLUMN IF NOT EXISTS external_rating numeric,
  ADD COLUMN IF NOT EXISTS external_synopsis text,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS api_source text;

-- Add comments for documentation
COMMENT ON COLUMN public.user_list_items.external_poster_url IS 'URL do poster obtido da API externa';
COMMENT ON COLUMN public.user_list_items.external_rating IS 'Avaliação obtida da API externa';
COMMENT ON COLUMN public.user_list_items.external_synopsis IS 'Sinopse obtida da API externa';
COMMENT ON COLUMN public.user_list_items.external_url IS 'URL externa para mais detalhes da mídia';
COMMENT ON COLUMN public.user_list_items.api_source IS 'Fonte da API (tmdb, omdb, jikan, local_novelas, manual)';

-- Create index for better performance on queries by API source
CREATE INDEX IF NOT EXISTS idx_user_list_items_api_source 
ON public.user_list_items(api_source);

-- Update existing records to have api_source as 'manual' where not specified
UPDATE public.user_list_items 
SET api_source = 'manual' 
WHERE api_source IS NULL;