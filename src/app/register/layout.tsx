import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daftar Akun Baru',
  description: 'Daftarkan Agen LPG Anda dan mulai pantau penyaluran serta data pangkalan dengan sistem yang modern dan efisien.',
  openGraph: {
    title: 'Daftar Akun - Agen LPG',
    description: 'Daftarkan Agen LPG Anda dan mulai pantau penyaluran serta data pangkalan dengan sistem yang modern dan efisien.',
  }
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
