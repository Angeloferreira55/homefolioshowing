-- Fix rating constraint to allow 1-10 scale (matching the UI slider)
ALTER TABLE public.property_ratings DROP CONSTRAINT property_ratings_rating_check;
ALTER TABLE public.property_ratings ADD CONSTRAINT property_ratings_rating_check CHECK (rating >= 1 AND rating <= 10);