import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { goals, priorities, calEvents, habits } = await req.json();

    const goalsText = goals.map((g: {name:string;current:number;target:number;unit:string;status:string}) =>
      `- ${g.name}: ${g.current}/${g.target} ${g.unit} (${g.status})`
    ).join('\n');

    const prioritiesText = priorities.map((p: {title:string;meta:string;tag:string}) =>
      `- [${p.tag}] ${p.title} — ${p.meta}`
    ).join('\n');

    const calText = calEvents.map((e: {time:string;title:string;detail:string}) =>
      `- ${e.time}: ${e.title} (${e.detail})`
    ).join('\n');

    const habitsText = habits.map((h: {name:string;done:number[]}) => {
      const completed = h.done.filter((d: number) => d === 1).length;
      return `- ${h.name}: ${completed}/7 days this week`;
    }).join('\n');

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });

    const prompt = `You are a sharp, motivating personal AI coach generating a morning briefing. Today is ${today}.

Here is the user's current data:

GOALS:
${goalsText}

TODAY'S PRIORITIES:
${prioritiesText}

CALENDAR TODAY:
${calText}

HABIT STREAKS:
${habitsText}

Write a morning briefing in exactly this JSON format:
{
  "headline": "One punchy sentence summarizing the most important insight about today (max 15 words)",
  "summary": "2-3 sentences of honest, direct coaching. Call out what's behind, what conflicts, what needs attention today. Be direct but motivating.",
  "chips": [
    {"text": "short label", "type": "urgent|focus|good|warning"},
    {"text": "short label", "type": "urgent|focus|good|warning"},
    {"text": "short label", "type": "urgent|focus|good|warning"},
    {"text": "short label", "type": "urgent|focus|good|warning"}
  ]
}

Rules:
- headline: brutally honest, specific to their actual data
- summary: reference real goal names, real events, real numbers
- chips: 3-4 chips, each max 5 words, mix of urgent/warning/focus/good
- type "urgent" = deadline or streak at risk
- type "focus" = recommended action
- type "good" = something going well
- type "warning" = conflict or neglected goal
- Return ONLY valid JSON, nothing else`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Briefing error:', err);
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 });
  }
}