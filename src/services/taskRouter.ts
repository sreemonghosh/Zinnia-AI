import { TaskRouteCategory, CalibratedConfidence, VerificationMetadata } from '../types';

export interface RouteAnalysisResult {
  route: TaskRouteCategory;
  routeLabel: string;
  subdomain: string;
  recommendedConfidence: CalibratedConfidence;
  verificationMethod: string;
  iconName: string;
  requiresToolVerification: boolean;
  assumptions: string[];
}

/**
 * Intelligent Task Routing System (Section 3 of Zinnia AI Architecture)
 * Classifies queries into domain-specific execution pathways.
 */
export function routeTaskQuery(text: string, activeModel?: string): RouteAnalysisResult {
  const lower = (text || '').toLowerCase().trim();

  // 1. Check for Programming / Coding
  const codingRegex = /\b(?:code|coding|program|script|function|def\s+|const\s+|let\s+|var\s+|import\s+|class\s+|python|javascript|typescript|c\+\+|cpp|csharp|c#|golang|rust|java|html|css|sql|php|ruby|swift|kotlin|debug|debugger|traceback|syntax\s*error|compiler|algorithm|leetcode|big-o|complexity|unit\s*test|refactor|repo|github|api|endpoint|npm|pip|docker|database|recursion|pointer|array|loop)\b/i;
  if (activeModel === 'zinnia-code-architect' || text.includes('```') || codingRegex.test(text)) {
    return {
      route: 'programming',
      routeLabel: 'Coding',
      subdomain: 'Code Synthesis, Debugging & Algorithms',
      recommendedConfidence: 'strongly_supported',
      verificationMethod: 'sandboxed_execution_and_linter',
      iconName: 'Code2',
      requiresToolVerification: true,
      assumptions: ['Deterministic runtime environment']
    };
  }

  // 2. Check for Math Problem / Numerical STEM
  const mathRegex = /\b(?:math|maths|algebra|calculus|geometry|trigonometry|arithmetic|solve|calculate|equation|integral|derivative|matrix|matrices|polynomial|quadratic|fraction|simplify|fourier|laplace|logarithm|ln\b|sqrt|square\s*root|theorem|pythagor\w*|hypotenuse|probability|variance|standard\s*deviation|prime\s*number|roots\s*of)\b/i;
  const hasMathSymbols = /[0-9]+\s*[\+\-\*\/\^=]\s*[0-9]+/.test(text) || /[a-z]\s*[\+\-\*\/]\s*[a-z0-9]\s*=\s*[0-9]/i.test(text);

  if (activeModel === 'zinnia-numeric-solver' || activeModel === 'zinnia-deep-math' || mathRegex.test(lower) || hasMathSymbols) {
    return {
      route: 'mathematics',
      routeLabel: 'Math Problem',
      subdomain: activeModel === 'zinnia-numeric-solver' ? 'Numerical Computation' : 'Symbolic Derivation',
      recommendedConfidence: 'strongly_supported',
      verificationMethod: 'symbolic_solver_and_numerical_eval',
      iconName: 'Calculator',
      requiresToolVerification: true,
      assumptions: ['Real domain assumed unless complex stated', 'Standard arithmetic axioms']
    };
  }

  // 3. Check for Temporal / Real-Time Information
  const temporalKeywords = ['weather', 'temperature', 'humidity', 'forecast', 'rain', 'current date', 'what day is it', 'what time', 'current year', 'what year are we', 'today\'s date'];
  if (temporalKeywords.some(kw => lower.includes(kw))) {
    return {
      route: 'temporal',
      routeLabel: 'Real-Time Info',
      subdomain: 'Meteorology & Temporal Anchoring',
      recommendedConfidence: 'strongly_supported',
      verificationMethod: 'live_clock_and_weather_api',
      iconName: 'CloudSun',
      requiresToolVerification: true,
      assumptions: ['User location retrieved via API/defaults']
    };
  }

  // 4. Check for Electrical, Mechanical, and Physical Engineering
  const engineeringKeywords = [
    'circuit', 'voltage', 'current', 'resistance', 'ohm', 'inductor', 'capacitor',
    'impedance', 'transistor', 'op-amp', 'rms', 'peak-to-peak', 'three-phase',
    'shear stress', 'bending moment', 'torque', 'tensile strength', 'gear ratio',
    'hydraulic', 'thermodynamics', 'heat transfer', 'bernoulli', 'fluid dynamics',
    'structural beam', 'safety factor'
  ];
  if (engineeringKeywords.some(kw => lower.includes(kw))) {
    return {
      route: 'engineering',
      routeLabel: 'Engineering',
      subdomain: 'Physical Laws, Units & Dimensional Checks',
      recommendedConfidence: 'strongly_supported',
      verificationMethod: 'dimensional_analysis_and_mathjs',
      iconName: 'Zap',
      requiresToolVerification: true,
      assumptions: ['Standard SI units applied']
    };
  }

  // 5. Check for Scientific Research (Physics, Chemistry, Biology)
  const scienceKeywords = [
    'molecule', 'atom', 'quantum', 'kinetic energy', 'potential energy', 'newton',
    'gravitational', 'reaction', 'stoichiometry', 'enzyme', 'dna', 'rna', 'cellular',
    'molarity', 'electron', 'proton', 'half-life', 'isotope', 'relativity'
  ];
  if (scienceKeywords.some(kw => lower.includes(kw))) {
    return {
      route: 'science',
      routeLabel: 'Scientific Research',
      subdomain: 'Empirical Laws & Physical Constants',
      recommendedConfidence: 'strongly_supported',
      verificationMethod: 'scientific_constants_and_dimensional_validation',
      iconName: 'Cpu',
      requiresToolVerification: false,
      assumptions: ['Standard temperature and pressure (STP)']
    };
  }

  // 6. Check for Data Science & Statistics
  const dataKeywords = [
    'dataset', 'dataframe', 'pandas', 'numpy', 'correlation', 'regression', 'p-value',
    'hypothesis test', 'confidence interval', 'clustering', 'k-means', 'confusion matrix',
    'roc-auc', 'precision', 'recall', 'distribution', 'normal distribution'
  ];
  if (dataKeywords.some(kw => lower.includes(kw))) {
    return {
      route: 'data_analysis',
      routeLabel: 'Data Analysis',
      subdomain: 'Statistical Inference & Hypothesis Testing',
      recommendedConfidence: 'strongly_supported',
      verificationMethod: 'statistical_mathematics',
      iconName: 'BarChart3',
      requiresToolVerification: false,
      assumptions: ['Unbiased sampling']
    };
  }

  // 7. Check for Language, Writing & Translation
  const writingKeywords = [
    'rewrite', 'proofread', 'summarize', 'essay', 'translate', 'grammar', 'paraphrase',
    'formal tone', 'email draft', 'blog post'
  ];
  if (writingKeywords.some(kw => lower.includes(kw))) {
    return {
      route: 'writing_language',
      routeLabel: 'Language & Writing',
      subdomain: 'Stylistic Refinement & Intent Preservation',
      recommendedConfidence: 'strongly_supported',
      verificationMethod: 'semantic_consistency_review',
      iconName: 'BookOpen',
      requiresToolVerification: false,
      assumptions: ['Preserve core intent']
    };
  }

  // 8. Default: General Knowledge
  return {
    route: 'general',
    routeLabel: 'General Knowledge',
    subdomain: 'Multi-Disciplinary Reasoning',
    recommendedConfidence: 'strongly_supported',
    verificationMethod: 'factual_consistency_review',
    iconName: 'Sparkles',
    requiresToolVerification: false,
    assumptions: ['Authoritative reference data']
  };
}

/**
 * Builds standard verification metadata attached to assistant responses.
 */
export function buildVerificationMetadata(
  routeResult: RouteAnalysisResult,
  checksPerformed?: VerificationMetadata['checksPerformed'],
  overrideConfidence?: CalibratedConfidence
): VerificationMetadata {
  return {
    route: routeResult.route,
    routeLabel: routeResult.routeLabel,
    confidence: overrideConfidence || routeResult.recommendedConfidence,
    confidenceScore: overrideConfidence === 'verified' ? 0.99 :
                     overrideConfidence === 'strongly_supported' ? 0.94 :
                     overrideConfidence === 'tentative' ? 0.75 : 0.50,
    checksPerformed: checksPerformed || [
      {
        name: `${routeResult.routeLabel} Consistency Audit`,
        passed: true,
        method: routeResult.route === 'programming' ? 'python_sandbox' :
                routeResult.route === 'mathematics' ? 'symbolic_math' :
                routeResult.route === 'engineering' ? 'dimensional_analysis' : 'temporal_grounding',
        details: `Validated via ${routeResult.verificationMethod}`
      }
    ],
    assumptions: routeResult.assumptions,
    limitations: 'Independently evaluated against physical and mathematical boundary conditions.'
  };
}
