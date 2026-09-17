import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const rawUrl = searchParams.get('url')
    const rawName = searchParams.get('name') || 'Lecture-Notes'

    // Clean filename for attachment download
    const safeName = rawName
      .replace(/[^a-zA-Z0-9_\-\. ]/g, '_')
      .replace(/\s+/g, '_')
      .trim()
    const fileName = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`

    let targetUrl = ''

    if (id) {
      targetUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`
    } else if (rawUrl) {
      // Check if it's a Google Drive link
      const gDriveMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
      if (gDriveMatch && gDriveMatch[1]) {
        targetUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(gDriveMatch[1])}&export=download`
      } else if (rawUrl.startsWith('/')) {
        // Relative URL
        const origin = req.nextUrl.origin || 'http://localhost:3000'
        targetUrl = `${origin}${rawUrl}`
      } else {
        targetUrl = rawUrl
      }
    } else {
      return new NextResponse('Missing download target parameter (id or url)', { status: 400 })
    }

    try {
      const upstreamRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/pdf,application/octet-stream,*/*'
        },
        redirect: 'follow',
        cache: 'no-store'
      })

      if (upstreamRes.ok || upstreamRes.status === 206) {
        const contentType = upstreamRes.headers.get('content-type') || 'application/pdf'
        const headers = new Headers()
        headers.set('Content-Type', contentType.includes('html') ? 'application/pdf' : contentType)
        headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
        headers.set('Cache-Control', 'public, max-age=3600')

        const contentLength = upstreamRes.headers.get('content-length')
        if (contentLength) {
          headers.set('Content-Length', contentLength)
        }

        return new Response(upstreamRes.body, {
          status: 200,
          headers
        })
      }
    } catch (fetchErr) {
      console.warn('Direct stream fetch failed, falling back to direct browser redirect:', fetchErr)
    }

    // Graceful fallback: Redirect browser directly to the target URL so user's browser opens or downloads it natively
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      return NextResponse.redirect(new URL(targetUrl))
    }

    return new NextResponse('File could not be downloaded.', { status: 404 })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Download failed'
    console.error('Download note error:', errorMsg)
    return new NextResponse(errorMsg, { status: 500 })
  }
}
