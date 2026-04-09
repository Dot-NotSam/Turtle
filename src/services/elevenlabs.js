const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // "Adam" voice - free tier

export async function speakText(text) {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      }
    )
    if (!response.ok) throw new Error('ElevenLabs failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.play()
    return audio
  } catch (err) {
    console.error('ElevenLabs error:', err)
    // Fail silently - demo still works without audio
    return null;
  }
}
