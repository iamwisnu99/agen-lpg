-- Migration for Kop Surat preferences

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS kop_nama_perusahaan TEXT DEFAULT 'NAMA PERUSAHAAN AGEN LPG',
ADD COLUMN IF NOT EXISTS kop_alamat TEXT DEFAULT 'Jl. Raya Pertamina No. 123, Jakarta Selatan',
ADD COLUMN IF NOT EXISTS kop_kontak TEXT DEFAULT 'Telp: (021) 1234567 | Email: kontak@perusahaan.com',
ADD COLUMN IF NOT EXISTS kop_logo_base64 TEXT;
