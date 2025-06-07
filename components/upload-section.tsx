"use client"

import React, { useState, useRef, useEffect } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { useSession } from "@/lib/session-context"

export default function UploadSection() {
  const { setSessionId, isUploading, setIsUploading, setUploadedFilePaths, uploadError, setUploadError } = useSession()

  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset progress when isUploading changes to false
  useEffect(() => {
    if (!isUploading) {
      setUploadProgress(0)
    }
  }, [isUploading])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): string | null => {
    if (!file.name.endsWith(".zip")) {
      return "INVALID FILE TYPE. ONLY .ZIP FILES ARE ALLOWED."
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB
      return "FILE TOO LARGE. MAXIMUM SIZE IS 100MB."
    }

    return null
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const validationError = validateFile(file)

    if (validationError) {
      setUploadError(validationError)
      return
    }

    setUploadError(null)
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Step 1: Read file as base64
      const fileBuffer = await file.arrayBuffer()
      const base64File = Buffer.from(fileBuffer).toString('base64')

      // Generate a proper UUID for the session
      const currentSessionId = crypto.randomUUID()

      // Step 2: Index the uploaded code directly
      const indexResponse = await fetch('/api/index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          fileContentBase64: base64File
        })
      })

      if (!indexResponse.ok) {
        const errorData = await indexResponse.json()
        throw new Error(errorData.error || 'Failed to index codebase')
      }

      const indexResult = await indexResponse.json()
      console.log("Code indexing complete:", indexResult)

      // Update session state
      setSessionId(currentSessionId)
      setUploadedFilePaths(indexResult.fileCount ? [`${indexResult.fileCount} files processed`] : [])
      setUploadProgress(100)

    } catch (error: any) {
      console.error("Indexing failed:", error)
      setUploadError(error.message || "An unexpected error occurred during indexing.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black uppercase text-black mb-4 font-mono tracking-tight">UPLOAD YOUR CODEBASE</h2>
        <p className="text-black font-bold text-lg">UPLOAD A .ZIP FILE CONTAINING YOUR CODEBASE TO GET STARTED.</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 text-sm font-bold text-black">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center mr-2 font-mono font-black">
              1
            </div>
            <span className="uppercase">UPLOAD .ZIP</span>
          </div>
          <div className="h-1 bg-black w-8"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center mr-2 font-mono font-black">
              2
            </div>
            <span className="uppercase">AI PROCESSES YOUR CODE</span>
          </div>
          <div className="h-1 bg-black w-8"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center mr-2 font-mono font-black">
              3
            </div>
            <span className="uppercase">ASK ANYTHING</span>
          </div>
        </div>
      </div>

      {!isUploading ? (
        <div
          className={`border-4 border-dashed border-black p-8 text-center bg-white transition-transform duration-300 ${
            dragActive ? "transform -translate-y-1 shadow-[8px_8px_0px_#ff3f3f]" : "shadow-[6px_6px_0px_#000000]"
          } ${uploadError ? "border-[#ff3f3f]" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input ref={fileInputRef} type="file" accept=".zip" onChange={handleChange} className="hidden" />

          <div className="flex flex-col items-center justify-center">
            <Upload
              className={`w-16 h-16 mb-4 ${
                dragActive ? "text-[#ff3f3f]" : "text-black"
              } ${uploadError ? "text-[#ff3f3f]" : ""}`}
            />

            <p className="text-2xl font-black mb-2 uppercase font-mono">
              {dragActive ? "DROP YOUR FILE HERE" : "DRAG & DROP YOUR CODEBASE HERE"}
            </p>

            <p className="text-black font-bold mb-4 uppercase">OR</p>

            <Button
              onClick={handleButtonClick}
              className="bg-white border-4 border-black text-black font-black uppercase text-lg px-8 py-4 h-auto hover:bg-[#e0e0e0] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#000000]"
            >
              <Upload className="w-6 h-6 mr-2" />
              BROWSE FILES
            </Button>

            <p className="text-sm font-bold mt-4 uppercase">ONLY .ZIP FILES UP TO 100MB ARE SUPPORTED</p>

            {uploadError && (
              <div className="mt-4 bg-[#ff3f3f] border-4 border-black p-4 text-white font-black uppercase flex items-center shadow-[4px_4px_0px_#000000]">
                <X className="w-6 h-6 mr-2" />
                {uploadError}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border-4 border-black p-8 bg-white shadow-[6px_6px_0px_#000000]">
          <div className="flex flex-col items-center">
            <div className="w-full bg-white border-4 border-black mb-4 h-8 relative overflow-hidden">
              <div
                className="h-full bg-[#00ff88] transition-all duration-300 flex items-center justify-center"
                style={{ width: `${uploadProgress}%` }}
              >
                <span className="text-black font-black text-sm uppercase font-mono">{Math.round(uploadProgress)}%</span>
              </div>
            </div>
            <p className="text-black font-black uppercase font-mono">
              {uploadProgress < 100
                ? `UPLOADING & INDEXING YOUR CODEBASE — ${Math.round(uploadProgress)}%`
                : "PROCESSING COMPLETE! READY TO EXPLORE."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
