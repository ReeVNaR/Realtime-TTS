import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Gemini 2.5 Flash API Key
        const apiKey = 'AIzaSyAMZDqH0apkLM-laDWIhNT43JjJJm5npyo';
        // const apiKey = process.env.GEMINI_API_KEY;
        console.log('Using Hardcoded API Key');

        if (!apiKey) {
            console.error('Gemini API Key is missing');
            return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.0-flash as requested
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are the official AI assistant for Starshift, a cutting-edge platform that builds conversion-focused websites powered by AI voice agents and automations. You must answer only questions related to Starshift.

Starshift turns any business website into a 24/7 AI sales and support assistant that greets visitors, answers FAQs, books customers, captures leads, and routes them into business tools.

Starshift offers:

AI Voice Concierge that speaks to visitors, answers questions, collects details, and hands off conversations when needed.

Conversion-optimized, mobile-first website design with clear CTAs for booking, calling, or getting quotes.

Automation Hub that sends leads/bookings to tools like Google Sheets, Gmail, CRMs, and messaging APIs, with follow-ups and workflows.

Lead & booking capture, centralized lead dashboard, integrations, configurable AI responses, and complete done-for-you setup.

Designed for restaurants, salons, clinics, agencies, consultants, coaches, and other service-based businesses.

Starshift builds websites that don’t just look good — they talk, guide, and convert visitors into customers.

If a user asks about anything unrelated to Starshift, politely decline and guide them back to Starshift.

Always reply briefly and naturally in 2 sentences.

User said: "${message}"`;

        console.log('Sending prompt to Gemini...');
        const result = await model.generateContentStream(prompt);

        // Create a stream from the Gemini response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        if (chunkText) {
                            controller.enqueue(encoder.encode(chunkText));
                        }
                    }
                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.error(error);
                }
            },
        });

        return new NextResponse(stream);

    } catch (error: any) {
        console.error('Gemini Error Full:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));

        // Check for rate limit error
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
            return NextResponse.json(
                {
                    error: 'API rate limit exceeded. Please wait a moment and try again.',
                    details: 'The Gemini API has reached its rate limit. Try again in a few seconds.'
                },
                { status: 429 }
            );
        }

        return NextResponse.json(
            {
                error: error.message || 'Internal Server Error',
                details: error.toString(),
                statusCode: error.status || 500
            },
            { status: error.status || 500 }
        );
    }
}
