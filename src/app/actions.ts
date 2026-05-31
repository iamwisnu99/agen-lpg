'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getFallbackProfileData(email: string) {
  try {
    if (!email) return null
    const { data } = await supabaseAdmin
      .from('agen_account')
      .select('nama_lengkap, nama_agen, sold_to, wilayah')
      .eq('email', email)
      .maybeSingle()
    
    return data || null
  } catch (error) {
    console.error('Error fetching fallback profile:', error)
    return null
  }
}

export async function saveSystemSettingsData(email: string, payload: { nama_agen: string, sold_to: string, wilayah: string }) {
  try {
    if (!email) return false
    const { error } = await supabaseAdmin
      .from('agen_account')
      .update({
        nama_agen: payload.nama_agen,
        sold_to: payload.sold_to,
        wilayah: payload.wilayah,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving system settings:', error)
    return false
  }
}
