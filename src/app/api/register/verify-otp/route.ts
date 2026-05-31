import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'Email dan OTP wajib diisi.' }, { status: 400 })
    }

    // Cari record berdasarkan email (ambil password_temp juga)
    const { data: account, error: fetchError } = await supabase
      .from('agen_account')
      .select('id, otp_code, otp_expires_at, is_verified, password_temp, nama_lengkap')
      .eq('email', email)
      .maybeSingle()

    if (fetchError || !account) {
      return NextResponse.json({ success: false, message: 'Akun tidak ditemukan.' }, { status: 404 })
    }

    if (account.is_verified) {
      return NextResponse.json({ success: false, message: 'Akun sudah terverifikasi. Silakan login.' }, { status: 409 })
    }

    // Cek OTP kadaluarsa
    if (!account.otp_expires_at || new Date() > new Date(account.otp_expires_at)) {
      return NextResponse.json({ success: false, message: 'Kode OTP sudah kadaluarsa. Daftar ulang untuk mendapatkan kode baru.' }, { status: 410 })
    }

    // Cek OTP cocok
    if (account.otp_code !== otp.trim()) {
      return NextResponse.json({ success: false, message: 'Kode OTP tidak valid. Periksa kembali email Anda.' }, { status: 400 })
    }

    // OTP valid → Buat akun di Supabase Auth menggunakan admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: account.password_temp,
      email_confirm: true, // langsung aktif tanpa perlu konfirmasi email Supabase
      user_metadata: {
        full_name: account.nama_lengkap,
      },
    })

    if (authData?.user) {
      // Penting: Buat record di tabel profiles agar Foreign Key di tabel lain (seperti pangkalan) tidak error
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: email,
        full_name: account.nama_lengkap,
        role: 'admin', // Default role
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      
      if (profileError) {
        console.error('Error creating profile record:', profileError)
      }
    }

    // Jika email sudah ada di Auth (misalnya register ulang)
    if (authError && authError.message?.includes('already been registered')) {
      console.warn('User already exists in Supabase Auth, continuing verification...')
    } else if (authError) {
      console.error('Supabase Auth createUser error:', authError)
      return NextResponse.json({ success: false, message: 'Gagal membuat akun. Coba lagi.' }, { status: 500 })
    }

    // Update agen_account: is_verified=true, hapus OTP dan password_temp
    const { error: updateError } = await supabase
      .from('agen_account')
      .update({
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
        password_temp: null, // hapus password plain setelah digunakan
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ success: false, message: 'Gagal memverifikasi akun. Coba lagi.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Akun berhasil dibuat! Anda sekarang bisa login.' })
  } catch (err) {
    console.error('Verify OTP error:', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
