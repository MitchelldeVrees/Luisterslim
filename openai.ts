import Constants from 'expo-constants';
import OpenAI from 'openai';

const { openaiKey } = (Constants.expoConfig?.extra ?? {}) as { openaiKey: string };

const openai = new OpenAI({ apiKey: openaiKey });

export async function improveTranscript(text: string) {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Je bent een Nederlandse tekst-editor.' },
      { role: 'user', content: `Corrigeer interpunctie en grammatica:\n\n${text}` },
    ],
  });
  return r.choices[0].message.content.trim();
}

export async function summariseTranscript(text: string) {
  const r = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Vat Nederlandse teksten samen.' },
      { role: 'user', content: `Vat dit samen (max 120 woorden):\n\n${text}` },
    ],
  });
  return r.choices[0].message.content.trim();
}
