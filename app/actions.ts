'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

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