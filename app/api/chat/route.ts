import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { searchContext } from '@/app/actions';

export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. Extract messages and chatId (sent via the body in frontend)
  const { messages, chatId }: { messages: UIMessage[], chatId: string } = await req.json();

  // 2. Get the last user message text
  // Since messages now have 'parts', we extract the text part
  const lastMessage = messages[messages.length - 1];
  const lastUserText = lastMessage.parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('');

  // 3. RAG Search
  const contextResults = await searchContext(lastUserText, chatId);
  const contextText = contextResults.map((c: any) => c.content).join('\n\n');

  // 4. Setup Supabase Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 5. Generate Stream
  const result = streamText({
    model: google('gemini-2.5-flash-lite'),
    system: `You are a helpful assistant. Use this context to answer: \n\n${contextText}`,
    // Use the converter from your 'Stream Protocols' doc
    messages: await convertToModelMessages(messages),
    
    // 6. Save to DB when finished
    onFinish: async ({ text }) => {
      try {
        await supabaseAdmin.from('messages').insert({
          chat_id: chatId,
          role: 'user',
          content: lastUserText
        });

        await supabaseAdmin.from('messages').insert({
          chat_id: chatId,
          role: 'assistant',
          content: text
        });
      } catch (e) {
        console.error("Failed to save messages:", e);
      }
    },
  });

  // 7. Return using the specific method for the UI SDK
  return result.toUIMessageStreamResponse();
}