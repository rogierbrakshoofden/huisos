import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/manifest+json')
  res.setHeader('Cache-Control', 'public, max-age=3600')

  res.status(200).json({
    name: 'HuisOS',
    short_name: 'HuisOS',
    description: 'Family coordination system with liquid glass UI',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f172a',
    theme_color: '#66bb6a',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/apple-touch-icon-180x180.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/badge-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'badge',
      },
    ],
    categories: ['family', 'productivity'],
    screenshots: [
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'wide',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        form_factor: 'narrow',
      },
    ],
  })
}
