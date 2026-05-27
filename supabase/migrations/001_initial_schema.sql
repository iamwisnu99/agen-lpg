-- ============================================================
-- STEP 1: Jalankan file ini PERTAMA di Supabase SQL Editor
-- Sistem Manajemen Pangkalan LPG - PT. CAHAYA WANODYA SEJATI
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE status_pangkalan AS ENUM ('aktif', 'nonaktif');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE jenis_foto AS ENUM ('gas_detector', 'apar', 'bak_tes_kebocoran', 'timbangan', 'papan_pangkalan');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE jenis_aksi AS ENUM ('tambah', 'edit', 'hapus', 'aktifkan', 'nonaktifkan', 'upload_foto', 'hapus_foto', 'login', 'logout');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE: profiles (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: wilayah (master data wilayah)
-- ============================================================
CREATE TABLE IF NOT EXISTS wilayah (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provinsi TEXT NOT NULL,
  kota TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  kelurahan TEXT NOT NULL,
  kode_pos TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: pangkalan (data utama pangkalan LPG)
-- ============================================================
CREATE TABLE IF NOT EXISTS pangkalan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_pangkalan TEXT NOT NULL,
  nama_pemilik TEXT NOT NULL,
  id_registrasi TEXT UNIQUE NOT NULL,
  nomor_hp TEXT NOT NULL,
  alamat TEXT NOT NULL,
  kecamatan TEXT NOT NULL,
  kelurahan TEXT NOT NULL,
  kota TEXT NOT NULL,
  provinsi TEXT NOT NULL,
  latitude FLOAT8,
  longitude FLOAT8,
  link_maps TEXT,
  status status_pangkalan NOT NULL DEFAULT 'aktif',
  catatan_admin TEXT,
  foto_lengkap BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: foto_pangkalan
-- ============================================================
CREATE TABLE IF NOT EXISTS foto_pangkalan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pangkalan_id UUID NOT NULL REFERENCES pangkalan(id) ON DELETE CASCADE,
  jenis_foto jenis_foto NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pangkalan_id, jenis_foto)
);

-- ============================================================
-- TABLE: log_aktivitas
-- ============================================================
CREATE TABLE IF NOT EXISTS log_aktivitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT,
  aksi jenis_aksi NOT NULL,
  entitas TEXT NOT NULL,
  entitas_id UUID,
  entitas_nama TEXT,
  data_lama JSONB,
  data_baru JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pangkalan_updated_at ON pangkalan;
CREATE TRIGGER update_pangkalan_updated_at
  BEFORE UPDATE ON pangkalan
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auto update foto_lengkap
CREATE OR REPLACE FUNCTION update_foto_lengkap()
RETURNS TRIGGER AS $$
DECLARE
  total_jenis INTEGER := 5;
  foto_count INTEGER;
  pang_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    pang_id := OLD.pangkalan_id;
  ELSE
    pang_id := NEW.pangkalan_id;
  END IF;
  
  SELECT COUNT(DISTINCT jenis_foto) INTO foto_count
  FROM foto_pangkalan
  WHERE pangkalan_id = pang_id;
  
  UPDATE pangkalan
  SET foto_lengkap = (foto_count >= total_jenis)
  WHERE id = pang_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_foto_lengkap_on_insert ON foto_pangkalan;
CREATE TRIGGER update_foto_lengkap_on_insert
  AFTER INSERT OR UPDATE OR DELETE ON foto_pangkalan
  FOR EACH ROW EXECUTE PROCEDURE update_foto_lengkap();

-- Auto create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pangkalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE foto_pangkalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_aktivitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayah ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view pangkalan" ON pangkalan;
DROP POLICY IF EXISTS "Authenticated users can insert pangkalan" ON pangkalan;
DROP POLICY IF EXISTS "Authenticated users can update pangkalan" ON pangkalan;
DROP POLICY IF EXISTS "Authenticated users can delete pangkalan" ON pangkalan;
DROP POLICY IF EXISTS "Authenticated users can view foto" ON foto_pangkalan;
DROP POLICY IF EXISTS "Authenticated users can insert foto" ON foto_pangkalan;
DROP POLICY IF EXISTS "Authenticated users can delete foto" ON foto_pangkalan;
DROP POLICY IF EXISTS "Authenticated users can view logs" ON log_aktivitas;
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON log_aktivitas;
DROP POLICY IF EXISTS "Anyone can view wilayah" ON wilayah;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Pangkalan policies
CREATE POLICY "Authenticated users can view pangkalan" ON pangkalan FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert pangkalan" ON pangkalan FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update pangkalan" ON pangkalan FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete pangkalan" ON pangkalan FOR DELETE USING (auth.role() = 'authenticated');

-- Foto policies
CREATE POLICY "Authenticated users can view foto" ON foto_pangkalan FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert foto" ON foto_pangkalan FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete foto" ON foto_pangkalan FOR DELETE USING (auth.role() = 'authenticated');

-- Log policies
CREATE POLICY "Authenticated users can view logs" ON log_aktivitas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert logs" ON log_aktivitas FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Wilayah policies
CREATE POLICY "Anyone can view wilayah" ON wilayah FOR SELECT USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pangkalan_status ON pangkalan(status);
CREATE INDEX IF NOT EXISTS idx_pangkalan_kota ON pangkalan(kota);
CREATE INDEX IF NOT EXISTS idx_pangkalan_kecamatan ON pangkalan(kecamatan);
CREATE INDEX IF NOT EXISTS idx_pangkalan_foto_lengkap ON pangkalan(foto_lengkap);
CREATE INDEX IF NOT EXISTS idx_pangkalan_created_at ON pangkalan(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_foto_pangkalan_id ON foto_pangkalan(pangkalan_id);
CREATE INDEX IF NOT EXISTS idx_log_user_id ON log_aktivitas(user_id);
CREATE INDEX IF NOT EXISTS idx_log_created_at ON log_aktivitas(created_at DESC);

-- ============================================================
-- DATA WILAYAH JAKARTA BARAT
-- ============================================================
INSERT INTO wilayah (provinsi, kota, kecamatan, kelurahan) VALUES
('DKI Jakarta', 'Jakarta Barat', 'Cengkareng', 'Cengkareng Barat'),
('DKI Jakarta', 'Jakarta Barat', 'Cengkareng', 'Cengkareng Timur'),
('DKI Jakarta', 'Jakarta Barat', 'Cengkareng', 'Duri Kosambi'),
('DKI Jakarta', 'Jakarta Barat', 'Cengkareng', 'Kapuk'),
('DKI Jakarta', 'Jakarta Barat', 'Cengkareng', 'Kedaung Kali Angke'),
('DKI Jakarta', 'Jakarta Barat', 'Cengkareng', 'Rawa Buaya'),
('DKI Jakarta', 'Jakarta Barat', 'Grogol Petamburan', 'Grogol'),
('DKI Jakarta', 'Jakarta Barat', 'Grogol Petamburan', 'Jelambar'),
('DKI Jakarta', 'Jakarta Barat', 'Grogol Petamburan', 'Jelambar Baru'),
('DKI Jakarta', 'Jakarta Barat', 'Grogol Petamburan', 'Tanjung Duren Selatan'),
('DKI Jakarta', 'Jakarta Barat', 'Grogol Petamburan', 'Tanjung Duren Utara'),
('DKI Jakarta', 'Jakarta Barat', 'Grogol Petamburan', 'Tomang'),
('DKI Jakarta', 'Jakarta Barat', 'Grogol Petamburan', 'Wijaya Kusuma'),
('DKI Jakarta', 'Jakarta Barat', 'Kalideres', 'Kalideres'),
('DKI Jakarta', 'Jakarta Barat', 'Kalideres', 'Pegadungan'),
('DKI Jakarta', 'Jakarta Barat', 'Kalideres', 'Semanan'),
('DKI Jakarta', 'Jakarta Barat', 'Kalideres', 'Tegal Alur'),
('DKI Jakarta', 'Jakarta Barat', 'Kalideres', 'Kamal'),
('DKI Jakarta', 'Jakarta Barat', 'Kebon Jeruk', 'Duri Kepa'),
('DKI Jakarta', 'Jakarta Barat', 'Kebon Jeruk', 'Kebon Jeruk'),
('DKI Jakarta', 'Jakarta Barat', 'Kebon Jeruk', 'Kedoya Selatan'),
('DKI Jakarta', 'Jakarta Barat', 'Kebon Jeruk', 'Kedoya Utara'),
('DKI Jakarta', 'Jakarta Barat', 'Kebon Jeruk', 'Kelapa Dua'),
('DKI Jakarta', 'Jakarta Barat', 'Kebon Jeruk', 'Sukabumi Selatan'),
('DKI Jakarta', 'Jakarta Barat', 'Kebon Jeruk', 'Sukabumi Utara'),
('DKI Jakarta', 'Jakarta Barat', 'Kembangan', 'Joglo'),
('DKI Jakarta', 'Jakarta Barat', 'Kembangan', 'Kembangan Selatan'),
('DKI Jakarta', 'Jakarta Barat', 'Kembangan', 'Kembangan Utara'),
('DKI Jakarta', 'Jakarta Barat', 'Kembangan', 'Meruya Selatan'),
('DKI Jakarta', 'Jakarta Barat', 'Kembangan', 'Meruya Utara'),
('DKI Jakarta', 'Jakarta Barat', 'Kembangan', 'Srengseng'),
('DKI Jakarta', 'Jakarta Barat', 'Palmerah', 'Jati Pulo'),
('DKI Jakarta', 'Jakarta Barat', 'Palmerah', 'Kemanggisan'),
('DKI Jakarta', 'Jakarta Barat', 'Palmerah', 'Kota Bambu Selatan'),
('DKI Jakarta', 'Jakarta Barat', 'Palmerah', 'Kota Bambu Utara'),
('DKI Jakarta', 'Jakarta Barat', 'Palmerah', 'Palmerah'),
('DKI Jakarta', 'Jakarta Barat', 'Palmerah', 'Slipi'),
('DKI Jakarta', 'Jakarta Barat', 'Taman Sari', 'Glodok'),
('DKI Jakarta', 'Jakarta Barat', 'Taman Sari', 'Keagungan'),
('DKI Jakarta', 'Jakarta Barat', 'Taman Sari', 'Krukut'),
('DKI Jakarta', 'Jakarta Barat', 'Taman Sari', 'Mangga Besar'),
('DKI Jakarta', 'Jakarta Barat', 'Taman Sari', 'Maphar'),
('DKI Jakarta', 'Jakarta Barat', 'Taman Sari', 'Pinangsia'),
('DKI Jakarta', 'Jakarta Barat', 'Taman Sari', 'Taman Sari'),
('DKI Jakarta', 'Jakarta Barat', 'Taman Sari', 'Tangki'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Angke'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Duri Selatan'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Duri Utara'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Jembatan Besi'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Jembatan Lima'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Kali Anyar'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Pekojan'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Roa Malaka'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Tambora'),
('DKI Jakarta', 'Jakarta Barat', 'Tambora', 'Tanah Sereal')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('foto-pangkalan', 'foto-pangkalan', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (DROP dulu supaya tidak error jika sudah ada)
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;

CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'foto-pangkalan');

CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'foto-pangkalan');

CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'foto-pangkalan');

CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'foto-pangkalan');

-- ============================================================
-- SELESAI! Sekarang buat user di Authentication > Users
-- ============================================================
SELECT 'Migration berhasil! Silakan buat user admin di Authentication > Users' AS status;
