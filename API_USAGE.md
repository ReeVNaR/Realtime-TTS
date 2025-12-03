# Chatterbox API Documentation

Your API is deployed and accessible globally.

**Base URL:** `https://startts.vercel.app`

---

## 1. Chat API
**Endpoint:** `POST /api/chat`
**URL:** `https://startts.vercel.app/api/chat`

Generates a text response from the AI (Gemini 2.5 Flash) based on the user's message. The response is streamed.

### Request Body (JSON)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `message` | `string` | Yes | The user's input message. |

### Example Usage (cURL)
```bash
curl -X POST https://startts.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what is Starshift?"}'
```

### Example Usage (JavaScript/Fetch)
```javascript
const response = await fetch('https://startts.vercel.app/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' })
});

// Note: Response is a stream
const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

---

## 2. Text-to-Speech (TTS) API
**Endpoint:** `POST /api/tts`
**URL:** `https://startts.vercel.app/api/tts`

Converts text into speech using TikTok's TTS engine. Returns an MP3 audio file.

### Request Body (JSON)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `text` | `string` | Yes | The text to convert to speech. |
| `voice` | `string` | No | Voice ID (default: `en_us_001`). See list below. |

### Available Voices
- `en_us_001` (Female / TikTok Lady)
- `en_us_006` (Male)
- `en_us_ghostface` (Ghostface)
- `en_us_chewbacca` (Chewbacca)
- `en_us_c3po` (C-3PO)

### Example Usage (cURL)
```bash
curl -X POST https://startts.vercel.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world, this is a test.", "voice": "en_us_001"}' \
  --output speech.mp3
```

### Example Usage (JavaScript/Fetch)
```javascript
const response = await fetch('https://startts.vercel.app/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    text: 'Welcome to Starshift.', 
    voice: 'en_us_001' 
  })
});

const blob = await response.blob();
const audioUrl = URL.createObjectURL(blob);
const audio = new Audio(audioUrl);
audio.play();
```

---

## Integration with n8n

To use this in **n8n**, use the **HTTP Request** node:

1.  **Method**: `POST`
2.  **URL**: `https://startts.vercel.app/api/chat` (or `/api/tts`)
3.  **Authentication**: None
4.  **Body Content Type**: JSON
5.  **Body Parameters**:
    *   For Chat: `{ "message": "Your input text" }`
    *   For TTS: `{ "text": "Your text here", "voice": "en_us_001" }`
