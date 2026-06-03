import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daftar',
  description: 'Daftarkan Agen LPG Anda secara gratis dan mulai pantau penyaluran serta kelengkapan data pangkalan dengan sistem yang modern dan efisien.',
  openGraph: {
    title: 'Daftar - Agen LPG',
    description: 'Daftarkan Agen LPG Anda secara gratis dan mulai pantau penyaluran serta kelengkapan data pangkalan dengan sistem yang modern dan efisien.',
  }
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
