-- Tambah kolom apar_expired_at ke tabel pangkalan
ALTER TABLE public.pangkalan
ADD COLUMN IF NOT EXISTS apar_expired_at DATE NULL;
