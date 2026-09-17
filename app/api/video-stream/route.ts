import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('Missing Google Drive file ID', { status: 400 })
    }

    // Google Drive direct media export URL
    const upstreamUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download`

    // Forward range header if requested by video player
    const clientRange = req.headers.get('range')
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    if (clientRange) {
      fetchHeaders['Range'] = clientRange
    }

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers: fetchHeaders,
      redirect: 'follow',
      cache: 'no-store'
    })

    // If Google Drive returns an error or HTML (such as download quota or private file)
    const contentType = upstreamRes.headers.get('content-type') || ''
    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(`Upstream error: ${upstreamRes.statusText}`, { status: upstreamRes.status })
    }

    // If Google Drive returns HTML instead of video (e.g. large file confirmation screen)
    if (contentType.includes('text/html')) {
      // Try to check if there is a confirmation token in cookies or HTML
      const htmlText = await upstreamRes.text()
      const confirmMatch = htmlText.match(/confirm=([0-9A-Za-z_-]+)/)
      if (confirmMatch && confirmMatch[1]) {
        const confirmedUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=${confirmMatch[1]}`
        const confirmedRes = await fetch(confirmedUrl, {
          method: 'GET',
          headers: fetchHeaders,
          cache: 'no-store'
        })
        if (confirmedRes.ok || confirmedRes.status === 206) {
          const resHeaders = new Headers()
          resHeaders.set('Content-Type', confirmedRes.headers.get('content-type') || 'video/mp4')
          resHeaders.set('Accept-Ranges', 'bytes')
          resHeaders.set('Access-Control-Allow-Origin', '*')
          if (confirmedRes.headers.get('content-range')) {
            resHeaders.set('Content-Range', confirmedRes.headers.get('content-range')!)
          }
          if (confirmedRes.headers.get('content-length')) {
            resHeaders.set('Content-Length', confirmedRes.headers.get('content-length')!)
          }
          return new Response(confirmedRes.body, {
            status: confirmedRes.status,
            headers: resHeaders,
          })
        }
      }
      return new NextResponse('Google Drive file requires user authorization or is unavailable', { status: 403 })
    }

    // Standard video stream response with partial content support
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', contentType.includes('video') ? contentType : 'video/mp4')
    responseHeaders.set('Accept-Ranges', 'bytes')
    responseHeaders.set('Access-Control-Allow-Origin', '*')

    const contentRange = upstreamRes.headers.get('content-range')
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange)
    }

    const contentLength = upstreamRes.headers.get('content-length')
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength)
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Streaming failed'
    console.error('Video stream proxy error:', errorMsg)
    return new NextResponse(errorMsg, { status: 500 })
  }
}
