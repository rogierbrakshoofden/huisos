import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Viewport - Critical for fullscreen and responsive */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        
        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HuisOS" />
        
        {/* Apple Touch Icon (180x180) */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
        
        {/* Android Chrome Support */}
        <meta name="theme-color" content="#66bb6a" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Additional PWA Meta Tags */}
        <meta name="description" content="Family coordination system with liquid glass UI" />
        <meta name="application-name" content="HuisOS" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Fullscreen and Display Mode */}
        <meta name="web-app-capable" content="yes" />
        
        {/* iOS Status Bar */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Prevent zoom on input focus (better UX for fullscreen) */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
