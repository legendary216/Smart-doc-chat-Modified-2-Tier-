"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, FileType, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { parseFile } from '@/lib/pdf-parser'
import { saveDocument } from '@/lib/storage' // <--- Import
import { useAuthStore } from '@/store/useAuthStore' // <--- Need user ID
import { useRouter } from 'next/navigation' // <--- To redirect after success

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState("") // <--- To show "Parsing...", "Embedding..."
  
  const { user } = useAuthStore()
  const router = useRouter()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      if (!user) {
        alert("Please log in first")
        return
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        setFile(selectedFile)
        setIsProcessing(true)

        // 1. Parse
        setStatus("Reading file...")
        const pages = await parseFile(selectedFile)
        console.log("selected file : ",selectedFile);
        
        // 2. Save & Embed
        setStatus(`Embedding ${pages.length} pages... (This may take a moment)`)
        const docId = await saveDocument(selectedFile.name, pages, user.id)

        // 3. Success
        setStatus("Done!")
        // Optional: Redirect to a chat page, or just clear the state
        // router.push(`/chat/${docId}`) 
        console.log("Document fully processed with ID:", docId)
        alert("Upload Complete! Check your Supabase Dashboard.")
        
        setIsProcessing(false)
        setFile(null)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Failed to process file.")
      setFile(null)
      setIsProcessing(false)
    }
  }, [user, router])

  // ... (The rest of the return function remains exactly the same as before)
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
      onDrop,
      accept: { 
        'application/pdf': ['.pdf'],
        'text/plain': ['.txt', '.md']
      }, 
      maxSize: 10 * 1024 * 1024,
      multiple: false,
      disabled: isProcessing
    })

    return (
      <div className="w-full max-w-xl mx-auto mt-10">
        {!file ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
               <div className="p-4 bg-slate-100 rounded-full">
                 <Upload className="h-6 w-6 text-slate-600" />
               </div>
               <h3 className="font-semibold text-lg text-slate-700">
                 {isDragActive ? "Drop the file here" : "Click to upload"}
               </h3>
               <p className="text-sm text-slate-500">PDF or TXT files. (Max 10MB)</p>
            </div>
          </div>
        ) : (
          <Card className="p-4 flex items-center justify-between border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${file.type === 'application/pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
                {file.type === 'application/pdf' ? <FileText className="h-6 w-6 text-red-600" /> : <FileType className="h-6 w-6 text-blue-600" />}
              </div>
              <div>
                <p className="font-medium text-slate-900 truncate max-w-200px">{file.name}</p>
                
                {/* Dynamic Status Message */}
                {isProcessing ? (
                  <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {status}
                  </div>
                ) : (
                  <p className="text-xs text-green-600 mt-1">Ready for Chat</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setFile(null)}
              disabled={isProcessing}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </Card>
        )}
      </div>
    )
}