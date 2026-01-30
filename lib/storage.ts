import { supabase } from '@/lib/supabase'
import { PageContent } from '@/lib/pdf-parser'
import { generateEmbedding } from '@/lib/embeddings'

export async function saveDocument(
  fileName: string, 
  pages: PageContent[], 
  userId: string,
  onProgress?: (current: number, total: number) => void // <--- New Callback Parameter
) {
  try {
    console.log("Step 1: Creating Chat Session...")
    
    // 1. Insert into 'chats'
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

    // 2. Process Pages
    console.log(`Step 2: Processing ${pages.length} pages...`)
    
    let successCount = 0

    // Loop with index to track progress
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const embedding = await generateEmbedding(page.content)
      
      const { error: docError } = await supabase
        .from('documents') 
        .insert({
          user_id: userId,
          chat_id: chatId, 
          content: page.content,
          metadata: { pageNumber: page.page }, 
          embedding: embedding
        })

      if (docError) {
        console.error("Error saving document chunk:", docError)
      } else {
        successCount++
      }

      // --- REPORT PROGRESS ---
      if (onProgress) {
        onProgress(i + 1, pages.length)
      }
    }

    console.log(`Finished! Saved ${successCount}/${pages.length} chunks.`)
    return chatId 

  } catch (error) {
    console.error("Error in saveDocument:", error)
    throw error
  }
}