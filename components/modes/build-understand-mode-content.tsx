"use client"

import { useState, useEffect } from "react"
import {
  Play,
  CheckCircle,
  Circle,
  AlertCircle,
  Book,
  Terminal,
  Folder,
  Settings,
  ChevronDown,
  ChevronUp,
  Code,
  Rocket,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BuildStep } from "@/lib/api-client"
import { apiClient } from "@/lib/api-client"
import { useSession } from "@/lib/session-context"

interface BuildUnderstandModeContentProps {
  sessionId: string
  isSearching: boolean // This prop might become redundant, but keeping for now
}

export default function BuildUnderstandModeContent({ sessionId }: BuildUnderstandModeContentProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([])
  const [isLoadingBuildGuide, setIsLoadingBuildGuide] = useState(true)
  const [buildGuideError, setBuildGuideError] = useState<string | null>(null)
  const [showKeyFiles, setShowKeyFiles] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<number[]>([])

  // Fetch build guide on sessionId change
  useEffect(() => {
    const fetchBuildGuide = async () => {
      if (!sessionId) {
        setIsLoadingBuildGuide(false);
        return;
      }
      setIsLoadingBuildGuide(true)
      setBuildGuideError(null)
      try {
        const response = await apiClient.getBuildGuide(sessionId)
        if (response.success) {
          setBuildSteps(response.steps)
        } else {
          setBuildGuideError(response.message || "Failed to fetch build guide.")
        }
      } catch (error: any) {
        console.error("Error fetching build guide:", error)
        setBuildGuideError(error.message || "An unexpected error occurred while fetching the build guide.")
      } finally {
        setIsLoadingBuildGuide(false)
      }
    }

    fetchBuildGuide()
  }, [sessionId])

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex])
    }
    if (stepIndex < buildSteps.length - 1) {
      setCurrentStep(stepIndex + 1)
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return "completed"
    if (stepIndex === currentStep) return "current"
    return "pending"
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-[#00FF88]" />
      case "current":
        return <Play className="w-6 h-6 text-[#FF3F3F]" />
      default:
        return <Circle className="w-6 h-6 text-black" />
    }
  }

  const toggleStepExpansion = (index: number) => {
    setExpandedSteps(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] max-w-2xl">
          <p className="text-black font-black uppercase text-xl font-mono px-8">
            PLEASE UPLOAD A CODEBASE TO GENERATE A BUILD GUIDE.
          </p>
        </div>
      </div>
    )
  }

  if (isLoadingBuildGuide) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black bg-white mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-black animate-pulse"></div>
          </div>
          <p className="text-[#00ff88] font-black uppercase text-xl font-mono animate-pulse">GENERATING BUILD GUIDE...</p>
        </div>
      </div>
    )
  }

  if (buildGuideError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] max-w-2xl">
          <p className="text-[#ff3f3f] font-black uppercase text-xl font-mono px-8">
            ERROR: {buildGuideError.toUpperCase()}
          </p>
        </div>
      </div>
    )
  }

  if (buildSteps.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12 border-4 border-black bg-white shadow-[6px_6px_0px_#000000] max-w-2xl">
          <p className="text-black font-black uppercase text-xl font-mono px-8">
            NO BUILD STEPS FOUND FOR THIS CODEBASE. IT MIGHT BE TOO SMALL OR UNSUPPORTED.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-black font-mono tracking-tight">GUIDE</h2>
        <div className="bg-[#00ff88] border-2 border-black px-3 py-1 text-black font-black text-sm uppercase">
          {completedSteps.length}/{buildSteps.length} COMPLETED
        </div>
      </div>

      {/* Project Overview - Simplified */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center mb-4">
          <Book className="w-6 h-6 text-black mr-3" />
          <h3 className="text-xl font-black uppercase text-black">PROJECT OVERVIEW</h3>
        </div>
        <p className="text-black font-bold text-lg">This guide will walk you through the codebase.</p>
      </div>

      {/* Build Steps */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_#000000]">
        <h3 className="text-xl font-black uppercase text-black border-b-4 border-black p-4 flex items-center">
          <Terminal className="w-6 h-6 text-black mr-3" />
          BUILD STEPS
        </h3>
        <div className="p-6 space-y-6">
          {buildSteps.map((step, index) => {
            const status = getStepStatus(index)
            const isExpanded = expandedSteps.includes(index);
            return (
              <div
                key={index}
                className={`border-4 border-black p-4 transition-transform duration-300 ${status === "current" ? "shadow-[4px_4px_0px_#ff3f3f] bg-[#fff5f5]" : "shadow-[2px_2px_0px_#000000] bg-white"}`}
              >
                <button 
                  onClick={() => toggleStepExpansion(index)} 
                  className="w-full flex items-center justify-between cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center">
                    {getStepIcon(status)}
                    <h4 className="font-black text-black uppercase ml-2">
                      STEP {step.stepNumber}: {step.filePath.split('/').pop()}
                    </h4>
                  </div>
                  <div className="flex items-center">
                    {status === "current" && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleStepComplete(index); }}
                        className="bg-[#00ff88] border-2 border-black text-black font-black uppercase px-4 py-2 h-auto hover:bg-[#00e077] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000] mr-2"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        MARK COMPLETE
                      </Button>
                    )}
                    {isExpanded ? <ChevronUp className="w-6 h-6 text-black" /> : <ChevronDown className="w-6 h-6 text-black" />}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="mt-4 border-t-2 border-black pt-4">
                    <p className="text-black font-bold text-sm leading-relaxed mb-4">{step.explanation}</p>
                    {step.content && (
                      <div className="bg-black border-4 border-black p-4">
                        <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto text-[#00ff88] font-bold">
                          <code>{step.content}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Key Files Explained - Simplified */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_#000000]">
        <button
          onClick={() => setShowKeyFiles(!showKeyFiles)}
          className="w-full border-b-4 border-black p-4 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors"
        >
          <div className="flex items-center">
            <Folder className="w-6 h-6 text-black mr-3" />
            <h3 className="text-xl font-black uppercase text-black">KEY FILES EXPLAINED</h3>
          </div>
          {showKeyFiles ? <ChevronUp className="w-6 h-6 text-black" /> : <ChevronDown className="w-6 h-6 text-black" />}
        </button>

        {showKeyFiles && buildSteps.length > 0 && (
          <div className="p-6">
            <div className="grid gap-4">
              {buildSteps.map((step, index) => (
                <div key={index} className="border-2 border-black p-4 bg-[#F5F5F5]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-black uppercase">{step.filePath}</h4>
                    {/* Language and functions are not directly available from the simplified BuildStep */}
                    <span className="bg-black text-white px-2 py-1 text-xs font-black">CODE CHUNK</span>
                  </div>
                  <p className="text-black font-bold text-sm">
                    {step.explanation.substring(0, 150)}... {/* Show a snippet of explanation */}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {completedSteps.length === buildSteps.length && buildSteps.length > 0 && (
        <div className="bg-[#00ff88] border-4 border-black p-6 text-center shadow-[6px_6px_0px_#000000]">
          <Rocket className="w-16 h-16 text-black mx-auto mb-4" />
          <h3 className="text-3xl font-black uppercase text-black font-mono tracking-tight mb-2">BUILD GUIDE COMPLETE!</h3>
          <p className="text-black font-bold text-lg">YOU&apos;VE SUCCESSFULLY NAVIGATED THROUGH THE CODEBASE.</p>
        </div>
      )}
    </div>
  )
}
