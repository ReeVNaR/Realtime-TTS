# 🎙️ Real-Time Voice Chat Bot

A Next.js application that enables real-time voice conversations using:
- **Speech Recognition** (browser native)
- **Google Gemini AI** (for conversation)
- **TikTok TTS** (for voice responses)

## ⚠️ API Key Issue

The current Gemini API key is not working. The error indicates:
```
[GoogleGenerativeAI Error]: Error fetching... list of available models
```

### How to Fix:

1. **Check your API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Verify the key: `AIzaSyBWqxXGWNPAnEucNPk33KvPyc2r81TQ_2M`
   - Make sure it's enabled for **Generative Language API**

2. **Create a new API key** (if needed):
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the **Generative Language API**
   - Create a new API key under "Credentials"

3. **Update the key** in:
   - `src/app/api/chat/route.ts` (line 14)
   - Or set `GEMINI_API_KEY` in Vercel environment variables

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and start talking!

## 📝 API Endpoints

### POST /api/chat
Sends text to Gemini and returns AI response.

**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "reply": "I'm doing great! How can I help you today?"
}
```

### POST /api/tts
Converts text to speech using TikTok TTS.

**Request:**
```json
{
  "text": "Hello world",
  "voice": "en_us_001"
}
```

**Response:** Audio file (MP3)

## 🎨 Available TikTok Voices

- `en_us_001` - TikTok Lady (default)
- `en_us_006` - Male Voice
- `en_us_ghostface` - Ghostface (Scream)
- `en_us_c3po` - C3PO
- `en_us_chewbacca` - Chewbacca
- `en_uk_001` - British Male
- `en_au_001` - Australian Female

## 🔧 Deploy to Vercel

```bash
npx vercel
```

Set environment variable:
```
GEMINI_API_KEY=your_working_key_here
```

## 📞 Support

If you're still having issues with the Gemini API, you can:
1. Use a different AI provider (OpenAI, Anthropic, etc.)
2. Verify API quota/billing in Google Cloud Console
3. Test the key directly at: https://makersuite.google.com/
