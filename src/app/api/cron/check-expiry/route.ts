import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getDaysBetween(dateString: string) {
  const target = new Date(dateString)
  const now = new Date()
  const diffTime = target.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const keyUrl = request.nextUrl.searchParams.get('key')
    
    // Simple protection
    const SECRET = process.env.CRON_SECRET || 'primadev-cron-secret'
    if (authHeader !== `Bearer ${SECRET}` && keyUrl !== SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch expiring APAR
    const { data: pangkalanData } = await supabase
      .from('pangkalan')
      .select('id, nama_pangkalan, apar_expired_at')
      .not('apar_expired_at', 'is', null)

    const expiringApar = (pangkalanData || []).filter(p => {
      if (!p.apar_expired_at) return false
      const days = getDaysBetween(p.apar_expired_at)
      return days >= 0 && days <= 30
    })

    // 2. Fetch expiring Armada Pajak
    const { data: armadaData } = await supabase
      .from('armada')
      .select('id, no_plat, jatuh_tempo_pajak_1_tahun, jatuh_tempo_plat_5_tahun')

    const expiringPajak1 = (armadaData || []).filter(a => {
      if (!a.jatuh_tempo_pajak_1_tahun) return false
      const days = getDaysBetween(a.jatuh_tempo_pajak_1_tahun)
      return days >= 0 && days <= 30
    }).map(a => ({ ...a, tipe: 'Pajak 1 Tahunan', expired_at: a.jatuh_tempo_pajak_1_tahun }))

    const expiringPajak5 = (armadaData || []).filter(a => {
      if (!a.jatuh_tempo_plat_5_tahun) return false
      const days = getDaysBetween(a.jatuh_tempo_plat_5_tahun)
      return days >= 0 && days <= 30
    }).map(a => ({ ...a, tipe: 'Pajak 5 Tahunan', expired_at: a.jatuh_tempo_plat_5_tahun }))

    const allExpiringArmada = [...expiringPajak1, ...expiringPajak5]

    // If nothing expiring, just return
    if (expiringApar.length === 0 && allExpiringArmada.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada item yang akan kedaluwarsa.' })
    }

    // 3. Find admins who want email notifications
    const { data: admins } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('email_notif', true)
      .not('email', 'is', null)

    if (!admins || admins.length === 0) {
      return NextResponse.json({ success: true, message: 'Ada item kedaluwarsa, tetapi tidak ada admin yang mengaktifkan Peringatan Email.' })
    }

    // 4. Build Email Template
    let aparHtml = ''
    if (expiringApar.length > 0) {
      aparHtml = `
        <h3 style="color: #1a1a1a; margin-top: 20px;">APAR Hampir Kedaluwarsa</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; font-size: 14px; color: #475569;">Pangkalan</th>
            <th style="padding: 12px; text-align: left; font-size: 14px; color: #475569;">Sisa Waktu</th>
          </tr>
          ${expiringApar.map(p => {
            const days = getDaysBetween(p.apar_expired_at!)
            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: bold;">${p.nama_pangkalan}</td>
                <td style="padding: 12px; font-size: 14px; color: #ef4444; font-weight: bold;">${days} Hari</td>
              </tr>
            `
          }).join('')}
        </table>
      `
    }

    let armadaHtml = ''
    if (allExpiringArmada.length > 0) {
      armadaHtml = `
        <h3 style="color: #1a1a1a; margin-top: 20px;">Pajak Kendaraan Hampir Kedaluwarsa</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; font-size: 14px; color: #475569;">No Plat</th>
            <th style="padding: 12px; text-align: left; font-size: 14px; color: #475569;">Jenis Pajak</th>
            <th style="padding: 12px; text-align: left; font-size: 14px; color: #475569;">Sisa Waktu</th>
          </tr>
          ${allExpiringArmada.map(a => {
            const days = getDaysBetween(a.expired_at!)
            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: bold;">${a.no_plat}</td>
                <td style="padding: 12px; font-size: 14px; color: #3b82f6;">${a.tipe}</td>
                <td style="padding: 12px; font-size: 14px; color: #ef4444; font-weight: bold;">${days} Hari</td>
              </tr>
            `
          }).join('')}
        </table>
      `
    }

    const year = new Date().getFullYear()
    const htmlTemplate = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peringatan Kedaluwarsa Dokumen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px; background-color: #ffffff;">
                            <img src="cid:logo-agen" alt="Agen LPG Logo" width="64" style="display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px 30px 40px; color: #333333;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #1a1a1a; text-align: center;">Peringatan Kedaluwarsa (H-30)</h2>
                            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 24px; color: #555555;">
                                Halo Admin! Sistem mendeteksi ada beberapa dokumen Pangkalan atau Armada yang masa aktifnya tersisa 30 hari atau kurang. Mohon segera diproses:
                            </p>
                            
                            ${aparHtml}
                            ${armadaHtml}
                            
                            <p style="margin: 25px 0 0 0; font-size: 14px; line-height: 22px; color: #888888; font-style: italic;">
                                Anda menerima email ini karena mengaktifkan "Peringatan Email" di halaman Pengaturan Dashboard.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #000000d0; padding: 30px 20px; text-align: center;">
                            <img src="cid:logo-primadev" alt="PrimaDev Logo" height="40" style="display: inline-block; border: 0; margin-bottom: 15px;">
                            <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.8);">
                                &copy; ${year} Agen LPG | All Rights Reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <!-- Anti-trimming string for Gmail -->
    <div style="display: none; white-space: nowrap; font: 15px courier; line-height: 0;">
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
    </div>
    <span style="opacity: 0; color: transparent; display: none; font-size: 0px;">${Date.now()}</span>
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

    const emailPromises = admins.map(admin => {
      return transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: admin.email,
        subject: 'Peringatan: Dokumen APAR/Pajak Hampir Kedaluwarsa',
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
    })

    await Promise.allSettled(emailPromises)

    return NextResponse.json({ success: true, message: `Email terkirim ke ${admins.length} admin.` })
  } catch (error: any) {
    console.error('Expiry Check Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
