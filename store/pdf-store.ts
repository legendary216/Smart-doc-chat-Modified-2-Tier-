import { create } from 'zustand'

interface PDFStore {
  pdfUrl: string | null;
  // We use an object with an ID so every update triggers a change
  navigation: { 
    page: number; 
    id: number; // Random timestamp to force updates
  } | null;
  
  setPdfUrl: (url: string) => void;
  jumpToPage: (page: number) => void;
}

export const usePDFStore = create<PDFStore>((set) => ({
  pdfUrl: null,
  navigation: null,

  setPdfUrl: (url) => set({ pdfUrl: url }),
  
  // Update the ID every time so the subscriber ALWAYS fires
  jumpToPage: (page) => set({ 
    navigation: { page, id: Date.now() } 
  }),
}))