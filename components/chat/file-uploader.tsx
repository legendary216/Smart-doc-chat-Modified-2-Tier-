"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, FileType, CheckCircle2, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { parseFile } from '@/lib/pdf-parser'
import { saveDocument } from '@/lib/storage'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0) // <--- New State
  const [status, setStatus] = useState("") 
  
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
        setProgress(0) // Reset progress

        // 1. Parse
        setStatus("Reading file...")
        const pages = await parseFile(selectedFile)
        
        // 2. Save & Embed (With Progress Callback)
        setStatus("Preparing AI...")
        
        const chatId = await saveDocument(selectedFile.name, pages, user.id, (current, total) => {
           // --- PROGRESS CALLBACK ---
           const percentage = Math.round((current / total) * 100)
           setProgress(percentage)
           setStatus(`Processing Page ${current} of ${total}...`)
        })

        // 3. Success
        setStatus("Done! Redirecting...")
        setProgress(100)
        
        // Short delay so user sees the "100%" before redirect
        setTimeout(() => {
             router.push(`/chat/${chatId}`) 
        }, 500)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Failed to process file.")
      setFile(null)
      setIsProcessing(false)
    }
  }, [user, router])

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
          <Card className="p-6 border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${file.type === 'application/pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {file.type === 'application/pdf' ? <FileText className="h-6 w-6 text-red-600" /> : <FileType className="h-6 w-6 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 truncate max-w-200px">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
               </div>
               
               <button 
                onClick={() => setFile(null)}
                disabled={isProcessing}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* --- PROGRESS BAR SECTION --- */}
            {isProcessing && (
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>{status}</span>
                    <span>{progress}%</span>
                 </div>
                 
                 {/* The Bar */}
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }} 
                    />
                 </div>
              </div>
            )}

            {!isProcessing && status === "Done! Redirecting..." && (
               <div className="flex items-center gap-2 text-green-600 text-sm font-medium mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Upload Complete!
               </div>
            )}
          </Card>
        )}
      </div>
    )
}