-- 007_create_laporan_do.sql

-- Create laporan_do table
CREATE TABLE IF NOT EXISTS public.laporan_do (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spbe VARCHAR(50) NOT NULL, -- 'SADIKUN' or 'JAKPRO'
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'Draft' -- Draft, Submitted
);

-- Enable RLS for laporan_do
ALTER TABLE public.laporan_do ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own laporan_do" 
    ON public.laporan_do FOR SELECT 
    USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own laporan_do" 
    ON public.laporan_do FOR INSERT 
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own laporan_do" 
    ON public.laporan_do FOR UPDATE 
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own laporan_do" 
    ON public.laporan_do FOR DELETE 
    USING (auth.uid() = created_by);

-- Create laporan_do_items table
CREATE TABLE IF NOT EXISTS public.laporan_do_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    laporan_do_id UUID REFERENCES public.laporan_do(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    alokasi INT NOT NULL,
    jumlah_do INT NOT NULL,
    jenis VARCHAR(50) NOT NULL, -- 'Fakultatif' or 'Normal'
    status_tebus BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for laporan_do_items
ALTER TABLE public.laporan_do_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items of their laporan_do" 
    ON public.laporan_do_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.laporan_do
            WHERE laporan_do.id = laporan_do_items.laporan_do_id
            AND laporan_do.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert items to their laporan_do" 
    ON public.laporan_do_items FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.laporan_do
            WHERE laporan_do.id = laporan_do_items.laporan_do_id
            AND laporan_do.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update items of their laporan_do" 
    ON public.laporan_do_items FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.laporan_do
            WHERE laporan_do.id = laporan_do_items.laporan_do_id
            AND laporan_do.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete items of their laporan_do" 
    ON public.laporan_do_items FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.laporan_do
            WHERE laporan_do.id = laporan_do_items.laporan_do_id
            AND laporan_do.created_by = auth.uid()
        )
    );
