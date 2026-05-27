export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type StatusPangkalan = 'aktif' | 'nonaktif'
export type JenisFoto = 'gas_detector' | 'apar' | 'bak_tes_kebocoran' | 'timbangan' | 'papan_pangkalan'
export type JenisAksi = 'tambah' | 'edit' | 'hapus' | 'aktifkan' | 'nonaktifkan' | 'upload_foto' | 'hapus_foto' | 'login' | 'logout'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Wilayah {
  id: string
  provinsi: string
  kota: string
  kecamatan: string
  kelurahan: string
  kode_pos: string | null
  created_at: string
}

export interface Pangkalan {
  id: string
  nama_pangkalan: string
  nama_pemilik: string
  id_registrasi: string
  nomor_hp: string
  alamat: string
  kecamatan: string
  kelurahan: string
  kota: string
  provinsi: string
  latitude: number | null
  longitude: number | null
  link_maps: string | null
  status: StatusPangkalan
  catatan_admin: string | null
  foto_lengkap: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  // Relations (optional join)
  profiles?: Profile
  foto_pangkalan?: FotoPangkalan[]
}

export interface FotoPangkalan {
  id: string
  pangkalan_id: string
  jenis_foto: JenisFoto
  storage_path: string
  url: string
  file_name: string | null
  file_size: number | null
  uploaded_by: string | null
  uploaded_at: string
  profiles?: Profile
}

export interface LogAktivitas {
  id: string
  user_id: string | null
  user_name: string | null
  aksi: JenisAksi
  entitas: string
  entitas_id: string | null
  entitas_nama: string | null
  data_lama: Json | null
  data_baru: Json | null
  ip_address: string | null
  created_at: string
  profiles?: Profile
}

export interface DashboardStats {
  total_pangkalan: number
  total_aktif: number
  total_nonaktif: number
  total_belum_lengkap: number
  total_per_kecamatan: { kecamatan: string; count: number }[]
  pangkalan_terbaru: Pangkalan[]
}

// Form types
export interface PangkalanFormData {
  nama_pangkalan: string
  nama_pemilik: string
  id_registrasi: string
  nomor_hp: string
  alamat: string
  kecamatan: string
  kelurahan: string
  kota: string
  provinsi: string
  latitude: string
  longitude: string
  link_maps: string
  status: StatusPangkalan
  catatan_admin: string
}

export const JENIS_FOTO_LABELS: Record<JenisFoto, string> = {
  gas_detector: 'Gas Detector',
  apar: 'APAR (Pemadam Api)',
  bak_tes_kebocoran: 'Bak Tes Kebocoran',
  timbangan: 'Timbangan',
  papan_pangkalan: 'Papan Pangkalan',
}

export const JENIS_FOTO_LIST: JenisFoto[] = [
  'gas_detector',
  'apar',
  'bak_tes_kebocoran',
  'timbangan',
  'papan_pangkalan',
]
