import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function buildEmailTemplate(otp: string, namaLengkap: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP - Agen LPG</title>
    <!-- CSS Internal untuk client email modern yang mendukung -->
    <style type="text/css">
        /* Reset Styles */
        body, table, td, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        table {
            border-collapse: collapse !important;
        }
        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f5f7;
        }

        /* Responsive Styles (Untuk Mobile) */
        @media screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .content-padding {
                padding: 20px !important;
            }
            .otp-box {
                font-size: 28px !important;
                letter-spacing: 5px !important;
                padding: 15px !important;
            }
            .header-logo {
                width: 120px !important;
            }
            .footer-logo {
                width: 90px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7;">
    
    <!-- Wrapper Utama dengan Background Abu-abu -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f5f7;">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                
                <!-- Kontainer Konten (Max 600px biar rapi di desktop) -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    
                    <!-- Tahap 2: HEADER (Logo Agen LPG dengan tema Ijo Melon) -->
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px; background-color: #ffffff;">
                            <a href="#" target="_blank" style="text-decoration: none;">
                                <img src="cid:logo-agen" alt="Agen LPG Logo" width="64" class="header-logo" style="display: block; font-family: sans-serif; font-size: 20px; color: #3e9c35; font-weight: bold;">
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Tahap 3: KONTEN UTAMA & OTP -->
                    <tr>
                        <td class="content-padding" style="padding: 20px 40px 30px 40px; color: #333333; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #1a1a1a; text-align: center;">Verifikasi Akun Anda</h2>
                            
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 24px; color: #555555;">
                                Halo, ${namaLengkap.toUpperCase()}!
                            </p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 24px; color: #555555;">
                                Kami menerima permintaan pendaftaran akun Anda di sistem <strong>Agen LPG</strong>. Silakan gunakan kode *One-Time Password* (OTP) di bawah ini untuk melanjutkan proses verifikasi.
                            </p>
                            
                            <!-- Kotak OTP (Udah pakai ijo melon 3e9c35) -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <div class="otp-box" style="background-color: #f1f8f1; border: 2px dashed #3e9c35; border-radius: 8px; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; color: #3e9c35; letter-spacing: 8px; margin: 10px 0 25px 0; display: inline-block;">
                                            ${otp}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 22px; color: #888888;">
                                <em>Kode ini hanya berlaku selama <strong>10 menit</strong>. Jangan pernah memberikan kode ini kepada siapa pun, termasuk pihak Agen LPG atau PrimaDev.</em>
                            </p>
                            
                            <p style="margin: 0; font-size: 16px; line-height: 24px; color: #555555;">
                                Jika Anda tidak pernah merasa melakukan permintaan ini, abaikan saja email ini.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Tahap 4: FOOTER (Logo PrimaDev) -->
                    <tr>
                        <td style="background-color: #000000d0; padding: 30px 20px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;">
                                        <p style="margin: 0 0 10px 0; color: #ffffffff;">Website ini dirancang dan dikembangkan oleh:</p>
                                        
                                        <a href="https://apps-primadev.netlify.app" target="_blank" style="text-decoration: none; display: inline-block; margin-bottom: 15px;">
                                            <img src="cid:logo-primadev" alt="PrimaDev Logo" height="40" class="footer-logo" style="display: block; border: 0;">
                                        </a>
                                        
                                        <p style="margin: 0; font-size: 12px; color: #ffffffff;">
                                            &copy; ${year} Agen LPG | All Rights Reserved.<br>
                                            Butuh bantuan? Silakan hubungi <a href="mailto:wisnu.bussines99@gmail.com" style="color: #4cb748; text-decoration: none; font-weight: bold;">wisnu.bussines99@gmail.com</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                <!-- Akhir Kontainer -->
                
            </td>
        </tr>
    </table>
    <!-- Akhir Wrapper -->

</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama_lengkap, email, password, konfirmasi_password, nama_agen, sold_to, wilayah, agreedToTerms } = body

    // --- Cek data akun saat ini (termasuk status banned) ---
    const { data: existingAccount } = await supabase
      .from('agen_account')
      .select('id, is_verified, is_banned, strike_count')
      .eq('email', email)
      .maybeSingle()

    // Jika sudah di-banned, tolak langsung
    if (existingAccount?.is_banned) {
      return NextResponse.json({ success: false, message: 'Email Anda telah diblokir secara permanen dari sistem kami karena mencoba melakukan bypass keamanan. Silakan hubungi kami via Kontak Resmi.' }, { status: 403 })
    }

    // --- Anti-Bypass Checkbox ---
    if (agreedToTerms !== true) {
      const currentStrikes = existingAccount?.strike_count || 0
      const newStrikes = currentStrikes + 1
      
      // Upsert data minimal untuk mencatat strike
      await supabase.from('agen_account').upsert({
        email,
        nama_lengkap: nama_lengkap || 'Unknown',
        password_hash: 'banned',
        strike_count: newStrikes,
        is_banned: newStrikes >= 2,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })

      if (newStrikes >= 2) {
        return NextResponse.json({ success: false, message: 'Email Anda telah diblokir karena mengulangi upaya bypass sistem pendaftaran. Hubungi Kontak Resmi.' }, { status: 403 })
      } else {
        return NextResponse.json({ success: false, message: 'PERINGATAN KERAS: Anda telah mencoba merubah sistem kami untuk melewati persetujuan Syarat & Ketentuan. Lakukan sekali lagi dan email Anda akan diblokir!' }, { status: 400 })
      }
    }

    // --- Validasi Data ---
    if (!nama_lengkap || !email || !password || !konfirmasi_password || !nama_agen || !sold_to || !wilayah) {
      return NextResponse.json({ success: false, message: 'Semua field wajib diisi.' }, { status: 400 })
    }
    if (password !== konfirmasi_password) {
      return NextResponse.json({ success: false, message: 'Password dan konfirmasi password tidak cocok.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, message: 'Password minimal 8 karakter.' }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Format email tidak valid.' }, { status: 400 })
    }

    // --- Cek email sudah terdaftar & verified ---
    if (existingAccount?.is_verified) {
      return NextResponse.json({ success: false, message: 'Email sudah terdaftar. Silakan login.' }, { status: 409 })
    }

    // --- Hash password ---
    const passwordHash = await bcrypt.hash(password, 12)

    // --- Generate OTP ---
    const otp = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // --- Upsert ke agen_account (unverified) ---
    // Simpan password plain sementara agar bisa membuat akun Supabase Auth saat OTP diverifikasi
    const { error: upsertError } = await supabase
      .from('agen_account')
      .upsert(
        {
          nama_lengkap,
          email,
          password_hash: passwordHash,
          password_temp: password, // akan dihapus setelah akun Auth dibuat
          nama_agen,
          sold_to,
          wilayah,
          is_verified: false,
          otp_code: otp,
          otp_expires_at: otpExpiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError)
      return NextResponse.json({ success: false, message: 'Gagal menyimpan data. Coba lagi.' }, { status: 500 })
    }

    // --- Kirim Email OTP ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `${otp} - Kode Verifikasi Pendaftaran Agen LPG`,
      html: buildEmailTemplate(otp, nama_lengkap),
      attachments: [
        {
          filename: 'favicon-96x96.png',
          path: path.join(process.cwd(), 'public', 'icons', 'favicon-96x96.png'),
          cid: 'logo-agen'
        },
        {
          filename: 'primadev-white.png',
          path: path.join(process.cwd(), 'public', 'primadev-white.png'),
          cid: 'logo-primadev'
        }
      ]
    })

    return NextResponse.json({ success: true, message: 'Kode OTP telah dikirim ke email Anda.' })
  } catch (err) {
    console.error('Send OTP error:', err)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server. Coba lagi.' }, { status: 500 })
  }
}
