export type Role = 'user' | 'assistant';

export type AIModel = 
  | 'gemini-3-flash-preview' 
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite-preview'
  | 'zinnia-numeric-solver'
  | 'zinnia-deep-math'
  | 'zinnia-code-architect';

export type CodingTask = 
  | 'auto' 
  | 'generator' 
  | 'debugger' 
  | 'explainer' 
  | 'dsa' 
  | 'converter' 
  | 'optimizer' 
  | 'project' 
  | 'tester' 
  | 'sql' 
  | 'interview';

export type SupportedLanguage = 
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'cpp'
  | 'c'
  | 'java'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'sql'
  | 'bash'
  | 'html'
  | 'css'
  | 'php'
  | 'ruby'
  | 'kotlin'
  | 'swift'
  | 'dart'
  | 'r'
  | 'json'
  | 'yaml'
  | 'dockerfile'
  | 'markdown';

export interface CodeExecutionRequest {
  code: string;
  language: string;
  stdin?: string;
}

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  durationMs: number;
  language: string;
  sandboxed: boolean;
}

export interface CodingMetadata {
  isCodingQuery?: boolean;
  task?: CodingTask;
  language?: string;
  targetLanguage?: string;
  complexity?: {
    time?: string;
    space?: string;
  };
  hasExecutableCode?: boolean;
  execution?: CodeExecutionResult;
  detectedAt?: number;
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export type ReasoningStyle = 
  | 'step-by-step' 
  | 'rigorous' 
  | 'conceptual' 
  | 'engineering' 
  | 'exam' 
  | 'revision';

export interface MathVerificationItem {
  success?: boolean;
  operation: string;
  expression: string;
  symbolicResult?: string;
  numericResult?: string;
  units?: string;
  verified: boolean;
  verificationType: 'symbolic' | 'numerical' | 'dimensional' | 'unverified';
  details: string;
  latex?: string;
}

export interface ReasoningMetadata {
  isReasoningMode?: boolean;
  reasoningStyle?: ReasoningStyle;
  provider?: string;
  model?: string;
  verifiedResults?: MathVerificationItem[];
  status?: 'success' | 'server_unavailable' | 'error';
  errorMessage?: string;
}

export type TaskRouteCategory = 
  | 'general'
  | 'temporal'
  | 'mathematics'
  | 'programming'
  | 'engineering'
  | 'science'
  | 'data_analysis'
  | 'complex_project'
  | 'writing_language';

export type CalibratedConfidence = 
  | 'verified'          // Verified via actual tool execution (Python 3, mathjs, etc.)
  | 'strongly_supported'// Grounded in established scientific/mathematical laws and passes AI safety guidelines
  | 'not_supported'     // Conflicts with AI safety guidelines (e.g. NSFW, malware, harmful content)
  | 'tentative'         // Contains assumptions, approximations, or missing parameters
  | 'unknown';          // Insufficient information to state definitively

export interface SafetyAuditMetadata {
  isSafe: boolean;
  status: 'strongly_supported' | 'not_supported';
  category?: string;
  reason?: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  method: 'python_sandbox' | 'node_sandbox' | 'symbolic_math' | 'numerical_evaluation' | 'dimensional_analysis' | 'temporal_grounding' | 'lint_check' | string;
  details?: string;
  latencyMs?: number;
}

export interface VerificationMetadata {
  route?: TaskRouteCategory;
  routeLabel?: string;
  confidence?: CalibratedConfidence;
  confidenceScore?: number; // 0.0 - 1.0
  checksPerformed?: VerificationCheck[];
  assumptions?: string[];
  uncertainties?: string[];
  limitations?: string;
  safetyAudit?: SafetyAuditMetadata;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: string[]; // base64 strings or URLs
  type?: 'text' | 'vision';
  model?: AIModel | string;
  metadata?: {
    enhanced?: boolean;
    reasoning?: ReasoningMetadata;
    coding?: CodingMetadata;
    verification?: VerificationMetadata;
    weatherData?: any;
    [key: string]: any;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  topic?: string;
  model?: AIModel;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isSaved?: boolean;
  isArchived?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  password?: string; // In a real app, this would be hashed on the server
}
