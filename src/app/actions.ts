'use server'

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import path from 'path'

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

export async function sendPasswordChangeEmail(email: string, fullName: string) {
  try {
    if (!email) return false
    
    const year = new Date().getFullYear()
    const htmlTemplate = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pemberitahuan Perubahan Password</title>
    <style type="text/css">
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { padding: 40px 20px 20px; text-align: center; }
        .content { padding: 20px 40px 30px; color: #333333; }
        .title { margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #1a1a1a; text-align: center; }
        .text { margin: 0 0 15px 0; font-size: 16px; line-height: 24px; color: #555555; }
        .alert-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
        .alert-text { margin: 0; font-size: 15px; color: #334155; line-height: 22px; }
        .footer { background-color: #000000d0; padding: 30px 20px; text-align: center; color: #ffffff; }
        @media screen and (max-width: 600px) {
            .container { margin: 20px 10px; width: auto; }
            .content { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="cid:logo-agen" alt="Agen LPG Logo" width="64" style="display: inline-block;">
        </div>
        <div class="content">
            <h2 class="title">Pemberitahuan Keamanan</h2>
            <p class="text">Halo, <strong>\${fullName.toUpperCase()}</strong>!</p>
            <p class="text">Kami ingin memberitahukan bahwa <strong>password akun Agen LPG Anda telah berhasil diubah</strong> baru saja.</p>
            
            <div class="alert-box">
                <p class="alert-text">
                    Jika ini memang Anda yang melakukan perubahan, Anda bisa mengabaikan email ini. Akun Anda sepenuhnya aman.
                </p>
            </div>
            
            <p class="text" style="font-size: 14px; color: #ef4444; margin-top: 30px;">
                <strong>Tidak merasa mengubah password?</strong><br>
                Segera hubungi tim Administrator kami untuk mengamankan akun Anda.
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.8);">Website ini dirancang dan dikembangkan oleh:</p>
            <a href="https://apps-primadev.netlify.app" target="_blank" style="text-decoration: none; display: inline-block; margin-bottom: 15px;">
                <img src="cid:logo-primadev" alt="PrimaDev Logo" height="40" style="display: block; border: 0;">
            </a>
            <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.7);">
                &copy; \${year} Agen LPG | All Rights Reserved.<br>
                Butuh bantuan? Silakan hubungi <a href="mailto:wisnu.bussines99@gmail.com" style="color: #4cb748; text-decoration: none;">wisnu.bussines99@gmail.com</a>
            </p>
        </div>
    </div>
</body>
</html>`

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
      subject: 'Pemberitahuan Keamanan: Password Akun Diubah',
      html: htmlTemplate,
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
    
    return true
  } catch (error) {
    console.error('Error sending password change email:', error)
    return false
  }
}
