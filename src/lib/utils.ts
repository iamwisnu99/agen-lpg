import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: idLocale })
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: idLocale })
}

export function formatTimeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: idLocale })
}

export function formatPhone(phone: string): string {
  // Format phone number: 08xx-xxxx-xxxx
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('62')) {
    return '+62 ' + cleaned.slice(2).replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function extractCoordsFromGoogleMaps(url: string): { lat: number; lng: number } | null {
  try {
    // Format: https://maps.google.com/?q=-6.1751,106.7650
    const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
    }

    // Format: https://www.google.com/maps/@-6.1751,106.7650,17z
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
    }

    // Format: https://goo.gl/maps/... (short URL - need redirect, return null)
    // Format: /maps/place/.../@-6.1751,106.7650,17z
    const placeMatch = url.match(/\/maps\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) }
    }

    // Format: ll=-6.1751,106.7650
    const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (llMatch) {
      return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) }
    }

    return null
  } catch {
    return null
  }
}

export function generateRegistrationId(): string {
  const prefix = 'CWS'
  const year = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `${prefix}-${year}-${random}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function isValidCoord(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}
