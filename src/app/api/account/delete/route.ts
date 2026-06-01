import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import path from 'path'

// Function to build a modern Goodbye email template
function buildGoodbyeEmailTemplate(namaLengkap: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Akun Berhasil Dihapus - Agen LPG</title>
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f7; }
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .content-padding { padding: 20px !important; }
            .header-logo { width: 120px !important; }
            .footer-logo { width: 90px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #f0fdf4; padding: 30px 20px; border-bottom: 3px solid #16a34a;">
                            <img src="cid:logo-agen" alt="Agen LPG Logo" width="64" class="header-logo" style="display: block;">
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td class="content-padding" style="padding: 40px 40px 30px 40px; color: #333333;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #111827; text-align: center;">Selamat Tinggal, ${namaLengkap}</h2>
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                                Kami menerima permintaan Anda untuk menghapus akun secara permanen dari sistem <strong>Agen LPG</strong>. Permintaan Anda telah berhasil kami proses.
                            </p>
                            <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                                Seluruh data pribadi, pangkalan, armada, serta histori aktivitas Anda telah kami hapus seluruhnya dari database kami sesuai dengan kebijakan privasi.
                            </p>
                            
                            <div style="background-color: #f9fafb; border-left: 4px solid #9ca3af; padding: 15px; margin-bottom: 25px;">
                                <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                                    "Terima kasih telah memercayakan sistem manajemen Agen LPG. Kami sangat menghargai waktu dan kontribusi Anda selama menggunakan layanan kami."
                                </p>
                            </div>
                            
                            <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 24px; color: #4b5563;">
                                Jika suatu hari nanti Anda ingin kembali bergabung, sistem kami akan selalu terbuka untuk Anda. Anda dapat mendaftarkan akun baru kapan saja.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA Balik -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="border-radius: 6px;" bgcolor="#16a34a">
                                        <a href="https://agen-lpg.netlify.app/register" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 24px; display: inline-block; font-weight: bold; border-radius: 6px;">Daftar Kembali Nanti</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
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
            </td>
        </tr>
    </table>
</body>
</html>`
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Get user session from server client
    const supabaseServer = await createServerClient()
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const userEmail = user.email!

    // Fetch user profile to get full name for email
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()
      
    const namaLengkap = profile?.full_name || 'Pengguna'

    // 2. Create Admin client for deletion
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. WIPE OUT ALL DATA SEQUENTIALLY
    // To prevent FK constraint errors, we must delete child records first.

    // a. Delete log_aktivitas
    await supabaseAdmin
      .from('log_aktivitas')
      .delete()
      .eq('user_id', userId)

    // b. Delete armada
    await supabaseAdmin
      .from('armada')
      .delete()
      .eq('created_by', userId)

    // c. Delete pangkalan (this cascades to foto_pangkalan)
    await supabaseAdmin
      .from('pangkalan')
      .delete()
      .eq('created_by', userId)

    // d. Delete agen_account (registration record)
    await supabaseAdmin
      .from('agen_account')
      .delete()
      .eq('email', userEmail)

    // e. Delete Auth User (this cascades to profiles)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      return NextResponse.json({ success: false, message: 'Gagal menghapus akun autentikasi.' }, { status: 500 })
    }

    // 4. Send Goodbye Email
    try {
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
        to: userEmail,
        subject: `Perpisahan dari Agen LPG - Akun Berhasil Dihapus`,
        html: buildGoodbyeEmailTemplate(namaLengkap),
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
    } catch (emailErr) {
      console.error('Failed to send goodbye email:', emailErr)
      // We don't fail the deletion if email fails
    }

    return NextResponse.json({ success: true, message: 'Akun dan seluruh data berhasil dihapus permanen.' })

  } catch (error: any) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Terjadi kesalahan server saat menghapus akun.' }, { status: 500 })
  }
}
