-- Add external_id column to user_list_items table for storing original API IDs
ALTER TABLE public.user_list_items
  ADD COLUMN IF NOT EXISTS external_id text;

-- Add comment for documentation
COMMENT ON COLUMN public.user_list_items.external_id IS 'ID original da mídia na API externa (TMDB ID, IMDB ID, MAL ID, etc.)';

-- Create index for better performance on queries by external_id
CREATE INDEX IF NOT EXISTS idx_user_list_items_external_id 
ON public.user_list_items(external_id);

-- Create composite index for external_id + api_source for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_list_items_external_api 
ON public.user_list_items(external_id, api_source);