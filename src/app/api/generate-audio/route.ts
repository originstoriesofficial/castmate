/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { text, character } = await req.json();
    console.log(text, character);

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid text.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing ElevenLabs API key.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ✂️ Remove text in parentheses before TTS
    const cleanText = text.replace(/\([^)]*\)/g, '').trim();

    // Determine character gender using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that classifies whether a name is typically male or female.',
        },
        {
          role: 'user',
          content: `Is the name "${character}" typically male or female? Just answer "male" or "female".`,
        },
      ],
    });

    const gender = completion.choices[0]?.message?.content?.toLowerCase().trim();
    console.log(`Detected gender: ${gender}`);

    const voice_id =
      gender === 'female'
        ? 'EXAVITQu4vr4xnSDxMaL' // Female voice
        : 'JBFqnCBsd6RMkjVDRZzb'; // Male (default fallback)

    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate audio from ElevenLabs.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const audio = await ttsResponse.arrayBuffer();
    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('Audio generation error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate audio. Please try again later.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
