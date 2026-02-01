-- Add additional property details columns to session_properties
ALTER TABLE public.session_properties
ADD COLUMN IF NOT EXISTS year_built integer,
ADD COLUMN IF NOT EXISTS lot_size text,
ADD COLUMN IF NOT EXISTS property_type text,
ADD COLUMN IF NOT EXISTS hoa_fee numeric,
ADD COLUMN IF NOT EXISTS garage text,
ADD COLUMN IF NOT EXISTS heating text,
ADD COLUMN IF NOT EXISTS cooling text,
ADD COLUMN IF NOT EXISTS features text[];