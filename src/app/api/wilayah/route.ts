import { NextRequest, NextResponse } from 'next/server'
import wilayahData from '@/data/wilayah.json'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.toLowerCase() || ''

    let results = wilayahData

    if (query) {
      results = wilayahData.filter((w: string) => w.toLowerCase().includes(query))
    }

    // Limit to 50 to avoid massive DOM if the query is empty
    return NextResponse.json({ success: true, data: results.slice(0, 50) })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Gagal mengambil data wilayah' }, { status: 500 })
  }
}
