import { supabase } from '@/lib/supabase'
import { PageContent } from '@/lib/pdf-parser'
import { generateEmbedding } from '@/lib/embeddings'

// --- 1. NEW HELPER: Text Splitter ---
function splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = start + chunkSize;
    
    // Get the slice
    let chunk = text.slice(start, end);
    
    // Optional: Try to cut at the last period/space to avoid cutting words in half
    // (Keeping it simple for now: strict character slice)
    
    chunks.push(chunk);
    
    // Move the window forward, minus the overlap
    start += (chunkSize - overlap);
  }
  
  return chunks;
}

export async function saveDocument(
  fileName: string, 
  pages: PageContent[], 
  userId: string,
  onProgress?: (current: number, total: number) => void
) {
  try {
    console.log("Step 1: Creating Chat Session...")
    
    const { data: chatData, error: chatError } = await supabase
      .from('chats') 
      .insert({
        user_id: userId,
        title: fileName, 
        file_name: fileName,
      })
      .select()
      .single()

    if (chatError) throw chatError
    const chatId = chatData.id

    console.log(`Step 2: Processing ${pages.length} pages...`)
    
    let totalChunksSaved = 0;

    // --- 2. UPDATED LOOP ---
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      
      // A. Split the page into smaller chunks
      const chunks = splitText(page.content,500,100);

      // B. Process each small chunk
      for (const chunkContent of chunks) {
          const embedding = await generateEmbedding(chunkContent)
          
          const { error: docError } = await supabase
            .from('documents') 
            .insert({
              user_id: userId,
              chat_id: chatId, 
              content: chunkContent, // Save the small chunk, not the whole page
              metadata: { pageNumber: page.page }, 
              embedding: embedding
            })

          if (docError) {
            console.error("Error saving chunk:", docError)
          } else {
            totalChunksSaved++;
          }
      }

      if (onProgress) {
        onProgress(i + 1, pages.length)
      }
    }

    console.log(`Finished! Created ${totalChunksSaved} vector chunks from ${pages.length} pages.`)
    return chatId 

  } catch (error) {
    console.error("Error in saveDocument:", error)
    throw error
  }
}