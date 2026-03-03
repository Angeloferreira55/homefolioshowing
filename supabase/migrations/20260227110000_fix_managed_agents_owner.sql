-- Fix managed_agents owner_id to point to contact@home-folio.net account
-- The agents were created under angelo@houseforsaleabq.com (50f86124...)
-- but the admin/assistant account is contact@home-folio.net (35d3e1d1...)
UPDATE public.managed_agents
SET owner_id = '35d3e1d1-c5bc-4f3d-98a2-51f38c7d9c8c'
WHERE owner_id = '50f86124-8525-407e-8a9e-fc3d335215fa';
