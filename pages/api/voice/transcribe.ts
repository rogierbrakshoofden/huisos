import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPGRAM_API_KEY not configured' })
  }

  try {
    // Collect raw body chunks
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    const audioBuffer = Buffer.concat(chunks)

    if (audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio data received' })
    }

    // Determine content type from request
    const contentType = req.headers['content-type'] || 'audio/webm'

    // Send to Deepgram Nova-3
    const deepgramRes = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-3&language=nl&smart_format=true&punctuate=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': contentType,
        },
        body: audioBuffer,
      }
    )

    if (!deepgramRes.ok) {
      const errorText = await deepgramRes.text()
      console.error('Deepgram error:', deepgramRes.status, errorText)
      return res.status(500).json({ error: `Deepgram error: ${deepgramRes.status}` })
    }

    const data = await deepgramRes.json()
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const confidence =
      data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0

    return res.status(200).json({
      transcript,
      confidence,
      words: data?.results?.channels?.[0]?.alternatives?.[0]?.words || [],
    })
  } catch (err) {
    console.error('Transcription error:', err)
    return res.status(500).json({ error: (err as Error).message })
  }
}
