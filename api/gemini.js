import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Initialize the Gemini client using your secret API key
// Vercel will automatically pull this from your Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    // 2. Security check: Only allow POST requests from your frontend
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
    }

    try {
        // 3. Extract the text and audio from the incoming request body
        // 'text' is the user's typed message
        // 'audio' is an optional base64 encoded string of a voice recording
        const { text, audio } = req.body;

        if (!text && !audio) {
            return res.status(400).json({ error: 'Please provide either text or audio.' });
        }

        // 4. Select the model. Gemini 1.5 Flash is incredibly fast and supports multimodal (text + audio) inputs.
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // 5. Prepare the data array to send to Gemini
        const parts = [];

        // If the user typed a text message, add it to the parts array
        if (text) {
            parts.push({ text: text });
        }

        // If the user spoke a voice message, add the audio data to the parts array
        if (audio) {
            parts.push({
                inlineData: {
                    mimeType: 'audio/webm', // This matches standard browser audio recording formats
                    data: audio,            // The base64 audio string sent from your frontend
                },
            });
        }

        // 6. Send the combined text/audio to Gemini and wait for the response
        const result = await model.generateContent(parts);
        const response = await result.response;
        const aiText = response.text();

        // 7. Send Gemini's generated answer back to your frontend
        return res.status(200).json({ 
            success: true, 
            message: aiText 
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to generate response from Gemini. Please check your API key and setup.' 
        });
    }
}
