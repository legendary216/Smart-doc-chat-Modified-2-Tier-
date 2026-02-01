"use client"
import { useEffect, useRef, useState } from 'react'
import WebViewer, { WebViewerInstance } from '@pdftron/webviewer'
import { usePDFStore } from '@/store/pdf-store'

export default function PDFViewer() {
  const viewerDiv = useRef<HTMLDivElement>(null)
  const [instance, setInstance] = useState<WebViewerInstance | null>(null)
  const isInitialized = useRef(false)

  const { pdfUrl, navigation } = usePDFStore()

  // 1. Initialize Apryse
  useEffect(() => {
    if (!viewerDiv.current || isInitialized.current) return
    isInitialized.current = true

    WebViewer(
      {
        path: '/lib', 
        licenseKey: '', 
        initialDoc: undefined, // Wait for manual load
      },
      viewerDiv.current
    ).then((inst) => {
      setInstance(inst)
      
      // ✅ Enable Dark Mode to match your app
      inst.UI.setTheme('dark') 
      
      // Optional: Hide clutter (Print button, etc.)
      inst.UI.disableElements(['printButton', 'downloadButton']) 
    })
  }, []) 

  // 2. Handle Page Jumps
  useEffect(() => {
    if (instance && navigation) {
      const { documentViewer } = instance.Core
      documentViewer.setCurrentPage(navigation.page, true)
    }
  }, [instance, navigation])

  // 3. Load Document
 useEffect(() => {
    if (instance && pdfUrl) {
      instance.UI.loadDocument(pdfUrl, { 
        filename: 'document.pdf',
        rangeRequests: false 
      } as any) // <--- Add "as any" here to silence TypeScript
    }
  }, [instance, pdfUrl])
  return (
    <div className="h-full w-full bg-slate-950" ref={viewerDiv}></div>
  )
}