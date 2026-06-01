-- Tabel Akun Agen
create table public.agen_account (
  id uuid not null default gen_random_uuid (),
  nama_lengkap text not null,
  email text not null,
  password_hash text not null,
  nama_agen text null,
  sold_to text null,
  wilayah text null,
  is_verified boolean null default false,
  otp_code text null,
  otp_expires_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  password_temp text null,
  constraint agen_account_pkey primary key (id),
  constraint agen_account_email_key unique (email)
) TABLESPACE pg_default;

-- Tabel Armada
create table public.armada (
  id uuid not null default extensions.uuid_generate_v4 (),
  no_plat text not null,
  nama_sopir text not null,
  jatuh_tempo_pajak_1_tahun date null,
  jatuh_tempo_plat_5_tahun date null,
  foto_kendaraan jsonb null,
  status text not null default 'aktif'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  updated_by uuid null,
  constraint armada_pkey primary key (id),
  constraint armada_no_plat_key unique (no_plat),
  constraint armada_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint armada_updated_by_fkey foreign KEY (updated_by) references auth.users (id),
  constraint armada_status_check check (
    (
      status = any (
        array[
          'aktif'::text,
          'perbaikan'::text,
          'nonaktif'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger update_armada_modtime BEFORE
update on armada for EACH row
execute FUNCTION update_modified_column ();

-- Tabel Foto Pangkalan
create table public.foto_pangkalan (
  id uuid not null default extensions.uuid_generate_v4 (),
  pangkalan_id uuid not null,
  jenis_foto public.jenis_foto not null,
  storage_path text not null,
  url text not null,
  file_name text null,
  file_size integer null,
  uploaded_by uuid null,
  uploaded_at timestamp with time zone not null default now(),
  constraint foto_pangkalan_pkey primary key (id),
  constraint foto_pangkalan_pangkalan_id_jenis_foto_key unique (pangkalan_id, jenis_foto),
  constraint foto_pangkalan_pangkalan_id_fkey foreign KEY (pangkalan_id) references pangkalan (id) on delete CASCADE,
  constraint foto_pangkalan_uploaded_by_fkey foreign KEY (uploaded_by) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists idx_foto_pangkalan_id on public.foto_pangkalan using btree (pangkalan_id) TABLESPACE pg_default;

create trigger update_foto_lengkap_on_insert
after INSERT
or DELETE
or
update on foto_pangkalan for EACH row
execute FUNCTION update_foto_lengkap ();

-- Tabel Log Aktivitas
create table public.log_aktivitas (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  user_name text null,
  aksi public.jenis_aksi not null,
  entitas text not null,
  entitas_id uuid null,
  entitas_nama text null,
  data_lama jsonb null,
  data_baru jsonb null,
  ip_address text null,
  created_at timestamp with time zone not null default now(),
  constraint log_aktivitas_pkey primary key (id),
  constraint log_aktivitas_user_id_fkey foreign KEY (user_id) references profiles (id)
) TABLESPACE pg_default;
create index IF not exists idx_log_user_id on public.log_aktivitas using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_log_created_at on public.log_aktivitas using btree (created_at desc) TABLESPACE pg_default;
create index IF not exists idx_log_entitas on public.log_aktivitas using btree (entitas, entitas_id) TABLESPACE pg_default;

-- Tabel Pangkalan
create table public.pangkalan (
  id uuid not null default extensions.uuid_generate_v4 (),
  nama_pangkalan text not null,
  nama_pemilik text not null,
  id_registrasi text not null,
  nomor_hp text not null,
  alamat text not null,
  kecamatan text not null,
  kelurahan text not null,
  kota text not null,
  provinsi text not null,
  latitude double precision null,
  longitude double precision null,
  link_maps text null,
  status public.status_pangkalan not null default 'aktif'::status_pangkalan,
  catatan_admin text null,
  foto_lengkap boolean not null default false,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pangkalan_pkey primary key (id),
  constraint pangkalan_id_registrasi_key unique (id_registrasi),
  constraint pangkalan_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint pangkalan_updated_by_fkey foreign KEY (updated_by) references profiles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_pangkalan_status on public.pangkalan using btree (status) TABLESPACE pg_default;
create index IF not exists idx_pangkalan_kota on public.pangkalan using btree (kota) TABLESPACE pg_default;
create index IF not exists idx_pangkalan_kecamatan on public.pangkalan using btree (kecamatan) TABLESPACE pg_default;
create index IF not exists idx_pangkalan_foto_lengkap on public.pangkalan using btree (foto_lengkap) TABLESPACE pg_default;
create index IF not exists idx_pangkalan_created_at on public.pangkalan using btree (created_at desc) TABLESPACE pg_default;
create trigger update_pangkalan_updated_at BEFORE
update on pangkalan for EACH row
execute FUNCTION update_updated_at_column ();

-- Tabel Profiles
create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text null,
  role text not null default 'admin'::text,
  avatar_url text null,
  phone text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION update_updated_at_column ();