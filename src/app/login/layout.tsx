import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login ke sistem manajemen pangkalan Agen LPG',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
