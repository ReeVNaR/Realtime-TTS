# Chatterbox API Usage Guide

You can now use your deployed Chatterbox application as a backend API for your other websites.

## Base URL
Once deployed (e.g., to Vercel), your Base URL will be:
`https://your-project-name.vercel.app`

## Endpoints

### 1. Chat Endpoint
**URL**: `/api/chat`
**Method**: `POST`
**Content-Type**: `application/json`

**Body**:
```json
{
  "message": "Hello, how are you?"
}
```

**Response**:
Returns a stream of text.

**Example Usage (JavaScript/Frontend):**
```javascript
async function sendChat(message) {
  const response = await fetch('https://your-project-name.vercel.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    console.log('Received chunk:', chunk);
    // Append chunk to your UI
  }
}
```

### 2. Text-to-Speech (TTS) Endpoint
**URL**: `/api/tts`
**Method**: `POST`
**Content-Type**: `application/json`

**Body**:
```json
{
  "text": "Hello world",
  "voice": "en_us_006" 
}
```
*Available voices: `en_us_001` (Female), `en_us_006` (Male), etc.*

**Response**:
Returns binary audio data (MP3).

**Example Usage:**
```javascript
async function playTTS(text) {
  const response = await fetch('https://your-project-name.vercel.app/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice: 'en_us_006' })
  });

  if (response.ok) {
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play();
  }
}
```

## CORS Configuration
CORS has been enabled in `next.config.ts` to allow requests from any origin (`*`). This means you can call these endpoints from `localhost`, `your-other-site.com`, etc.
