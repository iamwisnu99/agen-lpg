-- Migration: 002_create_armada.sql

CREATE TABLE armada (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_plat TEXT NOT NULL UNIQUE,
    nama_sopir TEXT NOT NULL,
    jatuh_tempo_pajak_1_tahun DATE,
    jatuh_tempo_plat_5_tahun DATE,
    foto_kendaraan JSONB,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'perbaikan', 'nonaktif')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE armada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" 
    ON armada FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON armada FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
    ON armada FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" 
    ON armada FOR DELETE 
    TO authenticated 
    USING (true);

-- Trigger to update 'updated_at'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_armada_modtime
BEFORE UPDATE ON armada
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
