import { CodingTask, SupportedLanguage } from '../types';

export interface CodingIntentResult {
  isCodingQuery: boolean;
  detectedLanguage?: SupportedLanguage | string;
  detectedTargetLanguage?: SupportedLanguage | string;
  task: CodingTask;
  confidence: number;
  extractedCode?: string;
  hasCodeBlock: boolean;
}

const LANGUAGE_PATTERNS: Record<SupportedLanguage, RegExp[]> = {
  python: [/\b(python|python3|py|pip|django|flask|fastapi|pandas|numpy|scipy|matplotlib|pytorch|tensorflow|pytest)\b/i],
  javascript: [/\b(javascript|js|node\.?js|express|react|vue|svelte|npm|yarn|vanilla js)\b/i],
  typescript: [/\b(typescript|ts|tsx|interface|type alias|generics)\b/i],
  cpp: [/\b(c\+\+|cpp|clang\+\+|g\+\+|stl|std::|vector<|cout|cin)\b/i],
  c: [/\b(c program|c code|printf|scanf|malloc|free|pointer|struct in c)\b/i],
  java: [/\b(java|jvm|spring|springboot|maven|gradle|system\.out\.println)\b/i],
  csharp: [/\b(c#|csharp|\.net|dotnet|asp\.net|unity c#)\b/i],
  go: [/\b(golang|go language|goroutine|go func|fmt\.println)\b/i],
  rust: [/\b(rust|rustlang|cargo|borrow checker|fn main|impl|trait)\b/i],
  sql: [/\b(sql|postgres|postgresql|mysql|sqlite|oracle|query|select \* from|inner join|group by|order by|database schema)\b/i],
  bash: [/\b(bash|shell|sh|powershell|terminal command|zsh|chmod|grep|awk|sed)\b/i],
  html: [/\b(html|html5|dom|markup|div|span|h1|form)\b/i],
  css: [/\b(css|css3|flexbox|grid|tailwind|styling|keyframes)\b/i],
  php: [/\b(php|laravel|symfony|wordpress)\b/i],
  ruby: [/\b(ruby|rails|gem|activerecord)\b/i],
  kotlin: [/\b(kotlin|android studio|coroutine|jetpack compose)\b/i],
  swift: [/\b(swift|swiftui|xcode|cocoa|ios dev)\b/i],
  dart: [/\b(dart|flutter|widget)\b/i],
  r: [/\b(r language|rstats|ggplot2|tidyverse)\b/i],
  json: [/\b(json|parse json|stringify)\b/i],
  yaml: [/\b(yaml|yml|ansible|kubernetes manifest)\b/i],
  dockerfile: [/\b(docker|dockerfile|docker-compose|containerize)\b/i],
  markdown: [/\b(markdown|md file|readme)\b/i]
};

const TASK_PATTERNS: { task: CodingTask; patterns: RegExp[] }[] = [
  {
    task: 'debugger',
    patterns: [
      /\b(error|exception|bug|fix|debug|traceback|crash|segfault|segmentation fault|nullpointer|indexerror|typeerror|syntaxerror|why (is|does) (this|my) (code|program) (fail|not work|broken|throwing))\b/i,
      /\b(fix this|correct this|what's wrong with|find the bug|resolve the error)\b/i
    ]
  },
  {
    task: 'converter',
    patterns: [
      /\b(convert|rewrite|translate|port|switch)\s+(this|the)?\s*([a-z0-9#+]+)?\s*(code|program|function|script)?\s*(in|to|into)\s+([a-z0-9#+]+)\b/i,
      /\bfrom\s+([a-z0-9#+]+)\s+to\s+([a-z0-9#+]+)\b/i
    ]
  },
  {
    task: 'optimizer',
    patterns: [
      /\b(optimize|speed up|faster|reduce (time|space|memory)|performance|make (this|it) efficient|clean up (this|my) code|refactor)\b/i
    ]
  },
  {
    task: 'explainer',
    patterns: [
      /\b(explain (this|the)?\s*(code|function|program|snippet)|how does this (work|code work)|break down (this|the) code|line by line explanation)\b/i
    ]
  },
  {
    task: 'dsa',
    patterns: [
      /\b(dsa|algorithm|data structure|binary search|dijkstra|dp|dynamic programming|leetcode|tree|graph|linked list|stack|queue|heap|sort|bfs|dfs|time complexity|space complexity|big-o|o\(n\))\b/i
    ]
  },
  {
    task: 'tester',
    patterns: [
      /\b(unit test|test cases|write tests|jest|pytest|junit|integration test|mock|edge cases for this (function|code))\b/i
    ]
  },
  {
    task: 'sql',
    patterns: [
      /\b(sql|database|query|table schema|relational|primary key|foreign key|join tables|index optimization)\b/i
    ]
  },
  {
    task: 'project',
    patterns: [
      /\b(build a (full-?stack|web|mobile|desktop|cli|backend|frontend|api|app)|project structure|scaffold|folder structure|architecture for|complete application)\b/i
    ]
  },
  {
    task: 'interview',
    patterns: [
      /\b(interview (question|prep|problem)|coding challenge|mock interview|system design interview|technical screening)\b/i
    ]
  },
  {
    task: 'generator',
    patterns: [
      /\b(write (a|an)?\s*(program|code|function|script|class|module)|create (a|an)?\s*(program|code|function|script)|implement|code for|how to code|generate)\b/i
    ]
  }
];

export function detectCodingIntent(prompt: string, currentSessionModel?: string): CodingIntentResult {
  if (!prompt || typeof prompt !== 'string') {
    return { isCodingQuery: false, task: 'auto', confidence: 0, hasCodeBlock: false };
  }

  const trimmed = prompt.trim();
  const codeBlockMatch = trimmed.match(/```([a-zA-Z0-9_+#-]*)?\n([\s\S]*?)```/);
  const hasCodeBlock = !!codeBlockMatch;
  const extractedCode = codeBlockMatch ? codeBlockMatch[2] : undefined;
  const codeBlockLang = codeBlockMatch ? codeBlockMatch[1]?.toLowerCase() : undefined;

  // Check language detection
  let detectedLanguage: SupportedLanguage | string | undefined = undefined;
  if (codeBlockLang && codeBlockLang in LANGUAGE_PATTERNS) {
    detectedLanguage = codeBlockLang;
  }

  if (!detectedLanguage) {
    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      if (patterns.some(p => p.test(trimmed))) {
        detectedLanguage = lang as SupportedLanguage;
        break;
      }
    }
  }

  // Detect conversion target language if converter pattern matches
  let detectedTargetLanguage: SupportedLanguage | string | undefined = undefined;
  const convertMatch = trimmed.match(/(?:to|into)\s+([a-zA-Z0-9#+]+)/i);
  if (convertMatch) {
    const rawTarget = convertMatch[1].toLowerCase();
    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      if (patterns.some(p => p.test(rawTarget))) {
        detectedTargetLanguage = lang;
        break;
      }
    }
  }

  // Detect task mode
  let matchedTask: CodingTask = 'auto';
  let taskConfidence = 0;

  for (const item of TASK_PATTERNS) {
    if (item.patterns.some(p => p.test(trimmed))) {
      matchedTask = item.task;
      taskConfidence = 0.85;
      break;
    }
  }

  // Determine if it is a coding query
  const generalCodingKeywords = /\b(code|coding|programmer|programming|function|syntax|variable|compile|compiler|runtime|library|framework|api|endpoint|git|github|terminal|bash|regex)\b/i;
  const isCodingQuery = 
    currentSessionModel === 'zinnia-code-architect' ||
    hasCodeBlock ||
    !!detectedLanguage ||
    matchedTask !== 'auto' ||
    generalCodingKeywords.test(trimmed);

  if (matchedTask === 'auto' && isCodingQuery) {
    matchedTask = hasCodeBlock ? 'explainer' : 'generator';
    taskConfidence = 0.7;
  }

  return {
    isCodingQuery,
    detectedLanguage,
    detectedTargetLanguage,
    task: matchedTask,
    confidence: isCodingQuery ? Math.max(taskConfidence, 0.75) : 0,
    extractedCode,
    hasCodeBlock
  };
}

export const LANGUAGE_DISPLAY_NAMES: Record<string, { name: string; ext: string; iconColor: string }> = {
  python: { name: 'Python', ext: 'py', iconColor: 'text-amber-500' },
  javascript: { name: 'JavaScript', ext: 'js', iconColor: 'text-yellow-400' },
  typescript: { name: 'TypeScript', ext: 'ts', iconColor: 'text-blue-500' },
  cpp: { name: 'C++', ext: 'cpp', iconColor: 'text-indigo-500' },
  c: { name: 'C', ext: 'c', iconColor: 'text-sky-500' },
  java: { name: 'Java', ext: 'java', iconColor: 'text-orange-500' },
  csharp: { name: 'C#', ext: 'cs', iconColor: 'text-emerald-500' },
  go: { name: 'Go', ext: 'go', iconColor: 'text-cyan-500' },
  rust: { name: 'Rust', ext: 'rs', iconColor: 'text-amber-600' },
  sql: { name: 'SQL', ext: 'sql', iconColor: 'text-purple-500' },
  bash: { name: 'Bash', ext: 'sh', iconColor: 'text-emerald-400' },
  html: { name: 'HTML', ext: 'html', iconColor: 'text-orange-600' },
  css: { name: 'CSS', ext: 'css', iconColor: 'text-blue-400' },
  php: { name: 'PHP', ext: 'php', iconColor: 'text-indigo-400' },
  ruby: { name: 'Ruby', ext: 'rb', iconColor: 'text-red-500' },
  kotlin: { name: 'Kotlin', ext: 'kt', iconColor: 'text-violet-500' },
  swift: { name: 'Swift', ext: 'swift', iconColor: 'text-orange-400' },
  dart: { name: 'Dart', ext: 'dart', iconColor: 'text-teal-400' },
  r: { name: 'R', ext: 'r', iconColor: 'text-blue-600' },
  json: { name: 'JSON', ext: 'json', iconColor: 'text-slate-400' },
  yaml: { name: 'YAML', ext: 'yml', iconColor: 'text-pink-400' },
  dockerfile: { name: 'Dockerfile', ext: 'dockerfile', iconColor: 'text-sky-400' },
  markdown: { name: 'Markdown', ext: 'md', iconColor: 'text-slate-300' }
};
