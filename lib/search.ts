import { supabase } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'

export type SearchResult = {
  content: string;
  page: number;
  similarity: number;
}

export async function searchContext(query: string, chatId: string): Promise<SearchResult[]> {
  try {
    console.log("1. Generating embedding for query:", query)
    const queryVector = await generateEmbedding(query)

    // 2. Call Supabase
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_threshold: 0.1, // Lowered threshold to ensure we get results
      match_count: 5,
      filter_chat_id: chatId
    })

    if (error) {
      console.error("Supabase RPC Error:", error)
      return []
    }

    // --- DEBUG LOG: This will show us why Page is undefined ---
    console.log("3. RAW SUPABASE DATA:", data) 

    // 4. Safe Mapping
    return data.map((item: any) => ({
      content: item.content,
      // We check multiple possible casing styles to catch the error
      page: item.metadata?.pageNumber ?? 0,
      similarity: item.similarity
    }))

  } catch (error) {
    console.error("Search failed:", error)
    return []
  }
}