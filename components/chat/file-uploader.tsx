"use client"

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, FileType, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
//import { toast } from 'sonner' // Optional: If you want toast notifications later

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null)

  // 1. The onDrop function with Strict Error Handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    try {
      // Clear any previous errors or state if needed
      
      // We only take the first file (Single File Strategy)
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0]
        console.log("File selected:", selectedFile.name)
        setFile(selectedFile)
      }
    } catch (error) {
      console.error("Error dropping file:", error)
      // In a real app, you might show a toast notification here
      alert("Something went wrong while selecting the file.")
    }
  }, [])

  // 2. The Hook Configuration
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt', '.md'] // Added .txt and .md support
    }, 
    maxSize: 10 * 1024 * 1024, // 10MB Limit
    multiple: false
  })

  return (
    <div className="w-full max-w-xl mx-auto mt-10">
      {!file ? (
        // --- STATE A: DROP ZONE ---
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
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
            <p className="text-sm text-slate-500">
              PDF or TXT files. (Max 10MB)
            </p>
          </div>

          {/* Validation Errors */}
          {fileRejections.length > 0 && (
            <div className="flex items-center gap-2 mt-4 text-red-500 bg-red-50 p-2 rounded-md justify-center">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{fileRejections[0].errors[0].message}</p>
            </div>
          )}
        </div>
      ) : (
        // --- STATE B: FILE SELECTED ---
        <Card className="p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${file.type === 'application/pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
              {/* Dynamic Icon based on file type */}
              {file.type === 'application/pdf' ? (
                <FileText className="h-6 w-6 text-red-600" />
              ) : (
                <FileType className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900 truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setFile(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </Card>
      )}
    </div>
  )
}