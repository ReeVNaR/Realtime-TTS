import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // n8n Webhook URL
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://ranveer15156.app.n8n.cloud/webhook/bee2b92b-9610-4da5-8962-450ad2aab89b';

        console.log('Sending message to n8n:', n8nWebhookUrl);

        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chatInput: message }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('n8n Webhook Error:', errorText);
            throw new Error(`n8n webhook failed with status ${response.status}`);
        }

        // Handle n8n response
        // n8n usually returns a JSON array or object. We need to extract the text response.
        const responseData = await response.json();
        console.log('n8n Response:', responseData);

        let botResponse = '';

        // Parsing logic to find the text in the n8n response
        if (typeof responseData === 'string') {
            botResponse = responseData;
        } else if (Array.isArray(responseData) && responseData.length > 0) {
            // n8n often returns an array of items
            const item = responseData[0];
            botResponse = item.output || item.text || item.message || item.content || JSON.stringify(item);
        } else if (typeof responseData === 'object') {
            botResponse = responseData.output || responseData.text || responseData.message || responseData.content || JSON.stringify(responseData);
        } else {
            botResponse = "I received a response from the brain, but I couldn't understand it.";
        }

        // Create a stream to send the text back to the frontend
        // This maintains compatibility with the frontend's streaming expectation
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder();
                controller.enqueue(encoder.encode(botResponse));
                controller.close();
            },
        });

        return new NextResponse(stream);

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Internal Server Error',
                details: error.toString()
            },
            { status: 500 }
        );
    }
}
