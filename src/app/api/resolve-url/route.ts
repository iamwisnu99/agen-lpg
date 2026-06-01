import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    // Follow redirects server-side to resolve short URLs (maps.app.goo.gl, goo.gl/maps, etc.)
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
      },
    })

    const finalUrl = res.url
    return NextResponse.json({ resolvedUrl: finalUrl })
  } catch (error) {
    console.error('Resolve URL Error:', error)
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 500 })
  }
}
