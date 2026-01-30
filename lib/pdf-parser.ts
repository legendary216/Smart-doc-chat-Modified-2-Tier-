import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
// We import the specific type for TypeScript safety
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// 1. Configure the Worker
// We use a CDN to avoid complex Next.js Webpack configuration for the worker file.
GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${require('pdfjs-dist/package.json').version}/build/pdf.worker.min.mjs`;

export type PageContent = {
  page: number;
  content: string;
};

export async function parseFile(file: File): Promise<PageContent[]> {
  try {
    // --- STRATEGY A: TEXT FILES ---
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text();
      // For text files, we treat the whole thing as "Page 1"
      return [{ page: 1, content: text }];
    }

    // --- STRATEGY B: PDF FILES ---
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      
      // 2. Load the Document
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const extractedText: PageContent[] = [];

      // 3. The "Page-Aware" Loop
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); //
        const textContent = await page.getTextContent();
        
        // Extract raw strings from the text items
        const pageText = textContent.items
          .map((item) => (item as TextItem).str)
          .join(' ');

        if (pageText.trim().length > 0) {
          extractedText.push({
            page: i,
            content: pageText
          });
        }
      }

      return extractedText;
    }

    throw new Error('Unsupported file type');

  } catch (error) {
    console.error("Error parsing file:", error);
    throw error; // Re-throw so the UI knows it failed
  }
}