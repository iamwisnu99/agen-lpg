import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat or lon parameter' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`,
      {
        headers: {
          'Accept-Language': 'id',
          'User-Agent': 'Agen-LPG-App/1.0 (wisnu.bussines99@gmail.com)' // Sesuai dengan kebijakan Nominatim
        }
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Geocode API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch geocode data' }, { status: 500 })
  }
}
