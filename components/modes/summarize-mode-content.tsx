"use client"

import { useState } from "react"
import { FileText, RefreshCw, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import CodeSnippetDisplay from "@/components/code-snippet-display"

interface SummarizeModeContentProps {
  sessionId: string
  isSearching: boolean
}

interface FileItem {
  path: string
  name: string
  language: string
  functions: string[]
  codeSnippet: string
  mainFunction?: string
}

export default function SummarizeModeContent({ sessionId, isSearching }: SummarizeModeContentProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [summary, setSummary] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showFileList, setShowFileList] = useState(false)

  // Mock file data with code snippets
  const files: FileItem[] = [
    {
      path: "utils.py",
      name: "utils.py",
      language: "Python",
      functions: ["parse_json", "validate_data", "format_output"],
      mainFunction: "parse_json",
      codeSnippet: `def parse_json(json_str):
    """Parse JSON string and handle errors gracefully."""
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON: {e}")
        return None

def validate_data(data, schema):
    """Validate data against provided schema."""
    if not isinstance(data, dict):
        return False
    
    for key, expected_type in schema.items():
        if key not in data or not isinstance(data[key], expected_type):
            return False
    return True

def format_output(data, format_type="json"):
    """Format output data for different formats."""
    if format_type == "json":
        return json.dumps(data, indent=2)
    elif format_type == "csv":
        return convert_to_csv(data)
    else:
        return str(data)`,
    },
    {
      path: "api/handlers.js",
      name: "handlers.js",
      language: "JavaScript",
      functions: ["processData", "handleRequest", "validateInput"],
      mainFunction: "processData",
      codeSnippet: `function processData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format');
  }
  
  const result = {
    id: data.id,
    name: data.name,
    timestamp: new Date().toISOString()
  };
  
  return result;
}

function handleRequest(req, res) {
  try {
    const processedData = processData(req.body);
    res.status(200).json({
      success: true,
      data: processedData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

function validateInput(input) {
  const required = ['id', 'name'];
  return required.every(field => input.hasOwnProperty(field));
}`,
    },
    {
      path: "models/user.py",
      name: "user.py",
      language: "Python",
      functions: ["User.to_json", "User.validate", "User.create"],
      mainFunction: "User.to_json",
      codeSnippet: `class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def to_json(self):
        """Convert user object to JSON representation."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

    def validate(self):
        """Validate user data."""
        if not self.username or len(self.username) < 3:
            raise ValidationError("Username must be at least 3 characters")
        if not self.email or '@' not in self.email:
            raise ValidationError("Valid email required")

    @classmethod
    def create(cls, username, email):
        """Create new user instance."""
        user = cls(username=username, email=email)
        user.validate()
        user.save()
        return user`,
    },
    {
      path: "components/auth.tsx",
      name: "auth.tsx",
      language: "TypeScript",
      functions: ["useAuth", "AuthProvider", "LoginForm"],
      mainFunction: "useAuth",
      codeSnippet: `import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}`,
    },
  ]

  const generateSummary = async (filePath: string) => {
    setIsGenerating(true)
    setSummary("")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockSummaries: Record<string, string> = {
      "utils.py": `UTILS.PY SUMMARY:

This utility module provides essential data processing functions for the application. The main functions include:

• PARSE_JSON: Safely parses JSON strings with comprehensive error handling and logging
• VALIDATE_DATA: Performs data validation using predefined schemas and rules
• FORMAT_OUTPUT: Standardizes output formatting across the application

The module follows Python best practices with proper exception handling, type hints, and comprehensive documentation. It serves as a core dependency for data processing throughout the codebase.

DEPENDENCIES: json, logging, typing
LINES OF CODE: 156
COMPLEXITY: Medium`,

      "api/handlers.js": `HANDLERS.JS SUMMARY:

This API handler module manages HTTP request processing and routing for the web application. Key components include:

• PROCESSDATA: Main data processing endpoint with validation and transformation
• HANDLEREQUEST: Generic request handler with middleware support
• VALIDATEINPUT: Input validation and sanitization for all endpoints

The module implements RESTful API patterns with proper error handling, request validation, and response formatting. It uses Express.js middleware patterns for authentication and logging.

DEPENDENCIES: express, joi, lodash
LINES OF CODE: 234
COMPLEXITY: High`,

      "models/user.py": `USER.PY SUMMARY:

This model defines the User entity and related database operations. Core functionality includes:

• USER.TO_JSON: Serializes user objects to JSON format for API responses
• USER.VALIDATE: Validates user data against business rules and constraints
• USER.CREATE: Creates new user instances with proper validation and defaults

The model follows Django ORM patterns with custom managers, validation methods, and serialization. It includes proper field definitions, relationships, and business logic encapsulation.

DEPENDENCIES: django.db, django.contrib.auth
LINES OF CODE: 89
COMPLEXITY: Medium`,

      "components/auth.tsx": `AUTH.TSX SUMMARY:

This React authentication component provides user authentication functionality. Main exports include:

• USEAUTH: Custom hook for authentication state management
• AUTHPROVIDER: Context provider for authentication across the app
• LOGINFORM: Login form component with validation and error handling

The component uses React hooks, context API, and TypeScript for type safety. It implements JWT token management, automatic token refresh, and protected route handling.

DEPENDENCIES: react, react-router, axios
LINES OF CODE: 178
COMPLEXITY: Medium`,
    }

    setSummary(mockSummaries[filePath] || "NO SUMMARY AVAILABLE FOR THIS FILE.")
    setIsGenerating(false)
  }

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath)
    setShowFileList(false)
    generateSummary(filePath)
  }

  const handleRegenerateSummary = () => {
    if (selectedFile) {
      generateSummary(selectedFile)
    }
  }

  const getSelectedFileData = () => {
    return files.find((file) => file.path === selectedFile)
  }

  const selectedFileData = getSelectedFileData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-black font-mono tracking-tight">FILE SUMMARIES</h2>
        <div className="bg-[#00ff88] border-2 border-black px-3 py-1 text-black font-black text-sm uppercase">
          {files.length} FILES
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
            {selectedFile ? `SELECTED: ${selectedFile}` : "SELECT A FILE TO SUMMARIZE"}
          </div>
          <ChevronDown className={`w-6 h-6 transition-transform ${showFileList ? "rotate-180" : ""}`} />
        </Button>

        {showFileList && (
          <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white border-4 border-black shadow-[6px_6px_0px_#000000] max-h-64 overflow-y-auto">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => handleFileSelect(file.path)}
                className="w-full text-left p-4 border-b-2 border-black hover:bg-[#e0e0e0] transition-colors font-bold"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black uppercase text-black">{file.name}</div>
                    <div className="text-sm text-black opacity-70">{file.language}</div>
                  </div>
                  <div className="bg-black text-white px-2 py-1 text-xs font-black uppercase">
                    {file.functions.length} FUNCTIONS
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Code Snippet Display */}
      {selectedFileData && (
        <CodeSnippetDisplay
          fileName={selectedFileData.name}
          code={selectedFileData.codeSnippet}
          language={selectedFileData.language}
          functionName={selectedFileData.mainFunction}
        />
      )}

      {/* Summary Display */}
      {selectedFile && (
        <div className="bg-white border-4 border-black shadow-[6px_6px_0px_#000000]">
          <div className="border-b-4 border-black p-4 flex items-center justify-between">
            <h3 className="font-black uppercase text-black text-xl font-mono">
              SUMMARY OF {selectedFile.toUpperCase()}
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
            ) : (
              <ScrollArea className="h-[300px]">
                <pre className="text-black font-bold whitespace-pre-wrap leading-relaxed font-mono text-sm">
                  {summary}
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
