"use client"

import { useState } from "react"
import Header from "@/components/header"
import UploadSection from "@/components/upload-section"
import ModeSelector from "@/components/mode-selector"
import SearchInterface from "@/components/search-interface"
import ModeContent from "@/components/mode-content"
import SessionControls from "@/components/session-controls"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import type { SearchResult, SearchMode } from "@/lib/types"

export default function AppPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [currentMode, setCurrentMode] = useState<SearchMode>("build-understand")
  const { toast } = useToast()

  const handleUploadSuccess = (id: string) => {
    setSessionId(id)
    toast({
      title: "UPLOAD SUCCESSFUL",
      description: "YOUR CODEBASE HAS BEEN PROCESSED AND IS READY FOR ANALYSIS.",
      variant: "default",
    })
  }

  const handleUploadError = (error: string) => {
    toast({
      title: "UPLOAD FAILED",
      description: error.toUpperCase(),
      variant: "destructive",
    })
  }

  const handleSearch = async (query: string) => {
    if (!sessionId) return

    setIsSearching(true)
    setSearchQuery(query)

    try {
      // Handle chat mode differently
      if (currentMode === "chat") {
        // Dispatch custom event for chat mode
        window.dispatchEvent(new CustomEvent("chatMessage", { detail: { message: query } }))
        setIsSearching(false)
        return
      }

      // Build & Understand mode doesn't need search functionality
      if (currentMode === "build-understand") {
        setIsSearching(false)
        return
      }

      // Simulate API call for other modes
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock results based on mode
      const mockResults = getMockResultsByMode(currentMode, query)

      setResults(mockResults)
      toast({
        title: `${currentMode.toUpperCase()} COMPLETED`,
        description: `FOUND ${mockResults.length} RESULTS FOR "${query.toUpperCase()}"`,
      })
    } catch (error) {
      toast({
        title: `${currentMode.toUpperCase()} FAILED`,
        description: "AN ERROR OCCURRED. PLEASE TRY AGAIN.",
        variant: "destructive",
      })
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const getMockResultsByMode = (mode: SearchMode, query: string): SearchResult[] => {
    const baseResults = [
      {
        fileName: "utils.py",
        functionName: "parse_json",
        codeSnippet: `def parse_json(json_str):\n    """Parse JSON string and handle errors gracefully."""\n    try:\n        return json.loads(json_str)\n    except json.JSONDecodeError as e:\n        logger.error(f"Failed to parse JSON: {e}")\n        return None`,
        summary: "Parses JSON strings with error handling and logging.",
        linesOfCode: 8,
        language: "Python",
        tags: ["function", "json", "error-handling"],
        mode: mode,
      },
      {
        fileName: "api/handlers.js",
        functionName: "processData",
        codeSnippet: `function processData(data) {\n  if (!data || typeof data !== 'object') {\n    throw new Error('Invalid data format');\n  }\n  \n  const result = {\n    id: data.id,\n    name: data.name,\n    timestamp: new Date().toISOString()\n  };\n  \n  return result;\n}`,
        summary: "Validates and processes data objects, adding timestamps.",
        linesOfCode: 12,
        language: "JavaScript",
        tags: ["function", "validation", "data-processing"],
        mode: mode,
      },
    ]

    // Only return results for search mode, other modes handle their own content
    return mode === "search" ? baseResults : []
  }

  const handleClearSession = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Reset all states related to the session
    setSessionId(null)
    setResults([])
    setSearchQuery("")
    setIsUploading(false) // Reset the uploading state to show the upload interface
    setCurrentMode("build-understand") // Reset to default mode

    toast({
      title: "SESSION CLEARED",
      description: "YOUR UPLOADED CODEBASE AND ANALYSIS DATA HAVE BEEN DELETED.",
    })
  }

  const handleModeChange = (mode: SearchMode) => {
    setCurrentMode(mode)
    setResults([]) // Clear results when switching modes
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-white font-bold flex flex-col">
      <Header />

      {/* Add padding to account for fixed header */}
      <div className="pt-24">
        {sessionId && (
          <div className="border-b-4 border-black bg-white">
            <div className="container mx-auto px-4 max-w-5xl">
              <div className="flex justify-between items-center py-4">
                <div className="flex-1 flex justify-center">
                  <ModeSelector currentMode={currentMode} onModeChange={handleModeChange} />
                </div>
                <div className="ml-4">
                  <SessionControls sessionId={sessionId} onClearSession={handleClearSession} compact />
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 flex flex-col">
          {!sessionId ? (
            <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
              <UploadSection
                onUploadStart={() => setIsUploading(true)}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                isUploading={isUploading}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 container mx-auto px-4 py-6 pb-24 max-w-5xl overflow-y-auto">
                <ModeContent
                  mode={currentMode}
                  results={results}
                  query={searchQuery}
                  isSearching={isSearching}
                  sessionId={sessionId}
                />
              </div>

              {/* Only show search interface for modes that need it */}
              {currentMode !== "build-understand" && (
                <SearchInterface onSearch={handleSearch} isSearching={isSearching} currentMode={currentMode} />
              )}
            </>
          )}
        </main>

        {!sessionId && <Footer />}
        <Toaster />
      </div>
    </div>
  )
}
