import Constants from 'expo-constants';
import OpenAI from 'openai';

const { openaiKey } = (Constants.expoConfig?.extra ?? {}) as { openaiKey: string };

const openai = new OpenAI({ apiKey: openaiKey });
const {
  GROK_API_KEY: grokApiKey,
  GROK_BASE_URL: grokBaseUrl,
} = (Constants.expoConfig?.extra ?? {}) as {
  GROK_API_KEY: string;
  GROK_BASE_URL: string;
};

const grokClient = new OpenAI({
  apiKey: grokApiKey,
  baseURL: grokBaseUrl,
});

export async function summarizeTranscriptWithGrok(
  fullText: string,
  detectedLang: string
): Promise<{
  summary: string;
  actionItems: string;
  qna: { question: string; answer: string }[];
}> {
  // Build the user prompt, embedding the transcript
  const userPrompt = `
%${fullText}%
Act as a professional summarizer. Create a concise and comprehensive summary of the text 
enclosed in %% above, while adhering to the guidelines enclosed in [ ] below.

Guidelines:

[
Create a summary in the language that the text is in (detected language = ${detectedLang}), 
detailed, thorough, in-depth yet concise. Cover all key points and examples, avoid repetition. 
Length ~0.4–0.6× original. Organize with clear paragraphs and headings.
Include an array "qna" of all questions found in the original text with their answers:
[
  {
    "question": "Full question here",
    "answer": "Full answer here"
  },
  …
]
Return **only** valid JSON in this shape:
{
  "summary": string,
  "actionItems": string,
  "qna": [
    { "question": string, "answer": string },
    …
  ]
}
]
`.trim();

  // Call Grok
  const completion = await grokClient.chat.completions.create({
    model: 'grok-3-mini',
    messages: [
      {
        role: 'system',
        content: 'Je bent een transcript-samenvatter die alleen JSON retourneert.',
      },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.5,
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() ?? '';
  console.log('Grok response raw JSON:', raw);

  // Parse and return
  try {
    const parsed = JSON.parse(raw);
    return {
      summary: parsed.summary,
      actionItems: parsed.actionItems,
      qna: parsed.qna,
    };
  } catch (err: any) {
    console.error('Failed to parse Grok JSON:', err, raw);
    throw new Error('Invalid JSON response from Grok');
  }
}
