import { createClient } from '@/lib/supabase/client'
import type { Pangkalan, FotoPangkalan, LogAktivitas, DashboardStats, JenisAksi } from '@/types'

const supabase = createClient()

// ============================================================
// PANGKALAN CRUD
// ============================================================

export async function getPangkalanList(filters?: {
  status?: string
  kecamatan?: string
  foto_lengkap?: boolean
  search?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('pangkalan')
    .select(`
      *,
      foto_pangkalan (*)
    `)
    .order('nama_pangkalan', { ascending: true })

  if (user) {
    query = query.eq('created_by', user.id)
  }

  if (filters?.status && filters.status !== 'semua') {
    query = query.eq('status', filters.status)
  }
  if (filters?.kecamatan && filters.kecamatan !== 'semua') {
    query = query.eq('kecamatan', filters.kecamatan)
  }
  if (filters?.foto_lengkap !== undefined) {
    query = query.eq('foto_lengkap', filters.foto_lengkap)
  }
  if (filters?.search) {
    query = query.or(
      `nama_pangkalan.ilike.%${filters.search}%,nama_pemilik.ilike.%${filters.search}%,id_registrasi.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data as Pangkalan[]
}

export async function getPangkalanById(id: string) {
  const { data, error } = await supabase
    .from('pangkalan')
    .select(`
      *,
      foto_pangkalan (*),
      profiles:created_by (full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Pangkalan
}

export async function createPangkalan(
  pangkalan: Omit<Pangkalan, 'id' | 'created_at' | 'updated_at' | 'foto_lengkap'>
) {
  const { data, error } = await supabase
    .from('pangkalan')
    .insert([pangkalan])
    .select()
    .single()

  if (error) throw error
  return data as Pangkalan
}

export async function updatePangkalan(
  id: string,
  pangkalan: Partial<Omit<Pangkalan, 'id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('pangkalan')
    .update(pangkalan)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Pangkalan
}

export async function deletePangkalan(id: string) {
  const { error } = await supabase
    .from('pangkalan')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function togglePangkalanStatus(id: string, status: 'aktif' | 'nonaktif') {
  const { data, error } = await supabase
    .from('pangkalan')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Pangkalan
}

// ============================================================
// FOTO
// ============================================================

export async function uploadFoto(
  pangkalanId: string,
  jenisFoto: string,
  file: File,
  pangkalanNama: string
): Promise<FotoPangkalan> {
  const { data: { user } } = await supabase.auth.getUser()
  
  const fileName = `${pangkalanId}/${jenisFoto}_${Date.now()}.jpg`
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('foto-pangkalan')
    .upload(fileName, file, { upsert: true })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('foto-pangkalan')
    .getPublicUrl(fileName)

  // Upsert to database (replace if same jenis_foto exists)
  const { data, error } = await supabase
    .from('foto_pangkalan')
    .upsert({
      pangkalan_id: pangkalanId,
      jenis_foto: jenisFoto,
      storage_path: fileName,
      url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user?.id,
    }, { onConflict: 'pangkalan_id,jenis_foto' })
    .select()
    .single()

  if (error) throw error
  return data as FotoPangkalan
}

export async function deleteFoto(foto: FotoPangkalan) {
  // Delete from storage
  await supabase.storage
    .from('foto-pangkalan')
    .remove([foto.storage_path])

  // Delete from database
  const { error } = await supabase
    .from('foto_pangkalan')
    .delete()
    .eq('id', foto.id)

  if (error) throw error
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('pangkalan')
    .select('id, status, foto_lengkap, kecamatan, nama_pangkalan, nama_pemilik, created_at, nomor_hp, latitude, longitude')
    .order('created_at', { ascending: false })

  if (user) {
    query = query.eq('created_by', user.id)
  }

  const { data: pangkalanData, error } = await query

  if (error) throw error

  const total_pangkalan = pangkalanData.length
  const total_aktif = pangkalanData.filter(p => p.status === 'aktif').length
  const total_nonaktif = pangkalanData.filter(p => p.status === 'nonaktif').length
  const total_belum_lengkap = pangkalanData.filter(p => !p.foto_lengkap).length

  // Count per kecamatan
  const kecamatanMap = pangkalanData.reduce((acc, p) => {
    acc[p.kecamatan] = (acc[p.kecamatan] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total_per_kecamatan = Object.entries(kecamatanMap)
    .map(([kecamatan, count]) => ({ kecamatan, count }))
    .sort((a, b) => b.count - a.count)

  const pangkalan_terbaru = pangkalanData.slice(0, 5) as Pangkalan[]

  return {
    total_pangkalan,
    total_aktif,
    total_nonaktif,
    total_belum_lengkap,
    total_per_kecamatan,
    pangkalan_terbaru,
  }
}

// ============================================================
// LOG AKTIVITAS
// ============================================================

export async function logAktivitas(data: {
  aksi: JenisAksi
  entitas: string
  entitas_id?: string
  entitas_nama?: string
  data_lama?: unknown
  data_baru?: unknown
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  await supabase.from('log_aktivitas').insert({
    user_id: user.id,
    user_name: profile?.full_name || user.email,
    aksi: data.aksi,
    entitas: data.entitas,
    entitas_id: data.entitas_id,
    entitas_nama: data.entitas_nama,
    data_lama: data.data_lama as never,
    data_baru: data.data_baru as never,
  })
}

// ============================================================
// ARMADA
// ============================================================

import type { Armada } from '@/types'

export async function getArmadaList(filters?: {
  status?: string
  search?: string
}): Promise<Armada[]> {
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('armada')
    .select('*')
    .order('created_at', { ascending: false })

  if (user) {
    query = query.eq('created_by', user.id)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`no_plat.ilike.%${filters.search}%,nama_sopir.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Armada[]
}

export async function getArmadaById(id: string): Promise<Armada | null> {
  const { data, error } = await supabase
    .from('armada')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as Armada | null
}

export async function deleteArmada(id: string) {
  const { error } = await supabase
    .from('armada')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function uploadArmadaFoto(
  armadaId: string,
  file: File,
  noPlat: string
): Promise<string> {
  const fileName = `armada/${armadaId}_${Date.now()}.jpg`
  
  // Upload to storage (menggunakan bucket foto-pangkalan)
  const { error: uploadError } = await supabase.storage
    .from('foto-pangkalan')
    .upload(fileName, file, { upsert: true })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('foto-pangkalan')
    .getPublicUrl(fileName)

  // Update table armada
  const { error: updateError } = await supabase
    .from('armada')
    .update({ foto_kendaraan: publicUrl })
    .eq('id', armadaId)

  if (updateError) throw updateError

  return publicUrl
}

export async function getLogAktivitas(limit = 50, offset = 0) {
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('log_aktivitas')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (user) {
    query = query.eq('user_id', user.id)
  }

  const { data, error, count } = await query

  if (error) throw error
  return { data: data as LogAktivitas[], count: count || 0 }
}

// ============================================================
// WILAYAH
// ============================================================

export async function getKecamatan() {
  const { data, error } = await supabase
    .from('wilayah')
    .select('kecamatan')
    .order('kecamatan')

  if (error) throw error
  
  const unique = [...new Set(data.map(w => w.kecamatan))]
  return unique
}

export async function getKelurahan(kecamatan: string) {
  const { data, error } = await supabase
    .from('wilayah')
    .select('kelurahan')
    .eq('kecamatan', kecamatan)
    .order('kelurahan')

  if (error) throw error
  return data.map(w => w.kelurahan)
}
