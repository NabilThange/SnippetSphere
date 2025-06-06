"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatModeContentProps {
  sessionId: string
}

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

export default function ChatModeContent({ sessionId }: ChatModeContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      content: "HELLO! I'M YOUR AI ASSISTANT FOR THIS CODEBASE. ASK ME ANYTHING ABOUT YOUR CODE!",
      timestamp: new Date(),
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const addMessage = (content: string, type: "user" | "ai") => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const responses: Record<string, string> = {
      "what does this codebase do":
        "THIS CODEBASE APPEARS TO BE A WEB APPLICATION WITH USER AUTHENTICATION, DATA PROCESSING UTILITIES, AND API HANDLERS. THE MAIN COMPONENTS INCLUDE USER MANAGEMENT, JSON PROCESSING, AND REQUEST HANDLING.",
      "how many files are there":
        "I CAN SEE 4 MAIN FILES IN YOUR CODEBASE: UTILS.PY (PYTHON), HANDLERS.JS (JAVASCRIPT), USER.PY (PYTHON), AND AUTH.TSX (TYPESCRIPT). THERE ARE ALSO SEVERAL SUPPORTING FILES AND MODULES.",
      "what languages are used":
        "YOUR CODEBASE USES MULTIPLE LANGUAGES: PYTHON (FOR BACKEND UTILITIES AND MODELS), JAVASCRIPT (FOR API HANDLERS), AND TYPESCRIPT (FOR REACT COMPONENTS). THIS IS A FULL-STACK APPLICATION.",
      "show me the main functions":
        "THE MAIN FUNCTIONS INCLUDE: PARSE_JSON() FOR DATA PROCESSING, PROCESSDATA() FOR API HANDLING, USER.TO_JSON() FOR SERIALIZATION, AND USEAUTH() FOR AUTHENTICATION. EACH SERVES A SPECIFIC PURPOSE IN THE APPLICATION ARCHITECTURE.",
      "are there any security issues":
        "FROM MY ANALYSIS, THE CODE FOLLOWS GOOD SECURITY PRACTICES WITH INPUT VALIDATION, ERROR HANDLING, AND PROPER AUTHENTICATION PATTERNS. THE USER MODEL INCLUDES VALIDATION, AND THE API HANDLERS HAVE INPUT SANITIZATION.",
    }

    const defaultResponse =
      "I'M ANALYZING YOUR CODEBASE TO ANSWER THAT QUESTION. BASED ON THE FILES I CAN SEE, THIS APPEARS TO BE A WELL-STRUCTURED APPLICATION WITH PROPER SEPARATION OF CONCERNS. COULD YOU BE MORE SPECIFIC ABOUT WHAT YOU'D LIKE TO KNOW?"

    const response = responses[userMessage.toLowerCase()] || defaultResponse
    addMessage(response, "ai")
    setIsTyping(false)
  }

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, isTyping])

  // This function will be called from the parent component when user sends a message
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const userMessage = event.detail.message
      addMessage(userMessage, "user")
      simulateAIResponse(userMessage)
    }

    window.addEventListener("chatMessage", handleChatMessage as EventListener)
    return () => window.removeEventListener("chatMessage", handleChatMessage as EventListener)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black uppercase text-black font-mono tracking-tight">AI CHAT</h2>
        <div className="bg-[#00ff88] border-2 border-black px-3 py-1 text-black font-black text-sm uppercase">
          {messages.length} MESSAGE{messages.length !== 1 ? "S" : ""}
        </div>
      </div>

      <div className="flex-1 bg-white border-4 border-black shadow-[6px_6px_0px_#000000]">
        <ScrollArea ref={scrollAreaRef} className="h-[500px] p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] ${
                    message.type === "user"
                      ? "bg-[#ff3f3f] text-white border-4 border-black shadow-[4px_4px_0px_#000000]"
                      : "bg-[#00ff88] text-black border-4 border-black shadow-[4px_4px_0px_#000000]"
                  } p-4`}
                >
                  <div className="flex items-center mb-2">
                    {message.type === "user" ? <User className="w-5 h-5 mr-2" /> : <Bot className="w-5 h-5 mr-2" />}
                    <span className="font-black uppercase text-xs">
                      {message.type === "user" ? "YOU" : "AI ASSISTANT"}
                    </span>
                    <span className="ml-auto text-xs font-bold opacity-70">{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="font-bold leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#00ff88] text-black border-4 border-black shadow-[4px_4px_0px_#000000] p-4 max-w-[80%]">
                  <div className="flex items-center mb-2">
                    <Bot className="w-5 h-5 mr-2" />
                    <span className="font-black uppercase text-xs">AI ASSISTANT</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-black rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-black rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <span className="ml-2 font-bold text-sm">TYPING...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-6 text-center">
        <p className="text-black font-bold text-sm">USE THE SEARCH BAR BELOW TO SEND MESSAGES</p>
      </div>
    </div>
  )
}
