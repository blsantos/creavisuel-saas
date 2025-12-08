-- Migration: Add Dolibarr ERP Integration
-- Date: 2025-12-08
-- Description: Add dolibarr_id column to tenants table for ERP synchronization

-- Add dolibarr_id column to store Dolibarr third party ID
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS dolibarr_id INTEGER NULL;

COMMENT ON COLUMN public.tenants.dolibarr_id IS 'ID du tiers (third party) dans Dolibarr ERP pour la synchronisation des factures';

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_dolibarr_id ON public.tenants(dolibarr_id) WHERE dolibarr_id IS NOT NULL;
