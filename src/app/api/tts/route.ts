import { NextResponse } from 'next/server';
// @ts-ignore
import tiktok from 'tiktok-tts';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, voice } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // --- TikTok TTS (Only) ---
        // Default voice: 'en_us_001' (The famous TikTok lady)
        const tiktokVoice = voice || 'en_us_001';
        let buffer: Buffer;

        try {
            // Using the public reverse proxy for stability and speed
            const tiktokResponse = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    voice: tiktokVoice
                })
            });

            if (!tiktokResponse.ok) {
                const err = await tiktokResponse.json();
                throw new Error(err.error || 'TikTok API failed');
            }

            const data = await tiktokResponse.json();
            if (!data.data) throw new Error('No audio data from TikTok');

            buffer = Buffer.from(data.data, 'base64');

        } catch (e: any) {
            console.error("TikTok Error", e);
            return NextResponse.json(
                { error: "TikTok TTS failed: " + e.message },
                { status: 500 }
            );
        }

        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
                'Content-Disposition': 'attachment; filename="speech.mp3"',
            },
        });

    } catch (error: any) {
        console.error('TTS Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
