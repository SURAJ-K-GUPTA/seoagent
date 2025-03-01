import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

// Create an OpenAI API client
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export const runtime = 'edge';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Ask OpenAI for a streaming completion
  const response = await openai.createCompletion({
    model: 'gpt-3.5-turbo-instruct',
    stream: true,
    temperature: 0.6,
    max_tokens: 300,
    prompt: prompt,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  // Respond with the stream
  return new StreamingTextResponse(stream);
} 