"use client"

import { useState } from "react"
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
import type { ProjectAnalysis } from "@/lib/types"

interface BuildUnderstandModeContentProps {
  sessionId: string
  isSearching: boolean
}

export default function BuildUnderstandModeContent({ sessionId, isSearching }: BuildUnderstandModeContentProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0)
  const [completedTutorialSteps, setCompletedTutorialSteps] = useState<number[]>([])
  const [showSetupInstructions, setShowSetupInstructions] = useState(true)
  const [showKeyFiles, setShowKeyFiles] = useState(false)

  // Mock project analysis data
  const projectAnalysis: ProjectAnalysis = {
    language: "JavaScript",
    framework: "React + Next.js",
    packageManager: "npm",
    dependencies: ["react", "next", "tailwindcss", "typescript"],
    environment: ["Node.js 18+", "npm 8+"],
    buildSteps: [
      {
        id: "1",
        title: "Install Node.js",
        description: "Set up the JavaScript runtime environment",
        explanation:
          "Node.js is required to run JavaScript outside the browser. This codebase needs Node.js 18 or higher to work properly.",
        status: "pending",
        troubleshooting: [
          "Download from nodejs.org",
          "Verify installation with: node --version",
          "Should show v18.0.0 or higher",
        ],
      },
      {
        id: "2",
        title: "Install Dependencies",
        description: "Download all required packages",
        command: "npm install",
        explanation:
          "This command reads package.json and downloads all the libraries this project needs. It creates a node_modules folder with all dependencies.",
        status: "pending",
        troubleshooting: [
          "Make sure you're in the project root directory",
          "If errors occur, try: npm cache clean --force",
          "Delete node_modules and package-lock.json, then retry",
        ],
      },
      {
        id: "3",
        title: "Set Up Environment",
        description: "Configure environment variables",
        command: "cp .env.example .env.local",
        explanation:
          "Environment variables store configuration like API keys and database URLs. Copy the example file and fill in your actual values.",
        status: "pending",
        troubleshooting: [
          "Create .env.local if .env.example doesn't exist",
          "Never commit real API keys to version control",
          "Check the README for required environment variables",
        ],
      },
      {
        id: "4",
        title: "Start Development Server",
        description: "Run the application locally",
        command: "npm run dev",
        explanation:
          "This starts a local development server, usually on http://localhost:3000. The server watches for file changes and automatically reloads.",
        status: "pending",
        troubleshooting: [
          "Check if port 3000 is already in use",
          "Look for error messages in the terminal",
          "Make sure all previous steps completed successfully",
        ],
      },
    ],
    keyFiles: [
      {
        path: "package.json",
        name: "package.json",
        language: "JSON",
        functions: ["dependencies", "scripts", "metadata"],
      },
      {
        path: "next.config.js",
        name: "next.config.js",
        language: "JavaScript",
        functions: ["configuration", "build settings"],
      },
      {
        path: "tailwind.config.js",
        name: "tailwind.config.js",
        language: "JavaScript",
        functions: ["styling configuration"],
      },
    ],
  }

  // Tutorial steps for building the project
  const tutorialSteps = [
    {
      id: "1",
      title: "Understanding the Project Structure",
      description: "Learn how the files and folders are organized",
      explanation:
        "This Next.js project follows a standard structure with pages in the 'app' directory, components in 'components', and configuration files in the root.",
      tasks: [
        "Explore the 'app' directory - this contains your pages",
        "Check the 'components' directory for reusable UI components",
        "Look at the 'public' directory for static assets like images",
      ],
    },
    {
      id: "2",
      title: "Exploring the Main Components",
      description: "Understand the key React components",
      explanation:
        "React components are the building blocks of this application. Each component handles a specific part of the user interface.",
      tasks: [
        "Open 'app/page.tsx' - this is your homepage",
        "Look at 'app/layout.tsx' - this wraps all pages",
        "Explore components in the 'components' folder",
      ],
    },
    {
      id: "3",
      title: "Understanding Styling with Tailwind",
      description: "Learn how the app is styled",
      explanation:
        "This project uses Tailwind CSS for styling. Classes like 'bg-blue-500' and 'text-white' control the appearance.",
      tasks: [
        "Look for 'className' attributes in components",
        "Check 'tailwind.config.js' for custom configurations",
        "Open 'app/globals.css' to see global styles",
      ],
    },
    {
      id: "4",
      title: "Making Your First Change",
      description: "Modify the homepage to see live updates",
      explanation: "With the dev server running, any changes you make will automatically appear in your browser.",
      tasks: [
        "Open 'app/page.tsx' in your code editor",
        "Change the main heading text",
        "Save the file and watch the browser update automatically",
      ],
    },
    {
      id: "5",
      title: "Adding a New Component",
      description: "Create your own React component",
      explanation:
        "Components help organize your code and make it reusable. Let's create a simple component to understand the pattern.",
      tasks: [
        "Create a new file 'components/welcome.tsx'",
        "Write a simple component that returns some JSX",
        "Import and use it in your main page",
      ],
    },
  ]

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex])
    }
    if (stepIndex < projectAnalysis.buildSteps.length - 1) {
      setCurrentStep(stepIndex + 1)
    }
  }

  const handleTutorialStepComplete = (stepIndex: number) => {
    if (!completedTutorialSteps.includes(stepIndex)) {
      setCompletedTutorialSteps([...completedTutorialSteps, stepIndex])
    }
    if (stepIndex < tutorialSteps.length - 1) {
      setCurrentTutorialStep(stepIndex + 1)
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return "completed"
    if (stepIndex === currentStep) return "current"
    return "pending"
  }

  const getTutorialStepStatus = (stepIndex: number) => {
    if (completedTutorialSteps.includes(stepIndex)) return "completed"
    if (stepIndex === currentTutorialStep) return "current"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-black font-mono tracking-tight">GUIDE</h2>
        <div className="bg-[#00ff88] border-2 border-black px-3 py-1 text-black font-black text-sm uppercase">
          {completedSteps.length + completedTutorialSteps.length}/
          {projectAnalysis.buildSteps.length + tutorialSteps.length} COMPLETED
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center mb-4">
          <Book className="w-6 h-6 text-black mr-3" />
          <h3 className="text-xl font-black uppercase text-black">PROJECT OVERVIEW</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-black text-black mb-2 uppercase">Technology Stack</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-bold text-black">Language:</span>
                <span className="ml-2 bg-[#3178c6] text-white px-2 py-1 text-xs font-black border-2 border-black">
                  {projectAnalysis.language}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-black">Framework:</span>
                <span className="ml-2 bg-black text-white px-2 py-1 text-xs font-black border-2 border-black">
                  {projectAnalysis.framework}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-black">Package Manager:</span>
                <span className="ml-2 bg-[#FF3F3F] text-white px-2 py-1 text-xs font-black border-2 border-black">
                  {projectAnalysis.packageManager}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-black text-black mb-2 uppercase">Requirements</h4>
            <div className="space-y-1">
              {projectAnalysis.environment.map((req, index) => (
                <div key={index} className="flex items-center">
                  <Settings className="w-4 h-4 text-black mr-2" />
                  <span className="font-bold text-black text-sm">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions - Collapsible */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_#000000]">
        <button
          onClick={() => setShowSetupInstructions(!showSetupInstructions)}
          className="w-full border-b-4 border-black p-4 flex items-center justify-between hover:bg-[#F5F5F5] transition-colors"
        >
          <div className="flex items-center">
            <Terminal className="w-6 h-6 text-black mr-3" />
            <h3 className="text-xl font-black uppercase text-black">SETUP INSTRUCTIONS</h3>
          </div>
          {showSetupInstructions ? (
            <ChevronUp className="w-6 h-6 text-black" />
          ) : (
            <ChevronDown className="w-6 h-6 text-black" />
          )}
        </button>

        {showSetupInstructions && (
          <div className="p-6">
            <div className="space-y-6">
              {projectAnalysis.buildSteps.map((step, index) => {
                const status = getStepStatus(index)
                return (
                  <div
                    key={step.id}
                    className={`border-4 border-black p-4 ${
                      status === "current" ? "bg-[#FFFF00]" : status === "completed" ? "bg-[#00FF88]" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        {getStepIcon(status)}
                        <div className="ml-3">
                          <h4 className="font-black text-black uppercase">
                            STEP {index + 1}: {step.title}
                          </h4>
                          <p className="font-bold text-black text-sm">{step.description}</p>
                        </div>
                      </div>
                      {status === "current" && (
                        <Button
                          onClick={() => handleStepComplete(index)}
                          className="bg-[#FF3F3F] border-2 border-black text-white font-black uppercase px-4 py-2 h-auto hover:bg-[#E03535] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000]"
                        >
                          MARK COMPLETE
                        </Button>
                      )}
                    </div>

                    {step.command && (
                      <div className="mb-3">
                        <div className="bg-black text-[#00FF88] p-3 border-2 border-black font-mono text-sm">
                          <span className="text-white">$ </span>
                          {step.command}
                        </div>
                      </div>
                    )}

                    <p className="text-black font-bold text-sm leading-relaxed mb-3">{step.explanation}</p>

                    {step.troubleshooting && (
                      <div className="border-2 border-black bg-[#FFF3CD] p-3">
                        <div className="flex items-center mb-2">
                          <AlertCircle className="w-4 h-4 text-black mr-2" />
                          <span className="font-black text-black text-xs uppercase">Troubleshooting Tips</span>
                        </div>
                        <ul className="space-y-1">
                          {step.troubleshooting.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-black font-bold text-xs flex items-start">
                              <span className="mr-2">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tutorial Section - New */}
      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_#000000]">
        <div className="border-b-4 border-black p-4">
          <div className="flex items-center">
            <Rocket className="w-6 h-6 text-black mr-3" />
            <h3 className="text-xl font-black uppercase text-black">TUTORIAL</h3>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {tutorialSteps.map((step, index) => {
              const status = getTutorialStepStatus(index)
              return (
                <div
                  key={step.id}
                  className={`border-4 border-black p-4 ${
                    status === "current" ? "bg-[#E6E6FA]" : status === "completed" ? "bg-[#00FF88]" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {getStepIcon(status)}
                      <div className="ml-3">
                        <h4 className="font-black text-black uppercase">
                          TUTORIAL {index + 1}: {step.title}
                        </h4>
                        <p className="font-bold text-black text-sm">{step.description}</p>
                      </div>
                    </div>
                    {status === "current" && (
                      <Button
                        onClick={() => handleTutorialStepComplete(index)}
                        className="bg-[#8A2BE2] border-2 border-black text-white font-black uppercase px-4 py-2 h-auto hover:bg-[#7B1FA2] hover:transform hover:translate-y-1 transition-all duration-300 shadow-[2px_2px_0px_#000000] hover:shadow-[1px_1px_0px_#000000]"
                      >
                        COMPLETE
                      </Button>
                    )}
                  </div>

                  <p className="text-black font-bold text-sm leading-relaxed mb-3">{step.explanation}</p>

                  <div className="border-2 border-black bg-[#F0F8FF] p-3">
                    <div className="flex items-center mb-2">
                      <Code className="w-4 h-4 text-black mr-2" />
                      <span className="font-black text-black text-xs uppercase">Tasks to Complete</span>
                    </div>
                    <ul className="space-y-1">
                      {step.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="text-black font-bold text-xs flex items-start">
                          <span className="mr-2">✓</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Key Files Explanation - Collapsible */}
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

        {showKeyFiles && (
          <div className="p-6">
            <div className="grid gap-4">
              {projectAnalysis.keyFiles.map((file, index) => (
                <div key={index} className="border-2 border-black p-4 bg-[#F5F5F5]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-black uppercase">{file.name}</h4>
                    <span className="bg-black text-white px-2 py-1 text-xs font-black">{file.language}</span>
                  </div>
                  <p className="text-black font-bold text-sm">
                    {file.name === "package.json" &&
                      "Defines project dependencies, scripts, and metadata. This is the heart of any Node.js project."}
                    {file.name === "next.config.js" &&
                      "Configuration file for Next.js framework. Controls build settings, routing, and optimizations."}
                    {file.name === "tailwind.config.js" &&
                      "Configuration for Tailwind CSS framework. Defines custom colors, spacing, and design tokens."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {completedSteps.length === projectAnalysis.buildSteps.length &&
        completedTutorialSteps.length === tutorialSteps.length && (
          <div className="bg-[#00FF88] border-4 border-black p-6 shadow-[6px_6px_0px_#000000] text-center">
            <CheckCircle className="w-12 h-12 text-black mx-auto mb-4" />
            <h3 className="text-2xl font-black uppercase text-black mb-2">CONGRATULATIONS!</h3>
            <p className="text-black font-bold text-lg">
              You've completed both the setup and tutorial! You're now ready to build amazing things with this codebase.
            </p>
          </div>
        )}
    </div>
  )
}
