import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('http://100.125.97.33:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: `Generate a morning briefing. Respond ONLY with valid JSON, no extra text. Format:
{
  "summary": "A short motivating briefing under 100 words",
  "chips": [
    { "type": "focus", "text": "Main focus for today" },
    { "type": "tip", "text": "One motivational tip" },
    { "type": "priority", "text": "Top priority task" }
  ]
}`,
        stream: false,
      }),
    });

    if (!response.ok) throw new Error('Ollama request failed');

    const data = await response.json();
    const parsed = JSON.parse(data.response);
    return NextResponse.json(parsed);

  } catch (_error) {
    console.error('Ollama error:', _error);
    return NextResponse.json(
      { error: 'Could not generate briefing.' },
      { status: 500 }
    );
  }
}
