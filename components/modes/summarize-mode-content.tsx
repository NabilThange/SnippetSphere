"use client"

import { useState, useEffect } from "react"
import { FileText, RefreshCw, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import CodeSnippetDisplay from "@/components/code-snippet-display"
import { apiClient } from "@/lib/api-client"
import { useSession } from "@/lib/session-context"

export default function SummarizeModeContent({ sessionId }: { sessionId: string }) {
  const { uploadedFilePaths } = useSession()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [summary, setSummary] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showFileList, setShowFileList] = useState(false)
  const [summarizeError, setSummarizeError] = useState<string | null>(null)

  useEffect(() => {
    // Reset selected file and summary if session changes or files change
    setSelectedFile(null)
    setSummary("")
    setSummarizeError(null)
    setIsGenerating(false)
  }, [sessionId, uploadedFilePaths])

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath)
    setShowFileList(false) // Close dropdown
    await generateSummary(filePath)
  }

  const handleRegenerateSummary = async () => {
    if (selectedFile) {
      await generateSummary(selectedFile)
    }
  }

  const generateSummary = async (filePath: string) => {
    setIsGenerating(true)
    setSummary("")
    setSummarizeError(null)

    try {
      const response = await apiClient.summarizeText(sessionId, filePath)
      if (response.success) {
        setSummary(response.summary)
      } else {
        setSummarizeError(response.message || "Failed to generate summary.")
      }
    } catch (error: any) {
      console.error("Error generating summary:", error)
      setSummarizeError(error.message || "An unexpected error occurred during summarization.")
    } finally {
      setIsGenerating(false)
    }
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] max-w-2xl">
          <p className="text-black font-black uppercase text-xl font-mono px-8">
            PLEASE UPLOAD A CODEBASE TO GENERATE SUMMARIES.
          </p>
        </div>
      </div>
    )
  }

  if (uploadedFilePaths.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] max-w-2xl">
          <p className="text-black font-black uppercase text-xl font-mono px-8">
            NO UPLOADED FILES FOUND FOR THIS SESSION. PLEASE UPLOAD AND INDEX CODE FIRST.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-black font-mono tracking-tight">FILE SUMMARIES</h2>
        <div className="bg-[#00ff88] border-2 border-black px-3 py-1 text-black font-black text-sm uppercase">
          {uploadedFilePaths.length} FILES
        </div>
      </div>

      {/* File Selector */}
      <div className="relative">
        <Button
          onClick={() => setShowFileList(!showFileList)}
          className="w-full bg-white border-4 border-black text-black font-black uppercase text-lg px-6 py-4 h-auto hover:bg-[#e0e0e0] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[4px_4px_0px_#000000] hover:shadow-[2px_2px_0px_#000000] flex items-center justify-between"
        >
          <div className="flex items-center">
            <FileText className="w-6 h-6 mr-3" />
            {selectedFile ? `SELECTED: ${selectedFile.split('/').pop()}` : "SELECT A FILE TO SUMMARIZE"}
          </div>
          <ChevronDown className={`w-6 h-6 transition-transform ${showFileList ? "rotate-180" : ""}`} />
        </Button>

        {showFileList && (
          <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white border-4 border-black shadow-[6px_6px_0px_#000000] max-h-64 overflow-y-auto">
            {uploadedFilePaths.map((filePath, index) => (
              <button
                key={index}
                onClick={() => handleFileSelect(filePath)}
                className="w-full text-left p-4 border-b-2 border-black hover:bg-[#e0e0e0] transition-colors font-bold"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black uppercase text-black">{filePath.split('/').pop()}</div>
                    <div className="text-sm text-black opacity-70">{filePath}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Code Snippet Display - Simplified to only show filename */}
      {selectedFile && (
        <CodeSnippetDisplay
          fileName={selectedFile.split('/').pop() || selectedFile}
          code="// Code snippet not available for summarization directly via this route\n// Select another mode or feature to view the full code."
          language="plaintext" // Or infer based on extension if possible
        />
      )}

      {/* Summary Display */}
      {selectedFile && (
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_#000000]">
          <div className="border-b-4 border-black p-4 flex items-center justify-between">
            <h3 className="font-black uppercase text-black text-xl font-mono">
              SUMMARY OF {selectedFile.split('/').pop()?.toUpperCase()}
            </h3>
            <Button
              onClick={handleRegenerateSummary}
              disabled={isGenerating}
              className="bg-[#00ff88] border-2 border-black text-black font-black uppercase px-4 py-2 h-auto hover:bg-[#00e077] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-black animate-spin mr-2"></div>
                  GENERATING...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  REGENERATE
                </>
              )}
            </Button>
          </div>

          <div className="p-6">
            {isGenerating ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-black bg-white mx-auto mb-4 flex items-center justify-center">
                  <div className="w-6 h-6 bg-black animate-pulse"></div>
                </div>
                <p className="text-[#00ff88] font-black uppercase text-lg font-mono animate-pulse">
                  GENERATING SUMMARY...
                </p>
              </div>
            ) : summarizeError ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-black bg-white mx-auto mb-4 flex items-center justify-center">
                  <X className="w-6 h-6 text-[#ff3f3f]" />
                </div>
                <p className="text-[#ff3f3f] font-black uppercase text-lg font-mono">
                  ERROR: {summarizeError.toUpperCase()}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <pre className="text-black font-bold whitespace-pre-wrap leading-relaxed font-mono text-sm">
                  {summary || "NO SUMMARY AVAILABLE. SELECT A FILE AND CLICK REGENERATE."}
                </pre>
              </ScrollArea>
            )}
          </div>
        </div>
      )}

      {!selectedFile && (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <FileText className="w-16 h-16 text-black mx-auto mb-4" />
            <h3 className="text-2xl font-black uppercase text-black font-mono tracking-tight mb-2">
              SELECT A FILE TO SUMMARIZE
            </h3>
            <p className="text-black font-bold text-lg">CHOOSE FROM THE DROPDOWN ABOVE TO GET STARTED</p>
          </div>
        </div>
      )}
    </div>
  )
}
