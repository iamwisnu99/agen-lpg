-- Migration: Add strike_count and is_banned to agen_account
ALTER TABLE public.agen_account
ADD COLUMN strike_count INTEGER DEFAULT 0,
ADD COLUMN is_banned BOOLEAN DEFAULT false;
