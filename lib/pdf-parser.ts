// lib/pdf-parser.ts

export type PageContent = {
  page: number;
  content: string;
};

export async function parseFile(file: File): Promise<PageContent[]> {
  try {
    // --- STRATEGY A: TEXT FILES ---
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text();
      return [{ page: 1, content: text }];
    }

    // --- STRATEGY B: PDF FILES ---
    if (file.type === 'application/pdf') {
      // 1. Dynamic Import (Fixes "DOMMatrix is not defined")
      // We only import PDF.js here, ensuring it ONLY runs in the browser.
      const pdfjs = await import('pdfjs-dist');
      const { getDocument, GlobalWorkerOptions } = pdfjs;

      // 2. Configure Worker
      // We use the version exported by the library itself to ensure compatibility
      GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      
      // 3. Load the Document
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const extractedText: PageContent[] = [];

      // 4. The "Page-Aware" Loop
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract raw strings from the text items
        const pageText = textContent.items
          .map((item: any) => item.str)
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
    throw error;
  }
}