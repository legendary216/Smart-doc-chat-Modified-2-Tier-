'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function searchContext(query: string, chatId: string) {
  try {
    // This now runs on the server, so the browser stays fast
    const queryVector = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.1, 
      match_count: 5,       
      filter_chat_id: chatId
    })

    if (error) {
      console.error("Supabase RPC Error:", error)
      return []
    }

    return data.map((item: any) => ({
      content: item.content,
      page: item.metadata?.pageNumber ?? 0, 
      similarity: item.similarity
    }))

  } catch (error) {
    console.error("Search failed:", error)
    return []
  }
}


export async function generateAnswer(context: string, question: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
      You are an intelligent document assistant. Your task is to answer the user's question based strictly on the provided context.

      STRICT RULES:
      1. Answer ONLY using the information from the CONTEXT block below.
      2. If the answer is not in the context, state "I cannot find this information in the document."
      3. CITATION RULE: You MUST cite the source page for every fact you mention. Use the format [Page X] at the end of the sentence.
      4. Do not make up information.
      
      CONTEXT:
      ${context}

      USER QUESTION: 
      ${question}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I am having trouble connecting to the AI brain right now.";
  }
}